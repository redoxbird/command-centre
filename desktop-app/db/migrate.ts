// Applies db/migrations/ to the app-data SQLite file. Run: deno task db:migrate
import { closeDatabase, dbFilePath, openDatabase } from "./db.ts";

const db = await openDatabase();
console.log("migrated", dbFilePath());
await closeDatabase();
export { db };
