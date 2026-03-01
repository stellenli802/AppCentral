export * from "./models/auth";

import { pgTable, text, varchar, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { users } from "./models/auth";

export const miniApps = pgTable("mini_apps", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  category: text("category").notNull(),
  url: text("url").notNull(),
  permissions: text("permissions").array().notNull().default(sql`'{}'::text[]`),
  allowedOrigins: text("allowed_origins").array().notNull().default(sql`'{}'::text[]`),
  version: text("version").notNull().default("1.0.0"),
  developer: text("developer").notNull(),
  intents: text("intents").array().notNull().default(sql`'{}'::text[]`),
  rating: integer("rating").notNull().default(0),
  downloads: integer("downloads").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  miniAppId: varchar("mini_app_id").notNull().references(() => miniApps.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appPermissions = pgTable("app_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  miniAppId: varchar("mini_app_id").notNull(),
  permission: text("permission").notNull(),
  granted: boolean("granted").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  miniAppId: varchar("mini_app_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: jsonb("data"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMiniAppSchema = createInsertSchema(miniApps).omit({
  rating: true,
  downloads: true,
  isActive: true,
});
export const insertFavoriteSchema = createInsertSchema(favorites).pick({
  userId: true,
  miniAppId: true,
});
export const insertAppPermissionSchema = createInsertSchema(appPermissions).pick({
  userId: true,
  miniAppId: true,
  permission: true,
  granted: true,
});
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  miniAppId: varchar("mini_app_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  icon: text("icon"),
  data: jsonb("data"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  miniAppId: true,
  title: true,
  body: true,
  data: true,
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  miniAppId: true,
  title: true,
  body: true,
  icon: true,
  data: true,
  expiresAt: true,
});

export type MiniApp = typeof miniApps.$inferSelect;
export type InsertMiniApp = z.infer<typeof insertMiniAppSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type AppPermission = typeof appPermissions.$inferSelect;
export type InsertAppPermission = z.infer<typeof insertAppPermissionSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export const PERMISSION_NAMES = ["location", "auth"] as const;
export type PermissionName = typeof PERMISSION_NAMES[number];

export const postMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("AUTH_CODE_REQUEST"),
    requestId: z.string(),
    origin: z.string(),
  }),
  z.object({
    type: z.literal("AUTH_CODE_RESPONSE"),
    requestId: z.string(),
    code: z.string().optional(),
    error: z.string().optional(),
  }),
  z.object({
    type: z.literal("LOCATION_REQUEST"),
    requestId: z.string(),
    origin: z.string(),
  }),
  z.object({
    type: z.literal("LOCATION_RESPONSE"),
    requestId: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    error: z.string().optional(),
  }),
  z.object({
    type: z.literal("HOST_ERROR"),
    requestType: z.string(),
    code: z.string(),
    message: z.string(),
  }),
  z.object({
    type: z.literal("NOTIFICATION_SEND"),
    requestId: z.string().optional(),
    title: z.string(),
    body: z.string(),
    data: z.record(z.string()).optional(),
  }),
  z.object({
    type: z.literal("NOTIFICATION_ACK"),
    requestId: z.string().optional(),
    success: z.boolean(),
  }),
  z.object({
    type: z.literal("READY"),
  }),
  z.object({
    type: z.literal("PUBLISH_ACTIVITY"),
    requestId: z.string().optional(),
    title: z.string(),
    body: z.string(),
    icon: z.string().nullable().optional(),
    data: z.record(z.string()).optional(),
    ttl: z.number().optional(),
  }),
  z.object({
    type: z.literal("ACTIVITY_ACK"),
    requestId: z.string().optional(),
    success: z.boolean(),
  }),
  z.object({
    type: z.literal("CLOSE"),
  }),
]);

export type PostMessage = z.infer<typeof postMessageSchema>;

export const CATEGORIES = ["transit", "parking", "travel", "entertainment", "shopping"] as const;
export type Category = typeof CATEGORIES[number];
