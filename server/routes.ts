import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { seedDatabase, seedNotifications, seedActivities } from "./seed";
import { insertMiniAppSchema } from "@shared/schema";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  await seedDatabase();
  await seedActivities();

  app.get("/api/mini-apps", async (_req, res) => {
    try {
      const apps = await storage.getMiniApps();
      res.json(apps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mini-apps" });
    }
  });

  app.get("/api/mini-apps/:id", async (req, res) => {
    try {
      const app_data = await storage.getMiniApp(req.params.id);
      if (!app_data) return res.status(404).json({ message: "Mini-app not found" });
      res.json(app_data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mini-app" });
    }
  });

  app.get("/api/mini-apps/:id/manifest", async (req, res) => {
    try {
      const manifestPath = path.join(process.cwd(), "client", "public", "manifests", `${req.params.id}.json`);
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        return res.json(manifest);
      }
      const app_data = await storage.getMiniApp(req.params.id);
      if (!app_data) return res.status(404).json({ message: "Mini-app not found" });
      const manifest = {
        id: app_data.id,
        name: app_data.name,
        version: app_data.version,
        entryUrl: app_data.url,
        allowedOrigins: app_data.allowedOrigins,
        permissions: app_data.permissions.map((p: string) => {
          if (p === "AUTH_CODE") return "identity";
          if (p === "LOCATION") return "location";
          return p.toLowerCase();
        }),
        intents: app_data.intents,
        developer: app_data.developer,
        category: app_data.category,
        description: app_data.description,
        icon: app_data.icon,
        color: app_data.color,
        sdk: "/sdk.js",
      };
      res.json(manifest);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate manifest" });
    }
  });

  app.get("/api/manifests", async (_req, res) => {
    try {
      const manifestDir = path.join(process.cwd(), "client", "public", "manifests");
      const files = fs.readdirSync(manifestDir).filter(f => f.endsWith(".json"));
      const manifests = files.map(f => JSON.parse(fs.readFileSync(path.join(manifestDir, f), "utf-8")));
      res.json(manifests);
    } catch (error) {
      res.status(500).json({ message: "Failed to crawl manifests" });
    }
  });

  app.get("/api/mini-apps/category/:category", async (req, res) => {
    try {
      const apps = await storage.getMiniAppsByCategory(req.params.category);
      res.json(apps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mini-apps" });
    }
  });

  app.get("/api/mini-apps/search/:query", async (req, res) => {
    try {
      const apps = await storage.searchMiniApps(req.params.query);
      res.json(apps);
    } catch (error) {
      res.status(500).json({ message: "Failed to search mini-apps" });
    }
  });

  app.post("/api/mini-apps", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertMiniAppSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid mini-app data", errors: parsed.error.flatten() });
      }
      const created = await storage.createMiniApp(parsed.data);
      res.json(created);
    } catch (error) {
      res.status(500).json({ message: "Failed to create mini-app" });
    }
  });

  app.get("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const apps = await storage.getFavoriteApps(userId);
      res.json(apps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.get("/api/favorites/ids", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favs = await storage.getFavorites(userId);
      res.json(favs.map(f => f.miniAppId));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorite IDs" });
    }
  });

  app.post("/api/favorites/:miniAppId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const miniAppId = req.params.miniAppId;
      const fav = await storage.addFavorite({ userId, miniAppId });
      res.json(fav);
    } catch (error) {
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:miniAppId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.removeFavorite(userId, req.params.miniAppId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get("/api/permissions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const perms = await storage.getAppPermissions(userId);
      res.json(perms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.get("/api/permissions/:miniAppId/:permission", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const perm = await storage.getAppPermission(userId, req.params.miniAppId, req.params.permission);
      res.json({ granted: perm?.granted ?? false });
    } catch (error) {
      res.status(500).json({ message: "Failed to check permission" });
    }
  });

  app.post("/api/permissions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { miniAppId, permission, granted } = req.body;
      if (!miniAppId || !permission || typeof granted !== "boolean") {
        return res.status(400).json({ message: "Missing miniAppId, permission, or granted" });
      }
      const result = await storage.setAppPermission({ userId, miniAppId, permission, granted });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to set permission" });
    }
  });

  const clearedUsers = new Set<string>();

  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!clearedUsers.has(userId)) {
        await seedNotifications(userId);
      }
      const notifs = await storage.getNotifications(userId);
      res.json(notifs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  app.post("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { miniAppId, title, body, data } = req.body;
      if (!miniAppId || !title || !body) {
        return res.status(400).json({ message: "Missing miniAppId, title, or body" });
      }
      const notif = await storage.createNotification({ userId, miniAppId, title, body, data });
      res.json(notif);
    } catch (error) {
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAsRead(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  app.post("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all as read" });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteNotification(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  app.delete("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.clearAllNotifications(userId);
      clearedUsers.add(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear notifications" });
    }
  });

  app.get("/api/activities", async (_req, res) => {
    try {
      const acts = await storage.getActivities();
      res.json(acts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const { miniAppId, title, body, icon, data, ttl } = req.body;
      if (!miniAppId || !title || !body) {
        return res.status(400).json({ message: "Missing miniAppId, title, or body" });
      }
      if (typeof title !== "string" || title.length > 200 || typeof body !== "string" || body.length > 500) {
        return res.status(400).json({ message: "Title max 200 chars, body max 500 chars" });
      }
      const knownApp = await storage.getMiniApp(miniAppId);
      if (!knownApp) {
        return res.status(400).json({ message: "Unknown miniAppId" });
      }
      const ttlSeconds = Math.min(ttl || 3600, 86400);
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      const activity = await storage.createActivity({ miniAppId, title, body, icon: icon || null, data: data || {}, expiresAt });
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  app.post("/api/auth-code", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const code = Buffer.from(JSON.stringify({ sub: userId, iat: Date.now(), exp: Date.now() + 300000 })).toString("base64");
      res.json({ code });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate auth code" });
    }
  });

  return httpServer;
}
