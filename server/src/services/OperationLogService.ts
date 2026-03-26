import { env } from "../config/env.js";
import { database } from "../db/database.js";

type OperationStatus = "success" | "error" | "info";

type OperationLogRow = {
  id: number;
  action: string;
  status: OperationStatus;
  message: string;
  payload: string | null;
  created_at: string;
};

export type OperationLog = {
  id: number;
  action: string;
  status: OperationStatus;
  message: string;
  payload: unknown;
  createdAt: string;
};

function safeParsePayload(payload: string | null) {
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

export class OperationLogService {
  list(limit = env.LOG_LIMIT): OperationLog[] {
    const rows = database.all<OperationLogRow>(
      `
        SELECT id, action, status, message, payload, created_at
        FROM operation_logs
        ORDER BY id DESC
        LIMIT ?;
      `,
      [limit]
    );

    return rows.map((row) => ({
      id: Number(row.id),
      action: row.action,
      status: row.status,
      message: row.message,
      payload: safeParsePayload(row.payload),
      createdAt: row.created_at
    }));
  }

  record(action: string, status: OperationStatus, message: string, payload?: unknown) {
    database.execute(
      `
        INSERT INTO operation_logs (action, status, message, payload, created_at)
        VALUES (?, ?, ?, ?, ?);
      `,
      [
        action,
        status,
        message,
        payload === undefined ? null : JSON.stringify(payload),
        new Date().toISOString()
      ]
    );
  }
}

export const operationLogService = new OperationLogService();
