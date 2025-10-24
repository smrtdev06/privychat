import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import {
  generateVerificationToken,
  sendVerificationEmail,
} from "./email-verification";
import { User as SelectUser } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    csrfToken?: string;
  }
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  console.log("");
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// CSRF protection functions
function generateCSRFToken(): string {
  return randomBytes(32).toString("hex");
}

function verifyCSRFToken(sessionToken: string, requestToken: string): boolean {
  if (!sessionToken || !requestToken) {
    return false;
  }
  return timingSafeEqual(Buffer.from(sessionToken), Buffer.from(requestToken));
}

// CSRF middleware
function csrfProtection(req: any, res: any, next: any) {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip CSRF for unauthenticated requests (handled by route-level auth)
  if (!req.isAuthenticated()) {
    return next();
  }

  const sessionToken = req.session.csrfToken;
  const requestToken = req.headers["x-csrf-token"] || req.body._csrfToken;

  if (!verifyCSRFToken(sessionToken, requestToken)) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  next();
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      // For Capacitor apps, we need secure cookies on HTTPS
      secure: process.env.NODE_ENV === "production" || true, // Always use secure in dev (Replit uses HTTPS)
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "none", // Required for cross-origin requests from Capacitor apps
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Apply CSRF protection middleware
  app.use(csrfProtection);

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      // Try to find user by username first, then by email
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserByEmail(username); // username field can contain email
      }

      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    // Generate and send email verification
    try {
      const { token, expiry } = generateVerificationToken();
      await storage.setEmailVerificationToken(user.id, token, expiry);
      await sendVerificationEmail(user.email, user.fullName, token);
    } catch (error) {
      console.error(
        "Error sending verification email during registration:",
        error,
      );
      // Don't fail registration if email fails - user can resend later
    }

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.status(200).json(req.user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // CSRF token endpoint
  app.get("/api/csrf-token", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Generate or retrieve CSRF token from session
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateCSRFToken();
    }

    res.json({ csrfToken: req.session.csrfToken });
  });
}
