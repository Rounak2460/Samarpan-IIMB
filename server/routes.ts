import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./emailAuth";
import { insertOpportunitySchema, insertApplicationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUserWithStats(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Account deletion route
  app.delete('/api/auth/account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.deleteUser(userId);
      
      // Logout after deleting account
      req.logout((err: any) => {
        if (err) {
          console.error('Logout error after account deletion:', err);
        }
        req.session.destroy((destroyErr: any) => {
          if (destroyErr) {
            console.error('Session destroy error:', destroyErr);
          }
          res.clearCookie('connect.sid');
          res.json({ message: 'Account deleted successfully' });
        });
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Opportunity routes
  app.get("/api/opportunities", async (req, res) => {
    try {
      const {
        search,
        type,
        duration,
        skills,
        status,
        limit = "12",
        offset = "0"
      } = req.query;

      const filters = {
        search: search as string,
        type: type ? (Array.isArray(type) ? type as string[] : typeof type === 'string' ? [type as string] : []) : undefined,
        duration: duration ? (Array.isArray(duration) ? duration as string[] : typeof duration === 'string' ? [duration as string] : []) : undefined,
        skills: skills ? (Array.isArray(skills) ? skills as string[] : typeof skills === 'string' ? [skills as string] : []) : undefined,
        status: status ? (Array.isArray(status) ? status as string[] : typeof status === 'string' ? [status as string] : []) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const result = await storage.getOpportunities(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      res.status(500).json({ message: "Failed to fetch opportunities" });
    }
  });

  app.get("/api/opportunities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const opportunity = await storage.getOpportunityById(id);
      
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      res.json(opportunity);
    } catch (error) {
      console.error("Error fetching opportunity:", error);
      res.status(500).json({ message: "Failed to fetch opportunity" });
    }
  });

  app.post("/api/opportunities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertOpportunitySchema.parse({
        ...req.body,
        createdBy: userId,
      });

      const opportunity = await storage.createOpportunity(validatedData);
      res.status(201).json(opportunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating opportunity:", error);
      res.status(500).json({ message: "Failed to create opportunity" });
    }
  });

  app.put("/api/opportunities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertOpportunitySchema.partial().parse(req.body);
      const opportunity = await storage.updateOpportunity(id, validatedData);
      
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      res.json(opportunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating opportunity:", error);
      res.status(500).json({ message: "Failed to update opportunity" });
    }
  });

  app.delete("/api/opportunities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const success = await storage.deleteOpportunity(id);
      
      if (!success) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      res.status(500).json({ message: "Failed to delete opportunity" });
    }
  });

  // Application routes
  app.post("/api/applications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { opportunityId } = req.body;

      // Check if user already applied
      const existing = await storage.checkExistingApplication(userId, opportunityId);
      if (existing) {
        return res.status(400).json({ message: "Already applied to this opportunity" });
      }

      // Check if opportunity exists and is open
      const opportunity = await storage.getOpportunityById(opportunityId);
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      if (opportunity.status !== "open") {
        return res.status(400).json({ message: "Opportunity is not accepting applications" });
      }

      const validatedData = insertApplicationSchema.parse({
        userId,
        opportunityId,
        status: "pending",
      });

      const application = await storage.createApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating application:", error);
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  app.get("/api/applications/user/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user.id;
      const user = await storage.getUser(requestingUserId);
      
      // Users can only see their own applications, admins can see any
      if (userId !== requestingUserId && (!user || user.role !== "admin")) {
        return res.status(403).json({ message: "Access denied" });
      }

      const applications = await storage.getApplicationsByUser(userId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching user applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get("/api/applications/opportunity/:opportunityId", isAuthenticated, async (req: any, res) => {
    try {
      const { opportunityId } = req.params;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const applications = await storage.getApplicationsByOpportunity(opportunityId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching opportunity applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.put("/api/applications/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, notes, coinsAwarded, hoursCompleted, adminFeedback } = req.body;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      let application;
      
      if (status === "completed") {
        // Get opportunity details to calculate coins based on hourly rate and max limit
        const opportunityApp = await storage.getApplicationById(id);
        if (!opportunityApp || !opportunityApp.opportunity) {
          return res.status(404).json({ message: "Application or opportunity not found" });
        }
        
        const opportunity = opportunityApp.opportunity;
        const coinsPerHour = opportunity.coinsPerHour || 10;
        const maxCoins = opportunity.maxCoins || 100;
        const hours = hoursCompleted || 0;
        
        // Calculate coins: hours * rate, but cap at max coins
        const calculatedCoins = Math.min(Math.round(hours * coinsPerHour), maxCoins);
        
        application = await storage.markApplicationCompleted(id, calculatedCoins, hoursCompleted, adminFeedback);
      } else {
        application = await storage.updateApplicationStatus(id, status, notes);
      }
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.json(application);
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ message: "Failed to update application status" });
    }
  });

  // User stats endpoint for dashboard
  app.get("/api/users/:userId/stats", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user.id;
      const user = await storage.getUser(requestingUserId);
      
      // Users can only see their own stats, admins can see any
      if (userId !== requestingUserId && (!user || user.role !== "admin")) {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Leaderboard routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const { limit = "10", timeframe = "all" } = req.query;
      const leaderboard = await storage.getLeaderboard(parseInt(limit as string), timeframe as string);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Badge routes
  app.get("/api/badges", async (req, res) => {
    try {
      const badges = await storage.getBadges();
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.get("/api/badges/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const userBadges = await storage.getUserBadges(userId);
      res.json(userBadges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  // Analytics routes (admin only)
  app.get("/api/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin routes
  app.get("/api/admin/opportunities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const opportunities = await storage.getOpportunitiesByCreator(userId);
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching admin opportunities:", error);
      res.status(500).json({ message: "Failed to fetch opportunities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
