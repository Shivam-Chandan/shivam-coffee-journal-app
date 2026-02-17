import "dotenv/config";  // Load .env variables at the very start
import express, { type Request, Response, NextFunction } from "express";
import "./db";  // Initialize Firebase Admin SDK before anything else
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  // FIX 1: await the routes registration so 'server' is the actual HTTP server, not a Promise
  const server = await registerRoutes(app);

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // FIX 2 & 3: Separate logic for Dev vs Prod
  if (app.get("env") === "development") {
    // In Dev: Setup Vite middleware with Hot Module Reloading
    await setupVite(app, server);
  } else {
    // In Prod: Just serve the static files from /dist/public
    serveStatic(app);
  }

  // Cloud Run requires listening on 0.0.0.0
  const PORT = parseInt(process.env.PORT || "8080", 10);
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();