import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { initDatabase } from "./db/database.js";

async function bootstrap() {
  await initDatabase();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Telegram Admin backend listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
