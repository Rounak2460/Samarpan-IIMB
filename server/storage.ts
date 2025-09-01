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
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserWithStats(id: string): Promise<UserWithStats | undefined>;
  updateUserCoins(userId: string, coins: number): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  getLeaderboard(limit?: number, timeframe?: string, opportunityId?: string): Promise<UserWithStats[]>;

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
  markApplicationCompleted(id: string, coinsAwarded: number, hours?: number, feedback?: string): Promise<Application | undefined>;
  getUserStats(userId: string): Promise<{totalApplications: number; completedApplications: number; totalHours: number; totalCoins: number}>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
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
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        program: users.program,
        coins: users.coins,
        anonymizeLeaderboard: users.anonymizeLeaderboard,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        totalApplications: sql<number>`(SELECT COUNT(*) FROM ${applications} WHERE ${applications.userId} = ${users.id})`,
        completedApplications: sql<number>`(SELECT COUNT(*) FROM ${applications} WHERE ${applications.userId} = ${users.id} AND ${applications.status} = 'completed')`,
      })
      .from(users)
      .where(eq(users.id, id));
    
    if (!user) return undefined;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
      program: user.program,
      coins: user.coins,
      anonymizeLeaderboard: user.anonymizeLeaderboard,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _count: {
        applications: Number(user.totalApplications),
        completedApplications: Number(user.completedApplications),
      },
    };
  }

  async updateUserCoins(userId: string, coins: number): Promise<void> {
    await db
      .update(users)
      .set({ coins: sql`${users.coins} + ${coins}`, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete all related data first
    await db.delete(applications).where(eq(applications.userId, userId));
    await db.delete(userBadges).where(eq(userBadges.userId, userId));
    // Delete the user
    await db.delete(users).where(eq(users.id, userId));
  }

  async getLeaderboard(limit = 10, timeframe = "all", opportunityId?: string): Promise<UserWithStats[]> {
    let dateFilter = sql`true`;
    
    if (timeframe === "month") {
      dateFilter = sql`${applications.completedAt} >= NOW() - INTERVAL '1 month'`;
    } else if (timeframe === "semester") {
      dateFilter = sql`${applications.completedAt} >= NOW() - INTERVAL '6 months'`;
    }

    let whereCondition = sql`${dateFilter} AND ${users.role} = 'student'`;
    
    // Add opportunity filter if specified
    if (opportunityId) {
      whereCondition = sql`${dateFilter} AND ${users.role} = 'student' AND ${applications.opportunityId} = ${opportunityId}`;
    }

    const leaderboardUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        program: users.program,
        coins: users.coins,
        anonymizeLeaderboard: users.anonymizeLeaderboard,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        totalApplications: sql<number>`COUNT(${applications.id})`,
        completedApplications: sql<number>`COUNT(CASE WHEN ${applications.status} = 'completed' THEN 1 END)`,
      })
      .from(users)
      .leftJoin(applications, eq(users.id, applications.userId))
      .where(whereCondition)
      .groupBy(users.id)
      .orderBy(desc(users.coins), desc(sql`COUNT(CASE WHEN ${applications.status} = 'completed' THEN 1 END)`))
      .limit(limit);

    return leaderboardUsers.map((user, index) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
      program: user.program,
      coins: user.coins,
      anonymizeLeaderboard: user.anonymizeLeaderboard,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _count: {
        applications: Number(user.totalApplications),
        completedApplications: Number(user.completedApplications),
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
      whereConditions = sql`${whereConditions} AND ${inArray(opportunities.type, type)}`;
    }
    
    if (duration && duration.length > 0) {
      whereConditions = sql`${whereConditions} AND ${inArray(opportunities.duration, duration)}`;
    }
    
    if (skills && skills.length > 0) {
      // Check if any of the required skills are present in the opportunity's skills array
      whereConditions = sql`${whereConditions} AND ${opportunities.skills} && ${skills}`;
    }
    
    if (status && status.length > 0) {
      whereConditions = sql`${whereConditions} AND ${inArray(opportunities.status, status)}`;
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
        id: opportunities.id,
        title: opportunities.title,
        shortDescription: opportunities.shortDescription,
        fullDescription: opportunities.fullDescription,
        type: opportunities.type,
        duration: opportunities.duration,
        customDuration: opportunities.customDuration,
        skills: opportunities.skills,
        location: opportunities.location,
        schedule: opportunities.schedule,
        capacity: opportunities.capacity,
        status: opportunities.status,
        coinsPerHour: opportunities.coinsPerHour,
        maxCoins: opportunities.maxCoins,
        visibility: opportunities.visibility,
        contactEmail: opportunities.contactEmail,
        contactPhone: opportunities.contactPhone,
        imageUrl: opportunities.imageUrl,
        createdBy: opportunities.createdBy,
        createdAt: opportunities.createdAt,
        updatedAt: opportunities.updatedAt,
        creatorId: users.id,
        creatorEmail: users.email,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
        creatorProfileImageUrl: users.profileImageUrl,
        creatorRole: users.role,
        creatorProgram: users.program,
        creatorCoins: users.coins,
        creatorAnonymizeLeaderboard: users.anonymizeLeaderboard,
        creatorCreatedAt: users.createdAt,
        creatorUpdatedAt: users.updatedAt,
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
        id: item.id,
        title: item.title,
        shortDescription: item.shortDescription,
        fullDescription: item.fullDescription,
        type: item.type,
        duration: item.duration,
        customDuration: item.customDuration,
        skills: item.skills,
        location: item.location,
        schedule: item.schedule,
        capacity: item.capacity,
        status: item.status,
        coinsPerHour: item.coinsPerHour,
        maxCoins: item.maxCoins,
        visibility: item.visibility,
        contactEmail: item.contactEmail,
        contactPhone: item.contactPhone,
        imageUrl: item.imageUrl,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        creator: {
          id: item.creatorId!,
          email: item.creatorEmail,
          firstName: item.creatorFirstName,
          lastName: item.creatorLastName,
          profileImageUrl: item.creatorProfileImageUrl,
          role: item.creatorRole,
          program: item.creatorProgram,
          coins: item.creatorCoins,
          anonymizeLeaderboard: item.creatorAnonymizeLeaderboard,
          createdAt: item.creatorCreatedAt,
          updatedAt: item.creatorUpdatedAt,
        },
        _count: { applications: Number(item.applicationCount) },
      })),
      total: Number(totalCount),
    };
  }

  async getOpportunityById(id: string): Promise<OpportunityWithCreator | undefined> {
    const [opportunity] = await db
      .select({
        id: opportunities.id,
        title: opportunities.title,
        shortDescription: opportunities.shortDescription,
        fullDescription: opportunities.fullDescription,
        type: opportunities.type,
        duration: opportunities.duration,
        customDuration: opportunities.customDuration,
        skills: opportunities.skills,
        location: opportunities.location,
        schedule: opportunities.schedule,
        capacity: opportunities.capacity,
        status: opportunities.status,
        coinsPerHour: opportunities.coinsPerHour,
        maxCoins: opportunities.maxCoins,
        visibility: opportunities.visibility,
        contactEmail: opportunities.contactEmail,
        contactPhone: opportunities.contactPhone,
        imageUrl: opportunities.imageUrl,
        createdBy: opportunities.createdBy,
        createdAt: opportunities.createdAt,
        updatedAt: opportunities.updatedAt,
        creatorId: users.id,
        creatorEmail: users.email,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
        creatorProfileImageUrl: users.profileImageUrl,
        creatorRole: users.role,
        creatorProgram: users.program,
        creatorCoins: users.coins,
        creatorAnonymizeLeaderboard: users.anonymizeLeaderboard,
        creatorCreatedAt: users.createdAt,
        creatorUpdatedAt: users.updatedAt,
        applicationCount: sql<number>`COUNT(${applications.id})`,
      })
      .from(opportunities)
      .leftJoin(users, eq(opportunities.createdBy, users.id))
      .leftJoin(applications, eq(opportunities.id, applications.opportunityId))
      .where(eq(opportunities.id, id))
      .groupBy(opportunities.id, users.id);

    if (!opportunity) return undefined;

    return {
      id: opportunity.id,
      title: opportunity.title,
      shortDescription: opportunity.shortDescription,
      fullDescription: opportunity.fullDescription,
      type: opportunity.type,
      duration: opportunity.duration,
      customDuration: opportunity.customDuration,
      skills: opportunity.skills,
      location: opportunity.location,
      schedule: opportunity.schedule,
      capacity: opportunity.capacity,
      status: opportunity.status,
      coinsPerHour: opportunity.coinsPerHour,
      maxCoins: opportunity.maxCoins,
      visibility: opportunity.visibility,
      contactEmail: opportunity.contactEmail,
      contactPhone: opportunity.contactPhone,
      imageUrl: opportunity.imageUrl,
      createdBy: opportunity.createdBy,
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
      creator: {
        id: opportunity.creatorId!,
        email: opportunity.creatorEmail,
        firstName: opportunity.creatorFirstName,
        lastName: opportunity.creatorLastName,
        profileImageUrl: opportunity.creatorProfileImageUrl,
        role: opportunity.creatorRole,
        program: opportunity.creatorProgram,
        coins: opportunity.creatorCoins,
        anonymizeLeaderboard: opportunity.creatorAnonymizeLeaderboard,
        createdAt: opportunity.creatorCreatedAt,
        updatedAt: opportunity.creatorUpdatedAt,
      },
      _count: { applications: Number(opportunity.applicationCount) },
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
        id: opportunities.id,
        title: opportunities.title,
        shortDescription: opportunities.shortDescription,
        fullDescription: opportunities.fullDescription,
        type: opportunities.type,
        duration: opportunities.duration,
        customDuration: opportunities.customDuration,
        skills: opportunities.skills,
        location: opportunities.location,
        schedule: opportunities.schedule,
        capacity: opportunities.capacity,
        status: opportunities.status,
        coinsPerHour: opportunities.coinsPerHour,
        maxCoins: opportunities.maxCoins,
        visibility: opportunities.visibility,
        contactEmail: opportunities.contactEmail,
        contactPhone: opportunities.contactPhone,
        imageUrl: opportunities.imageUrl,
        createdBy: opportunities.createdBy,
        createdAt: opportunities.createdAt,
        updatedAt: opportunities.updatedAt,
        creatorId: users.id,
        creatorEmail: users.email,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
        creatorProfileImageUrl: users.profileImageUrl,
        creatorRole: users.role,
        creatorProgram: users.program,
        creatorCoins: users.coins,
        creatorAnonymizeLeaderboard: users.anonymizeLeaderboard,
        creatorCreatedAt: users.createdAt,
        creatorUpdatedAt: users.updatedAt,
        applicationCount: sql<number>`COUNT(${applications.id})`,
      })
      .from(opportunities)
      .leftJoin(users, eq(opportunities.createdBy, users.id))
      .leftJoin(applications, eq(opportunities.id, applications.opportunityId))
      .where(eq(opportunities.createdBy, creatorId))
      .groupBy(opportunities.id, users.id)
      .orderBy(desc(opportunities.createdAt));

    return opportunityList.map(item => ({
      id: item.id,
      title: item.title,
      shortDescription: item.shortDescription,
      fullDescription: item.fullDescription,
      type: item.type,
      duration: item.duration,
      customDuration: item.customDuration,
      skills: item.skills,
      location: item.location,
      schedule: item.schedule,
      capacity: item.capacity,
      status: item.status,
      coinsPerHour: item.coinsPerHour,
      maxCoins: item.maxCoins,
      visibility: item.visibility,
      contactEmail: item.contactEmail,
      contactPhone: item.contactPhone,
      imageUrl: item.imageUrl,
      createdBy: item.createdBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      creator: {
        id: item.creatorId!,
        email: item.creatorEmail,
        firstName: item.creatorFirstName,
        lastName: item.creatorLastName,
        profileImageUrl: item.creatorProfileImageUrl,
        role: item.creatorRole,
        program: item.creatorProgram,
        coins: item.creatorCoins,
        anonymizeLeaderboard: item.creatorAnonymizeLeaderboard,
        createdAt: item.creatorCreatedAt,
        updatedAt: item.creatorUpdatedAt,
      },
      _count: { applications: Number(item.applicationCount) },
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
        id: applications.id,
        userId: applications.userId,
        opportunityId: applications.opportunityId,
        status: applications.status,
        appliedAt: applications.appliedAt,
        completedAt: applications.completedAt,
        notes: applications.notes,
        coinsAwarded: applications.coinsAwarded,
        hoursCompleted: applications.hoursCompleted,
        adminFeedback: applications.adminFeedback,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userProfileImageUrl: users.profileImageUrl,
        userRole: users.role,
        userProgram: users.program,
        userCoins: users.coins,
        userAnonymizeLeaderboard: users.anonymizeLeaderboard,
        userCreatedAt: users.createdAt,
        userUpdatedAt: users.updatedAt,
        opportunityTitle: opportunities.title,
        opportunityShortDescription: opportunities.shortDescription,
        opportunityFullDescription: opportunities.fullDescription,
        opportunityType: opportunities.type,
        opportunityDuration: opportunities.duration,
        opportunityCustomDuration: opportunities.customDuration,
        opportunitySkills: opportunities.skills,
        opportunityLocation: opportunities.location,
        opportunitySchedule: opportunities.schedule,
        opportunityCapacity: opportunities.capacity,
        opportunityStatus: opportunities.status,
        opportunityCoinsPerHour: opportunities.coinsPerHour,
        opportunityMaxCoins: opportunities.maxCoins,
        opportunityVisibility: opportunities.visibility,
        opportunityContactEmail: opportunities.contactEmail,
        opportunityContactPhone: opportunities.contactPhone,
        opportunityImageUrl: opportunities.imageUrl,
        opportunityCreatedBy: opportunities.createdBy,
        opportunityCreatedAt: opportunities.createdAt,
        opportunityUpdatedAt: opportunities.updatedAt,
      })
      .from(applications)
      .leftJoin(users, eq(applications.userId, users.id))
      .leftJoin(opportunities, eq(applications.opportunityId, opportunities.id))
      .where(eq(applications.id, id));

    if (!application) return undefined;

    return {
      id: application.id,
      userId: application.userId,
      opportunityId: application.opportunityId,
      status: application.status,
      appliedAt: application.appliedAt,
      completedAt: application.completedAt,
      notes: application.notes,
      coinsAwarded: application.coinsAwarded,
      hoursCompleted: application.hoursCompleted,
      adminFeedback: application.adminFeedback,
      user: {
        id: application.userId,
        email: application.userEmail,
        firstName: application.userFirstName,
        lastName: application.userLastName,
        profileImageUrl: application.userProfileImageUrl,
        role: application.userRole,
        program: application.userProgram,
        coins: application.userCoins,
        anonymizeLeaderboard: application.userAnonymizeLeaderboard,
        createdAt: application.userCreatedAt,
        updatedAt: application.userUpdatedAt,
      },
      opportunity: {
        id: application.opportunityId,
        title: application.opportunityTitle!,
        shortDescription: application.opportunityShortDescription!,
        fullDescription: application.opportunityFullDescription!,
        type: application.opportunityType!,
        duration: application.opportunityDuration!,
        customDuration: application.opportunityCustomDuration,
        skills: application.opportunitySkills,
        location: application.opportunityLocation,
        schedule: application.opportunitySchedule,
        capacity: application.opportunityCapacity,
        status: application.opportunityStatus,
        coinsPerHour: application.opportunityCoinsPerHour,
        maxCoins: application.opportunityMaxCoins,
        visibility: application.opportunityVisibility,
        contactEmail: application.opportunityContactEmail,
        contactPhone: application.opportunityContactPhone,
        imageUrl: application.opportunityImageUrl,
        createdBy: application.opportunityCreatedBy!,
        createdAt: application.opportunityCreatedAt,
        updatedAt: application.opportunityUpdatedAt,
      },
    };
  }

  async getApplicationsByUser(userId: string): Promise<ApplicationWithDetails[]> {
    const userApplications = await db
      .select({
        id: applications.id,
        userId: applications.userId,
        opportunityId: applications.opportunityId,
        status: applications.status,
        appliedAt: applications.appliedAt,
        completedAt: applications.completedAt,
        notes: applications.notes,
        coinsAwarded: applications.coinsAwarded,
        hoursCompleted: applications.hoursCompleted,
        adminFeedback: applications.adminFeedback,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userProfileImageUrl: users.profileImageUrl,
        userRole: users.role,
        userProgram: users.program,
        userCoins: users.coins,
        userAnonymizeLeaderboard: users.anonymizeLeaderboard,
        userCreatedAt: users.createdAt,
        userUpdatedAt: users.updatedAt,
        opportunityTitle: opportunities.title,
        opportunityShortDescription: opportunities.shortDescription,
        opportunityFullDescription: opportunities.fullDescription,
        opportunityType: opportunities.type,
        opportunityDuration: opportunities.duration,
        opportunityCustomDuration: opportunities.customDuration,
        opportunitySkills: opportunities.skills,
        opportunityLocation: opportunities.location,
        opportunitySchedule: opportunities.schedule,
        opportunityCapacity: opportunities.capacity,
        opportunityStatus: opportunities.status,
        opportunityCoinsPerHour: opportunities.coinsPerHour,
        opportunityMaxCoins: opportunities.maxCoins,
        opportunityVisibility: opportunities.visibility,
        opportunityContactEmail: opportunities.contactEmail,
        opportunityContactPhone: opportunities.contactPhone,
        opportunityImageUrl: opportunities.imageUrl,
        opportunityCreatedBy: opportunities.createdBy,
        opportunityCreatedAt: opportunities.createdAt,
        opportunityUpdatedAt: opportunities.updatedAt,
      })
      .from(applications)
      .leftJoin(users, eq(applications.userId, users.id))
      .leftJoin(opportunities, eq(applications.opportunityId, opportunities.id))
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.appliedAt));

    return userApplications.map(app => ({
      id: app.id,
      userId: app.userId,
      opportunityId: app.opportunityId,
      status: app.status,
      appliedAt: app.appliedAt,
      completedAt: app.completedAt,
      notes: app.notes,
      coinsAwarded: app.coinsAwarded,
      hoursCompleted: app.hoursCompleted,
      adminFeedback: app.adminFeedback,
      user: {
        id: app.userId,
        email: app.userEmail,
        firstName: app.userFirstName,
        lastName: app.userLastName,
        profileImageUrl: app.userProfileImageUrl,
        role: app.userRole,
        program: app.userProgram,
        coins: app.userCoins,
        anonymizeLeaderboard: app.userAnonymizeLeaderboard,
        createdAt: app.userCreatedAt,
        updatedAt: app.userUpdatedAt,
      },
      opportunity: {
        id: app.opportunityId,
        title: app.opportunityTitle!,
        shortDescription: app.opportunityShortDescription!,
        fullDescription: app.opportunityFullDescription!,
        type: app.opportunityType!,
        duration: app.opportunityDuration!,
        customDuration: app.opportunityCustomDuration,
        skills: app.opportunitySkills,
        location: app.opportunityLocation,
        schedule: app.opportunitySchedule,
        capacity: app.opportunityCapacity,
        status: app.opportunityStatus,
        coinsPerHour: app.opportunityCoinsPerHour,
        maxCoins: app.opportunityMaxCoins,
        visibility: app.opportunityVisibility,
        contactEmail: app.opportunityContactEmail,
        contactPhone: app.opportunityContactPhone,
        imageUrl: app.opportunityImageUrl,
        createdBy: app.opportunityCreatedBy!,
        createdAt: app.opportunityCreatedAt,
        updatedAt: app.opportunityUpdatedAt,
      },
    }));
  }

  async getApplicationsByOpportunity(opportunityId: string): Promise<ApplicationWithDetails[]> {
    const opportunityApplications = await db
      .select({
        id: applications.id,
        userId: applications.userId,
        opportunityId: applications.opportunityId,
        status: applications.status,
        appliedAt: applications.appliedAt,
        completedAt: applications.completedAt,
        notes: applications.notes,
        coinsAwarded: applications.coinsAwarded,
        hoursCompleted: applications.hoursCompleted,
        adminFeedback: applications.adminFeedback,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userProfileImageUrl: users.profileImageUrl,
        userRole: users.role,
        userProgram: users.program,
        userCoins: users.coins,
        userAnonymizeLeaderboard: users.anonymizeLeaderboard,
        userCreatedAt: users.createdAt,
        userUpdatedAt: users.updatedAt,
        opportunityTitle: opportunities.title,
        opportunityShortDescription: opportunities.shortDescription,
        opportunityFullDescription: opportunities.fullDescription,
        opportunityType: opportunities.type,
        opportunityDuration: opportunities.duration,
        opportunityCustomDuration: opportunities.customDuration,
        opportunitySkills: opportunities.skills,
        opportunityLocation: opportunities.location,
        opportunitySchedule: opportunities.schedule,
        opportunityCapacity: opportunities.capacity,
        opportunityStatus: opportunities.status,
        opportunityCoinsPerHour: opportunities.coinsPerHour,
        opportunityMaxCoins: opportunities.maxCoins,
        opportunityVisibility: opportunities.visibility,
        opportunityContactEmail: opportunities.contactEmail,
        opportunityContactPhone: opportunities.contactPhone,
        opportunityImageUrl: opportunities.imageUrl,
        opportunityCreatedBy: opportunities.createdBy,
        opportunityCreatedAt: opportunities.createdAt,
        opportunityUpdatedAt: opportunities.updatedAt,
      })
      .from(applications)
      .leftJoin(users, eq(applications.userId, users.id))
      .leftJoin(opportunities, eq(applications.opportunityId, opportunities.id))
      .where(eq(applications.opportunityId, opportunityId))
      .orderBy(desc(applications.appliedAt));

    return opportunityApplications.map(app => ({
      id: app.id,
      userId: app.userId,
      opportunityId: app.opportunityId,
      status: app.status,
      appliedAt: app.appliedAt,
      completedAt: app.completedAt,
      notes: app.notes,
      coinsAwarded: app.coinsAwarded,
      hoursCompleted: app.hoursCompleted,
      adminFeedback: app.adminFeedback,
      user: {
        id: app.userId,
        email: app.userEmail,
        firstName: app.userFirstName,
        lastName: app.userLastName,
        profileImageUrl: app.userProfileImageUrl,
        role: app.userRole,
        program: app.userProgram,
        coins: app.userCoins,
        anonymizeLeaderboard: app.userAnonymizeLeaderboard,
        createdAt: app.userCreatedAt,
        updatedAt: app.userUpdatedAt,
      },
      opportunity: {
        id: app.opportunityId,
        title: app.opportunityTitle!,
        shortDescription: app.opportunityShortDescription!,
        fullDescription: app.opportunityFullDescription!,
        type: app.opportunityType!,
        duration: app.opportunityDuration!,
        customDuration: app.opportunityCustomDuration,
        skills: app.opportunitySkills,
        location: app.opportunityLocation,
        schedule: app.opportunitySchedule,
        capacity: app.opportunityCapacity,
        status: app.opportunityStatus,
        coinsPerHour: app.opportunityCoinsPerHour,
        maxCoins: app.opportunityMaxCoins,
        visibility: app.opportunityVisibility,
        contactEmail: app.opportunityContactEmail,
        contactPhone: app.opportunityContactPhone,
        imageUrl: app.opportunityImageUrl,
        createdBy: app.opportunityCreatedBy!,
        createdAt: app.opportunityCreatedAt,
        updatedAt: app.opportunityUpdatedAt,
      },
    }));
  }

  async updateApplicationStatus(
    id: string,
    status: "pending" | "accepted" | "hours_submitted" | "hours_approved" | "completed" | "rejected",
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

  async submitApplicationHours(id: string, hours: number): Promise<Application | undefined> {
    const [updated] = await db
      .update(applications)
      .set({
        status: "hours_submitted",
        submittedHours: hours,
        hourSubmissionDate: new Date(),
      })
      .where(eq(applications.id, id))
      .returning();

    // Check if opportunity should be auto-closed due to hours limit
    if (updated) {
      await this.checkAndCloseOpportunityByHours(updated.opportunityId);
    }

    return updated;
  }

  async checkAndCloseOpportunityByHours(opportunityId: string): Promise<void> {
    // Get opportunity details
    const [opportunity] = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, opportunityId));

    if (!opportunity || !opportunity.totalRequiredHours) {
      return; // No hours limit set
    }

    // Calculate total completed hours for this opportunity
    const [result] = await db
      .select({
        totalHours: sql<number>`COALESCE(SUM(${applications.hoursCompleted}), 0)`,
      })
      .from(applications)
      .where(
        and(
          eq(applications.opportunityId, opportunityId),
          eq(applications.status, "completed")
        )
      );

    const totalCompletedHours = Number(result?.totalHours || 0);

    // Close opportunity if hours limit reached
    if (totalCompletedHours >= opportunity.totalRequiredHours) {
      await db
        .update(opportunities)
        .set({
          status: "filled",
          updatedAt: new Date(),
        })
        .where(eq(opportunities.id, opportunityId));
    }
  }

  async markApplicationCompleted(id: string, coinsAwarded: number, hours?: number, feedback?: string): Promise<Application | undefined> {
    const [updated] = await db
      .update(applications)
      .set({
        status: "completed",
        completedAt: new Date(),
        coinsAwarded,
        hoursCompleted: hours || 0,
        adminFeedback: feedback,
      })
      .where(eq(applications.id, id))
      .returning();

    if (updated) {
      // Update user coins
      await this.updateUserCoins(updated.userId, coinsAwarded);
      
      // Check and award badges
      await this.checkAndAwardBadges(updated.userId);

      // Check if opportunity should be auto-closed due to hours limit
      await this.checkAndCloseOpportunityByHours(updated.opportunityId);
    }

    return updated;
  }

  async getUserStats(userId: string): Promise<{totalApplications: number; completedApplications: number; totalHours: number; totalCoins: number}> {
    const [stats] = await db
      .select({
        totalApplications: sql<number>`COUNT(${applications.id})`,
        completedApplications: sql<number>`COUNT(CASE WHEN ${applications.status} = 'completed' THEN 1 END)`,
        totalHours: sql<number>`COALESCE(SUM(CASE WHEN ${applications.hoursCompleted} IS NOT NULL THEN ${applications.hoursCompleted} ELSE 0 END), 0)`,
        totalCoins: sql<number>`COALESCE(SUM(CASE WHEN ${applications.coinsAwarded} IS NOT NULL THEN ${applications.coinsAwarded} ELSE 0 END), 0)`,
      })
      .from(applications)
      .where(eq(applications.userId, userId));

    return {
      totalApplications: Number(stats?.totalApplications || 0),
      completedApplications: Number(stats?.completedApplications || 0),
      totalHours: Number(stats?.totalHours || 0),
      totalCoins: Number(stats?.totalCoins || 0),
    };
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
      if (!userBadgeIds.includes(badge.id) && (user.coins || 0) >= badge.coinsRequired) {
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
