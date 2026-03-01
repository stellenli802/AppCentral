import {
  type MiniApp, type InsertMiniApp,
  type Favorite, type InsertFavorite,
  type AppPermission, type InsertAppPermission,
  type Notification, type InsertNotification,
  type Activity, type InsertActivity,
  miniApps, favorites, appPermissions, notifications, activities,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, or, desc, gt } from "drizzle-orm";

export interface IStorage {
  getMiniApps(): Promise<MiniApp[]>;
  getMiniApp(id: string): Promise<MiniApp | undefined>;
  getMiniAppsByCategory(category: string): Promise<MiniApp[]>;
  searchMiniApps(query: string): Promise<MiniApp[]>;
  createMiniApp(app: InsertMiniApp): Promise<MiniApp>;

  getFavorites(userId: string): Promise<Favorite[]>;
  getFavoriteApps(userId: string): Promise<MiniApp[]>;
  addFavorite(fav: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, miniAppId: string): Promise<void>;
  isFavorite(userId: string, miniAppId: string): Promise<boolean>;

  getAppPermissions(userId: string): Promise<AppPermission[]>;
  getAppPermission(userId: string, miniAppId: string, permission: string): Promise<AppPermission | undefined>;
  setAppPermission(data: InsertAppPermission): Promise<AppPermission>;
  revokeAppPermission(userId: string, miniAppId: string, permission: string): Promise<void>;

  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadCount(userId: string): Promise<number>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markAsRead(id: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(id: string, userId: string): Promise<void>;
  clearAllNotifications(userId: string): Promise<void>;

  getActivities(): Promise<Activity[]>;
  createActivity(data: InsertActivity): Promise<Activity>;
  deleteExpiredActivities(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getMiniApps(): Promise<MiniApp[]> {
    return db.select().from(miniApps).where(eq(miniApps.isActive, true));
  }

  async getMiniApp(id: string): Promise<MiniApp | undefined> {
    const [app] = await db.select().from(miniApps).where(eq(miniApps.id, id));
    return app;
  }

  async getMiniAppsByCategory(category: string): Promise<MiniApp[]> {
    return db.select().from(miniApps).where(and(eq(miniApps.category, category), eq(miniApps.isActive, true)));
  }

  async searchMiniApps(query: string): Promise<MiniApp[]> {
    const pattern = `%${query}%`;
    return db.select().from(miniApps).where(
      and(
        eq(miniApps.isActive, true),
        or(ilike(miniApps.name, pattern), ilike(miniApps.description, pattern))
      )
    );
  }

  async createMiniApp(app: InsertMiniApp): Promise<MiniApp> {
    const [created] = await db.insert(miniApps).values(app).onConflictDoUpdate({
      target: miniApps.id,
      set: { ...app },
    }).returning();
    return created;
  }

  async getFavorites(userId: string): Promise<Favorite[]> {
    return db.select().from(favorites).where(eq(favorites.userId, userId));
  }

  async getFavoriteApps(userId: string): Promise<MiniApp[]> {
    const favs = await this.getFavorites(userId);
    if (favs.length === 0) return [];
    const appIds = favs.map(f => f.miniAppId);
    const apps = await this.getMiniApps();
    return apps.filter(a => appIds.includes(a.id));
  }

  async addFavorite(fav: InsertFavorite): Promise<Favorite> {
    const existing = await this.isFavorite(fav.userId, fav.miniAppId);
    if (existing) {
      const [f] = await db.select().from(favorites).where(
        and(eq(favorites.userId, fav.userId), eq(favorites.miniAppId, fav.miniAppId))
      );
      return f;
    }
    const [created] = await db.insert(favorites).values(fav).returning();
    return created;
  }

  async removeFavorite(userId: string, miniAppId: string): Promise<void> {
    await db.delete(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.miniAppId, miniAppId))
    );
  }

  async isFavorite(userId: string, miniAppId: string): Promise<boolean> {
    const [f] = await db.select().from(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.miniAppId, miniAppId))
    );
    return !!f;
  }

  async getAppPermissions(userId: string): Promise<AppPermission[]> {
    return db.select().from(appPermissions).where(eq(appPermissions.userId, userId));
  }

  async getAppPermission(userId: string, miniAppId: string, permission: string): Promise<AppPermission | undefined> {
    const [p] = await db.select().from(appPermissions).where(
      and(
        eq(appPermissions.userId, userId),
        eq(appPermissions.miniAppId, miniAppId),
        eq(appPermissions.permission, permission)
      )
    );
    return p;
  }

  async setAppPermission(data: InsertAppPermission): Promise<AppPermission> {
    const existing = await this.getAppPermission(data.userId, data.miniAppId, data.permission);
    if (existing) {
      const [updated] = await db.update(appPermissions)
        .set({ granted: data.granted, updatedAt: new Date() })
        .where(eq(appPermissions.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(appPermissions).values(data).returning();
    return created;
  }

  async revokeAppPermission(userId: string, miniAppId: string, permission: string): Promise<void> {
    await db.update(appPermissions)
      .set({ granted: false, updatedAt: new Date() })
      .where(
        and(
          eq(appPermissions.userId, userId),
          eq(appPermissions.miniAppId, miniAppId),
          eq(appPermissions.permission, permission)
        )
      );
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const unread = await db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return unread.length;
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(data).returning();
    return created;
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    await db.delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async clearAllNotifications(userId: string): Promise<void> {
    await db.delete(notifications)
      .where(eq(notifications.userId, userId));
  }

  async getActivities(): Promise<Activity[]> {
    await this.deleteExpiredActivities();
    return db.select().from(activities)
      .where(gt(activities.expiresAt, new Date()))
      .orderBy(desc(activities.createdAt));
  }

  async createActivity(data: InsertActivity): Promise<Activity> {
    const [created] = await db.insert(activities).values(data).returning();
    return created;
  }

  async deleteExpiredActivities(): Promise<void> {
    await db.delete(activities).where(gt(new Date(), activities.expiresAt));
  }
}

export const storage = new DatabaseStorage();
