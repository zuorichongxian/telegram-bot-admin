import fs from "node:fs";
import path from "node:path";

import initSqlJs from "sql.js";

import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

type BindParams = import("sql.js").BindParams;
type SqlDatabase = import("sql.js").Database;

class DatabaseManager {
  private db: SqlDatabase | null = null;

  async init() {
    if (this.db) {
      return;
    }

    fs.mkdirSync(path.dirname(env.databaseFile), { recursive: true });

    const SQL = await initSqlJs({
      locateFile: (file) => path.join(env.projectRoot, "node_modules", "sql.js", "dist", file)
    });

    const existingData = fs.existsSync(env.databaseFile)
      ? fs.readFileSync(env.databaseFile)
      : undefined;

    this.db = existingData ? new SQL.Database(existingData) : new SQL.Database();

    this.db.run("PRAGMA foreign_keys = ON;");
    this.createSchema();
    this.persist();
  }

  private createSchema() {
    const now = new Date().toISOString();

    this.database.run(`
      CREATE TABLE IF NOT EXISTS bot_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        avatar_path TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS bots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bot_user_id TEXT NOT NULL,
        username TEXT,
        display_name TEXT NOT NULL,
        bot_token TEXT NOT NULL,
        session_string TEXT NOT NULL DEFAULT '',
        current_profile_id INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS identities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        avatar_path TEXT,
        message_template TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS operation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT NOT NULL,
        payload TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS session_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        session_string TEXT NOT NULL DEFAULT '',
        is_authorized INTEGER NOT NULL DEFAULT 0,
        phone_number TEXT,
        me_json TEXT,
        pending_session_string TEXT,
        pending_phone_number TEXT,
        pending_phone_code_hash TEXT,
        pending_is_code_via_app INTEGER NOT NULL DEFAULT 0,
        pending_requires_password INTEGER NOT NULL DEFAULT 0,
        current_identity_id INTEGER,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS payment_callbacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        merchant_no TEXT NOT NULL,
        merchant_order_no TEXT NOT NULL,
        system_order_no TEXT,
        order_amount TEXT NOT NULL,
        order_status INTEGER NOT NULL,
        sign TEXT NOT NULL,
        raw_data TEXT NOT NULL,
        verified INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS payment2_callbacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mch_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        trade_no TEXT NOT NULL,
        out_trade_no TEXT NOT NULL,
        amount TEXT NOT NULL,
        pay_amount TEXT NOT NULL,
        state INTEGER NOT NULL,
        create_time TEXT NOT NULL,
        pay_time TEXT,
        sign TEXT NOT NULL,
        raw_data TEXT NOT NULL,
        verified INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_bots_bot_user_id ON bots (bot_user_id);
      CREATE INDEX IF NOT EXISTS idx_payment_callbacks_merchant_order_no ON payment_callbacks (merchant_order_no);
      CREATE INDEX IF NOT EXISTS idx_payment_callbacks_created_at ON payment_callbacks (created_at);
      CREATE INDEX IF NOT EXISTS idx_payment2_callbacks_out_trade_no ON payment2_callbacks (out_trade_no);
      CREATE INDEX IF NOT EXISTS idx_payment2_callbacks_created_at ON payment2_callbacks (created_at);
    `);

    this.database.run(
      `
        INSERT OR IGNORE INTO session_state (
          id,
          session_string,
          is_authorized,
          pending_is_code_via_app,
          pending_requires_password,
          updated_at
        )
        VALUES (1, '', 0, 0, 0, ?);
      `,
      [now]
    );
  }

  get database() {
    if (!this.db) {
      throw new AppError(500, "SQLite 数据库尚未初始化。");
    }

    return this.db;
  }

  execute(sql: string, params?: BindParams) {
    this.database.run(sql, params);
    this.persist();
  }

  insert(sql: string, params?: BindParams) {
    this.database.run(sql, params);

    const inserted = this.get<{ id: number | string | bigint }>("SELECT last_insert_rowid() AS id;");

    this.persist();

    const id = inserted ? Number(inserted.id) : NaN;

    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError(500, "无法获取新插入记录的 ID。");
    }

    return id;
  }

  get<T>(sql: string, params?: BindParams): T | null {
    const statement = this.database.prepare(sql, params);

    try {
      if (!statement.step()) {
        return null;
      }

      return statement.getAsObject() as T;
    } finally {
      statement.free();
    }
  }

  all<T>(sql: string, params?: BindParams): T[] {
    const statement = this.database.prepare(sql, params);
    const rows: T[] = [];

    try {
      while (statement.step()) {
        rows.push(statement.getAsObject() as T);
      }
    } finally {
      statement.free();
    }

    return rows;
  }

  transaction<T>(callback: () => T): T {
    this.database.run("BEGIN TRANSACTION;");

    try {
      const result = callback();
      this.database.run("COMMIT;");
      this.persist();
      return result;
    } catch (error) {
      this.database.run("ROLLBACK;");
      throw error;
    }
  }

  persist() {
    const data = this.database.export();
    fs.writeFileSync(env.databaseFile, Buffer.from(data));
  }
}

export const database = new DatabaseManager();

export async function initDatabase() {
  await database.init();
}
