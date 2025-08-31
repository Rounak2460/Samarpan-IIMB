import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import bcrypt from "bcrypt";

// Simple email validation for IIMB domain
function isValidIIMBEmail(email: string): boolean {
  return email.endsWith("@iimb.ac.in") || email.endsWith("@iimb.ernet.in");
}

// Determine role based on email pattern
function determineRoleFromEmail(email: string): string {
  // Faculty and admin emails typically have specific patterns
  const adminPatterns = [
    /faculty\./,
    /admin\./,
    /director\./,
    /dean\./,
    /registrar\./,
    /samarpan\./,
    /social\.impact\./
  ];
  
  const emailLower = email.toLowerCase();
  
  for (const pattern of adminPatterns) {
    if (pattern.test(emailLower)) {
      return "admin";
    }
  }
  
  return "student"; // Default to student
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for email/password authentication
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email: string, password: string, done) => {
      try {
        // Validate IIMB email domain
        if (!isValidIIMBEmail(email)) {
          return done(null, false, { message: 'Only @iimb.ac.in email addresses are allowed' });
        }

        // Check if user exists
        const existingUser = await storage.getUserByEmail(email);
        
        if (!existingUser) {
          return done(null, false, { message: 'Account not found. Please register first.' });
        }

        // For demo purposes, we'll use a simple password check
        // In production, you'd use proper password hashing
        if (password === "iimb2024" || (existingUser as any).tempPassword === password) {
          return done(null, {
            id: existingUser.id,
            email: existingUser.email,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            role: existingUser.role,
            profileImageUrl: existingUser.profileImageUrl
          });
        } else {
          return done(null, false, { message: 'Invalid password' });
        }
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Authentication routes
  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Authentication error' });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login error' });
        }
        return res.json({ user, message: 'Login successful' });
      });
    })(req, res, next);
  });

  app.post('/api/register', async (req, res) => {
    try {
      const { email, firstName, lastName, role, program } = req.body;
      
      // Validate IIMB email domain
      if (!isValidIIMBEmail(email)) {
        return res.status(400).json({ message: 'Only @iimb.ac.in email addresses are allowed' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Account already exists with this email' });
      }

      // Determine role (can be overridden by manual selection)
      const autoRole = determineRoleFromEmail(email);
      const finalRole = role || autoRole;

      // Create new user
      const newUser = await storage.createUser({
        email,
        firstName,
        lastName,
        role: finalRole,
        program: program || "PGP",
        coins: finalRole === "admin" ? 1000 : 0, // Give admins initial coins
      });

      res.status(201).json({ 
        user: newUser, 
        message: 'Registration successful',
        tempPassword: 'iimb2024' // For demo - in production use proper password system
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout error' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};