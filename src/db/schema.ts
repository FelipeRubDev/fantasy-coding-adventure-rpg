import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  score: integer("score").notNull().default(0),
  level: integer("level").notNull().default(1),
  save: jsonb("save").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tavernBoards = pgTable("tavern_boards", {
  slot: integer("slot").primaryKey(),
  questIds: jsonb("quest_ids").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
