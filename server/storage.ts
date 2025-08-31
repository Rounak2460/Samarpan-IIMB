import {
  users,
  opportunities,
  applications,
  badges,
  userBadges,
  type User,
  type UpsertUser,
  type InsertOpportunity,
  type Opportunity,
  type InsertApplication,
  type Application,
  type Badge,
  type OpportunityWithCreator,
  type ApplicationWithDetails,
  type UserWithStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, count, sql, and, ilike, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserWithStats(id: string): Promise<UserWithStats | undefined>;
  updateUserCoins(userId: string, coins: number): Promise<void>;
  getLeaderboard(limit?: number, timeframe?: string): Promise<UserWithStats[]>;

  // Opportunity operations
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  getOpportunities(filters?: {
    search?: string;
    type?: string[];
    duration?: string[];
    skills?: string[];
    status?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{ opportunities: OpportunityWithCreator[]; total: number }>;
  getOpportunityById(id: string): Promise<OpportunityWithCreator | undefined>;
  updateOpportunity(id: string, data: Partial<InsertOpportunity>): Promise<Opportunity | undefined>;
  deleteOpportunity(id: string): Promise<boolean>;
  getOpportunitiesByCreator(creatorId: string): Promise<OpportunityWithCreator[]>;

  // Application operations
  createApplication(application: InsertApplication): Promise<Application>;
  getApplicationById(id: string): Promise<ApplicationWithDetails | undefined>;
  getApplicationsByUser(userId: string): Promise<ApplicationWithDetails[]>;
  getApplicationsByOpportunity(opportunityId: string): Promise<ApplicationWithDetails[]>;
  updateApplicationStatus(
    id: string,
    status: "pending" | "accepted" | "completed" | "rejected",
    notes?: string
  ): Promise<Application | undefined>;
  markApplicationCompleted(id: string, coinsAwarded: number): Promise<Application | undefined>;
  checkExistingApplication(userId: string, opportunityId: string): Promise<Application | undefined>;

  // Badge operations
  getBadges(): Promise<Badge[]>;
  getUserBadges(userId: string): Promise<Badge[]>;
  awardBadge(userId: string, badgeId: string): Promise<void>;
  checkAndAwardBadges(userId: string): Promise<Badge[]>;

  // Analytics operations
  getAnalytics(): Promise<{
    totalOpportunities: number;
    totalApplications: number;
    averageApplyRate: number;
    completionRate: number;
    applicationsOverTime: Array<{ date: string; count: number }>;
    applicationsByType: Array<{ type: string; count: number }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserWithStats(id: string): Promise<UserWithStats | undefined> {
    const [user] = await db
      .select({
        ...users,
        totalApplications: sql<number>`(SELECT COUNT(*) FROM ${applications} WHERE ${applications.userId} = ${users.id})`,
        completedApplications: sql<number>`(SELECT COUNT(*) FROM ${applications} WHERE ${applications.userId} = ${users.id} AND ${applications.status} = 'completed')`,
      })
      .from(users)
      .where(eq(users.id, id));
    
    if (!user) return undefined;

    return {
      ...user,
      _count: {
        applications: user.totalApplications,
        completedApplications: user.completedApplications,
      },
    };
  }

  async updateUserCoins(userId: string, coins: number): Promise<void> {
    await db
      .update(users)
      .set({ coins: sql`${users.coins} + ${coins}`, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getLeaderboard(limit = 10, timeframe = "all"): Promise<UserWithStats[]> {
    let dateFilter = sql`true`;
    
    if (timeframe === "month") {
      dateFilter = sql`${applications.completedAt} >= NOW() - INTERVAL '1 month'`;
    } else if (timeframe === "semester") {
      dateFilter = sql`${applications.completedAt} >= NOW() - INTERVAL '6 months'`;
    }

    const leaderboardUsers = await db
      .select({
        ...users,
        totalApplications: sql<number>`COUNT(${applications.id})`,
        completedApplications: sql<number>`COUNT(CASE WHEN ${applications.status} = 'completed' THEN 1 END)`,
      })
      .from(users)
      .leftJoin(applications, eq(users.id, applications.userId))
      .where(dateFilter)
      .groupBy(users.id)
      .orderBy(desc(users.coins), desc(sql`COUNT(CASE WHEN ${applications.status} = 'completed' THEN 1 END)`))
      .limit(limit);

    return leaderboardUsers.map((user, index) => ({
      ...user,
      _count: {
        applications: user.totalApplications,
        completedApplications: user.completedApplications,
      },
      rank: index + 1,
    }));
  }

  // Opportunity operations
  async createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity> {
    const [newOpportunity] = await db
      .insert(opportunities)
      .values(opportunity)
      .returning();
    return newOpportunity;
  }

  async getOpportunities(filters: {
    search?: string;
    type?: string[];
    duration?: string[];
    skills?: string[];
    status?: string[];
    limit?: number;
    offset?: number;
  } = {}): Promise<{ opportunities: OpportunityWithCreator[]; total: number }> {
    const { search, type, duration, skills, status, limit = 12, offset = 0 } = filters;
    
    let whereConditions = sql`true`;
    
    if (search) {
      whereConditions = sql`${whereConditions} AND (${opportunities.title} ILIKE ${'%' + search + '%'} OR ${opportunities.shortDescription} ILIKE ${'%' + search + '%'})`;
    }
    
    if (type && type.length > 0) {
      whereConditions = sql`${whereConditions} AND ${opportunities.type} = ANY(${type})`;
    }
    
    if (duration && duration.length > 0) {
      whereConditions = sql`${whereConditions} AND ${opportunities.duration} = ANY(${duration})`;
    }
    
    if (status && status.length > 0) {
      whereConditions = sql`${whereConditions} AND ${opportunities.status} = ANY(${status})`;
    } else {
      // Default to only open opportunities for students
      whereConditions = sql`${whereConditions} AND ${opportunities.status} = 'open'`;
    }

    // Get total count
    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(opportunities)
      .where(whereConditions);

    // Get opportunities with creator info
    const opportunityList = await db
      .select({
        ...opportunities,
        creator: users,
        applicationCount: sql<number>`COUNT(${applications.id})`,
      })
      .from(opportunities)
      .leftJoin(users, eq(opportunities.createdBy, users.id))
      .leftJoin(applications, eq(opportunities.id, applications.opportunityId))
      .where(whereConditions)
      .groupBy(opportunities.id, users.id)
      .orderBy(desc(opportunities.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      opportunities: opportunityList.map(item => ({
        ...item,
        _count: { applications: item.applicationCount },
      })),
      total: totalCount,
    };
  }

  async getOpportunityById(id: string): Promise<OpportunityWithCreator | undefined> {
    const [opportunity] = await db
      .select({
        ...opportunities,
        creator: users,
        applicationCount: sql<number>`COUNT(${applications.id})`,
      })
      .from(opportunities)
      .leftJoin(users, eq(opportunities.createdBy, users.id))
      .leftJoin(applications, eq(opportunities.id, applications.opportunityId))
      .where(eq(opportunities.id, id))
      .groupBy(opportunities.id, users.id);

    if (!opportunity) return undefined;

    return {
      ...opportunity,
      _count: { applications: opportunity.applicationCount },
    };
  }

  async updateOpportunity(id: string, data: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    const [updated] = await db
      .update(opportunities)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(opportunities.id, id))
      .returning();
    return updated;
  }

  async deleteOpportunity(id: string): Promise<boolean> {
    const result = await db.delete(opportunities).where(eq(opportunities.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getOpportunitiesByCreator(creatorId: string): Promise<OpportunityWithCreator[]> {
    const opportunityList = await db
      .select({
        ...opportunities,
        creator: users,
        applicationCount: sql<number>`COUNT(${applications.id})`,
      })
      .from(opportunities)
      .leftJoin(users, eq(opportunities.createdBy, users.id))
      .leftJoin(applications, eq(opportunities.id, applications.opportunityId))
      .where(eq(opportunities.createdBy, creatorId))
      .groupBy(opportunities.id, users.id)
      .orderBy(desc(opportunities.createdAt));

    return opportunityList.map(item => ({
      ...item,
      _count: { applications: item.applicationCount },
    }));
  }

  // Application operations
  async createApplication(application: InsertApplication): Promise<Application> {
    const [newApplication] = await db
      .insert(applications)
      .values(application)
      .returning();
    return newApplication;
  }

  async getApplicationById(id: string): Promise<ApplicationWithDetails | undefined> {
    const [application] = await db
      .select({
        ...applications,
        user: users,
        opportunity: opportunities,
      })
      .from(applications)
      .leftJoin(users, eq(applications.userId, users.id))
      .leftJoin(opportunities, eq(applications.opportunityId, opportunities.id))
      .where(eq(applications.id, id));

    return application;
  }

  async getApplicationsByUser(userId: string): Promise<ApplicationWithDetails[]> {
    const userApplications = await db
      .select({
        ...applications,
        user: users,
        opportunity: opportunities,
      })
      .from(applications)
      .leftJoin(users, eq(applications.userId, users.id))
      .leftJoin(opportunities, eq(applications.opportunityId, opportunities.id))
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.appliedAt));

    return userApplications;
  }

  async getApplicationsByOpportunity(opportunityId: string): Promise<ApplicationWithDetails[]> {
    const opportunityApplications = await db
      .select({
        ...applications,
        user: users,
        opportunity: opportunities,
      })
      .from(applications)
      .leftJoin(users, eq(applications.userId, users.id))
      .leftJoin(opportunities, eq(applications.opportunityId, opportunities.id))
      .where(eq(applications.opportunityId, opportunityId))
      .orderBy(desc(applications.appliedAt));

    return opportunityApplications;
  }

  async updateApplicationStatus(
    id: string,
    status: "pending" | "accepted" | "completed" | "rejected",
    notes?: string
  ): Promise<Application | undefined> {
    const updateData: any = { status, notes };
    
    if (status === "completed") {
      updateData.completedAt = new Date();
    }

    const [updated] = await db
      .update(applications)
      .set(updateData)
      .where(eq(applications.id, id))
      .returning();
    
    return updated;
  }

  async markApplicationCompleted(id: string, coinsAwarded: number): Promise<Application | undefined> {
    const [updated] = await db
      .update(applications)
      .set({
        status: "completed",
        completedAt: new Date(),
        coinsAwarded,
      })
      .where(eq(applications.id, id))
      .returning();

    if (updated) {
      // Update user coins
      await this.updateUserCoins(updated.userId, coinsAwarded);
      
      // Check and award badges
      await this.checkAndAwardBadges(updated.userId);
    }

    return updated;
  }

  async checkExistingApplication(userId: string, opportunityId: string): Promise<Application | undefined> {
    const [existing] = await db
      .select()
      .from(applications)
      .where(and(eq(applications.userId, userId), eq(applications.opportunityId, opportunityId)));
    
    return existing;
  }

  // Badge operations
  async getBadges(): Promise<Badge[]> {
    return await db.select().from(badges).orderBy(asc(badges.coinsRequired));
  }

  async getUserBadges(userId: string): Promise<Badge[]> {
    const userBadgeList = await db
      .select({ badge: badges })
      .from(userBadges)
      .leftJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId));

    return userBadgeList.map(item => item.badge).filter(Boolean) as Badge[];
  }

  async awardBadge(userId: string, badgeId: string): Promise<void> {
    // Check if user already has this badge
    const [existing] = await db
      .select()
      .from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));

    if (!existing) {
      await db.insert(userBadges).values({ userId, badgeId });
    }
  }

  async checkAndAwardBadges(userId: string): Promise<Badge[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const allBadges = await this.getBadges();
    const userCurrentBadges = await this.getUserBadges(userId);
    const userBadgeIds = userCurrentBadges.map(b => b.id);

    const newBadges: Badge[] = [];

    for (const badge of allBadges) {
      if (!userBadgeIds.includes(badge.id) && user.coins >= badge.coinsRequired) {
        await this.awardBadge(userId, badge.id);
        newBadges.push(badge);
      }
    }

    return newBadges;
  }

  // Analytics operations
  async getAnalytics(): Promise<{
    totalOpportunities: number;
    totalApplications: number;
    averageApplyRate: number;
    completionRate: number;
    applicationsOverTime: Array<{ date: string; count: number }>;
    applicationsByType: Array<{ type: string; count: number }>;
  }> {
    // Get basic counts
    const [{ opportunityCount }] = await db
      .select({ opportunityCount: sql<number>`COUNT(*)` })
      .from(opportunities);

    const [{ applicationCount }] = await db
      .select({ applicationCount: sql<number>`COUNT(*)` })
      .from(applications);

    const [{ completedCount }] = await db
      .select({ completedCount: sql<number>`COUNT(*)` })
      .from(applications)
      .where(eq(applications.status, "completed"));

    // Applications over time (last 30 days)
    const applicationsOverTime = await db
      .select({
        date: sql<string>`DATE(${applications.appliedAt})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(applications)
      .where(sql`${applications.appliedAt} >= NOW() - INTERVAL '30 days'`)
      .groupBy(sql`DATE(${applications.appliedAt})`)
      .orderBy(sql`DATE(${applications.appliedAt})`);

    // Applications by opportunity type
    const applicationsByType = await db
      .select({
        type: opportunities.type,
        count: sql<number>`COUNT(${applications.id})`,
      })
      .from(applications)
      .leftJoin(opportunities, eq(applications.opportunityId, opportunities.id))
      .groupBy(opportunities.type)
      .orderBy(desc(sql`COUNT(${applications.id})`));

    return {
      totalOpportunities: opportunityCount,
      totalApplications: applicationCount,
      averageApplyRate: opportunityCount > 0 ? applicationCount / opportunityCount : 0,
      completionRate: applicationCount > 0 ? (completedCount / applicationCount) * 100 : 0,
      applicationsOverTime,
      applicationsByType: applicationsByType.map(item => ({
        type: item.type || "unknown",
        count: item.count,
      })),
    };
  }
}

export const storage = new DatabaseStorage();
