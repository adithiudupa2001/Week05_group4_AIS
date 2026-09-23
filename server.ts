import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import weatherHandler from "./api/weather.js";
import busHandler from "./api/bus.js";
import healthHandler from "./api/health.js";
import routesToShelterHandler from "./api/routes-to-shelter.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Registered API routes importing shared handlers
  app.get("/api/weather", weatherHandler);
  app.get("/api/bus", busHandler);
  app.get("/api/health", healthHandler);
  app.get("/api/routes-to-shelter", routesToShelterHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
