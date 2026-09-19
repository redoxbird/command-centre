// Drizzle sqlite-core tables — task C1 (lean model).
// commands: the index ONLY (id/command/title/description/source_folder/tags
// + created_at/updated_at). All other command metadata lives in sidecars.
// settings/hub_*/publish_* stay in SQLite (per plan decision 3).
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const commands = sqliteTable("commands", {
  id: text("id").primaryKey(),
  command: text("command").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  source_folder: text("source_folder").notNull().default(""),
  /** JSON array of strings. */
  tags: text("tags").notNull().default("[]"),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const hubCache = sqliteTable("hub_cache", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updated_at: integer("updated_at").notNull(),
});

export const hubState = sqliteTable("hub_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const publishQueue = sqliteTable("publish_queue", {
  id: text("id").primaryKey(),
  status: text("status").notNull().default("pending"),
  payload: text("payload").notNull(),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull(),
});

export const publishStatus = sqliteTable("publish_status", {
  command_id: text("command_id").primaryKey(),
  status: text("status").notNull(),
  submission_id: text("submission_id"),
  updated_at: integer("updated_at").notNull(),
});
