import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("student"), // student, admin
  program: varchar("program"), // MBA program info
  coins: integer("coins").default(0),
  anonymizeLeaderboard: boolean("anonymize_leaderboard").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const opportunityTypeEnum = pgEnum("opportunity_type", [
  "teaching",
  "donation",
  "mentoring",
  "community_service",
]);

export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "open",
  "closed",
  "filled",
]);

export const durationEnum = pgEnum("duration", [
  "instant",
  "1-3days",
  "1week",
  "2-4weeks",
  "custom",
]);

export const opportunities = pgTable("opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  shortDescription: varchar("short_description", { length: 160 }).notNull(),
  fullDescription: text("full_description").notNull(),
  type: opportunityTypeEnum("type").notNull(),
  duration: durationEnum("duration").notNull(),
  customDuration: varchar("custom_duration"), // For custom duration specification
  skills: text("skills").array(), // Array of required skills
  location: varchar("location"),
  schedule: varchar("schedule"),
  capacity: integer("capacity"), // Max participants
  totalRequiredHours: integer("total_required_hours"), // Total hours needed for this opportunity
  status: opportunityStatusEnum("status").default("open"),
  coinsPerHour: integer("coins_per_hour").default(10), // Coins awarded per hour
  maxCoins: integer("max_coins").default(100), // Maximum coins that can be earned
  visibility: varchar("visibility").default("public"), // public, private
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  imageUrl: varchar("image_url"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const applicationStatusEnum = pgEnum("application_status", [
  "pending",
  "accepted",
  "hours_submitted",
  "hours_approved",
  "completed",
  "rejected",
]);

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  opportunityId: varchar("opportunity_id").notNull(),
  status: applicationStatusEnum("status").default("pending"),
  appliedAt: timestamp("applied_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"), // Admin notes
  coinsAwarded: integer("coins_awarded").default(0),
  hoursCompleted: integer("hours_completed").default(0),
  submittedHours: integer("submitted_hours").default(0), // Hours submitted by student
  hourSubmissionDate: timestamp("hour_submission_date"), // When student submitted hours
  adminFeedback: text("admin_feedback"), // Admin feedback on completion
});

export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon"),
  coinsRequired: integer("coins_required").notNull(),
  type: varchar("type").default("milestone"), // milestone, special
  createdAt: timestamp("created_at").defaultNow(),
});

export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  badgeId: varchar("badge_id").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  applications: many(applications),
  userBadges: many(userBadges),
  createdOpportunities: many(opportunities, { relationName: "creator" }),
}));

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  creator: one(users, {
    fields: [opportunities.createdBy],
    references: [users.id],
    relationName: "creator",
  }),
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  opportunity: one(opportunities, {
    fields: [applications.opportunityId],
    references: [opportunities.id],
  }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  appliedAt: true,
  completedAt: true,
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;

// Public user type (without password for API responses)
export type PublicUser = Omit<User, 'password'>;

// Extended types with relations
export type OpportunityWithCreator = Opportunity & {
  creator: PublicUser;
  _count?: {
    applications: number;
  };
};

export type ApplicationWithDetails = Application & {
  user: PublicUser;
  opportunity: Opportunity;
};

export type UserWithStats = PublicUser & {
  _count?: {
    applications: number;
    completedApplications: number;
  };
  rank?: number;
};
