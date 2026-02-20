import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCoffeeSchema } from "@shared/schema";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import helmet from "helmet";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

export async function registerRoutes(app: Express): Promise<Server> {
  // Trust the proxy to ensure correct protocol (https) in callback URLs on Cloud Run
  app.set("trust proxy", 1);

  // 1. Security Headers (Helmet)
  // Generate a nonce for this request to allow specific inline scripts if absolutely necessary
  // Ideally, move all inline scripts to external files.
  app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString("base64");
    next();
  });

  const isProduction = process.env.NODE_ENV === "production";

  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", (req: any, res: any) => `'nonce-${res.locals.nonce}'`],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "https://*.googleusercontent.com"],
              connectSrc: ["'self'"],
            },
          }
        : false,
    })
  );

  // 2. Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
  });
  app.use("/api", apiLimiter);

  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required.");
  }

  // 1. Setup Session & Passport
  app.use(session({ 
    secret: process.env.SESSION_SECRET, 
    resave: false, 
    saveUninitialized: false,
    cookie: {
      // In Cloud Run/Production, we are always behind a proxy that terminates SSL.
      // We trust the proxy, so we can enforce secure cookies.
      secure: app.get("env") === "production" || process.env.NODE_ENV === "production",
      httpOnly: true, // Prevent client-side JS from reading the cookie
      sameSite: "lax", // CSRF protection
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required.");
  }

  // 2. Configure Google Strategy
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  ));

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user: any, done) => done(null, user));

  // 3. Auth Routes
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  
  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
      res.redirect("/"); // Redirect to home after login
    }
  );

  app.get("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect("/");
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      // Return user info so frontend can change title to "Username coffee journal"
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Get all coffees
  app.get("/api/coffees", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    try {
      // allow sorting by date or overall taste rating, and optional filter by
      // brand name. `brand` is expected to match the stored `brandName`.
      const sortParam = req.query.sort as string | undefined;
      // Ensure brandParam is a string (handle array or undefined)
      const brandParam = typeof req.query.brand === 'string' ? req.query.brand : undefined;
      console.log("GET /api/coffees sortParam=", sortParam, "brand=", brandParam);

      const sortKey = sortParam === "overallTasteRating" ? "overallTasteRating" : "orderDate";
      const userId = (req.user as any).id;
      const coffees = await storage.getCoffees(userId, sortKey as any, brandParam);
      res.json(coffees);
    } catch (error) {
      console.error("Error fetching coffees:", error);
      res.status(500).json({ error: "Failed to fetch coffees" });
    }
  });

  // Get single coffee
  app.get("/api/coffees/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    try {
      const userId = (req.user as any).id;
      const coffee = await storage.getCoffee(userId, req.params.id);
      if (!coffee) {
        return res.status(404).json({ error: "Coffee not found" });
      }
      res.json(coffee);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch coffee" });
    }
  });

  // Create coffee
  app.post("/api/coffees", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    try {
      const validatedData = insertCoffeeSchema.parse(req.body);
      const userId = (req.user as any).id;
      const coffee = await storage.createCoffee(userId, validatedData);
      res.status(201).json(coffee);
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create coffee" });
    }
  });

  // Update coffee
  app.patch("/api/coffees/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    try {
      const validatedData = insertCoffeeSchema.parse(req.body);
      const userId = (req.user as any).id;
      const coffee = await storage.updateCoffee(userId, req.params.id, validatedData);
      if (!coffee) {
        return res.status(404).json({ error: "Coffee not found" });
      }
      res.json(coffee);
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to update coffee" });
    }
  });

  // Delete coffee
  app.delete("/api/coffees/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    try {
      const userId = (req.user as any).id;
      const deleted = await storage.deleteCoffee(userId, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Coffee not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete coffee" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
