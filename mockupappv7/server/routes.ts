import express from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { getLayout, setLayout, deleteLayout, getPresets, savePreset, deletePreset } from "./settings-store";

export async function registerRoutes(app: Express): Promise<Server> {
  // Projects API endpoints
  const projectsRouter = express.Router();

  // Get all projects
  projectsRouter.get("/", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error: unknown) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Get project by ID
  projectsRouter.get("/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error: unknown) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Create new project
  projectsRouter.post("/", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const newProject = await storage.createProject(validatedData);
      res.status(201).json(newProject);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid project data", 
          errors: fromZodError(error).message
        });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Update project
  projectsRouter.put("/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Validate the update data
      const projectSchema = insertProjectSchema.extend({
        id: z.number()
      });
      
      const validatedData = projectSchema.parse({
        ...req.body,
        id
      });

      const updatedProject = await storage.updateProject(id, validatedData);
      res.json(updatedProject);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid project data", 
          errors: fromZodError(error).message
        });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Delete project
  projectsRouter.delete("/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error: unknown) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Mount the projects router
  app.use("/api/projects", projectsRouter);

  // ── Mockup layout persistence ─────────────────────────────────────────────
  // Stores per-mockup design placement settings (shirt offsets, global X/Y, W/H)
  // as JSON files on the server filesystem so they survive browser clears.

  // GET /api/layouts/:mockupId
  app.get("/api/layouts/:mockupId", async (req, res) => {
    const mockupId = parseInt(req.params.mockupId);
    if (isNaN(mockupId)) return res.status(400).json({ message: "Invalid mockup ID" });
    try {
      const layout = await getLayout(mockupId);
      if (!layout) return res.status(404).json({ message: "No saved layout" });
      res.json(layout);
    } catch (e) {
      res.status(500).json({ message: "Database error" });
    }
  });

  // PUT /api/layouts/:mockupId  — saves (or replaces) the layout
  app.put("/api/layouts/:mockupId", async (req, res) => {
    const mockupId = parseInt(req.params.mockupId);
    if (isNaN(mockupId)) return res.status(400).json({ message: "Invalid mockup ID" });
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ message: "Body must be a JSON object" });
    }
    try {
      await setLayout(mockupId, req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ message: "Database error" });
    }
  });

  // DELETE /api/layouts/:mockupId  — clears saved layout (reset to defaults)
  app.delete("/api/layouts/:mockupId", async (req, res) => {
    const mockupId = parseInt(req.params.mockupId);
    if (isNaN(mockupId)) return res.status(400).json({ message: "Invalid mockup ID" });
    try {
      await deleteLayout(mockupId);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ message: "Database error" });
    }
  });

  // ── Custom presets persistence ────────────────────────────────────────────
  app.get("/api/presets", async (_req, res) => {
    try {
      res.json(await getPresets());
    } catch (e) {
      res.status(500).json({ message: "Database error" });
    }
  });

  app.post("/api/presets", async (req, res) => {
    const { name, widthFactor, heightFactor, globalXOffset, globalYOffset } = req.body ?? {};
    if (!name || typeof widthFactor !== "number" || typeof heightFactor !== "number") {
      return res.status(400).json({ message: "name, widthFactor, and heightFactor are required" });
    }
    try {
      await savePreset({
        name: String(name).trim(),
        widthFactor,
        heightFactor,
        globalXOffset: typeof globalXOffset === "number" ? globalXOffset : 0,
        globalYOffset: typeof globalYOffset === "number" ? globalYOffset : -200,
      });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ message: "Database error" });
    }
  });

  app.delete("/api/presets/:name", async (req, res) => {
    try {
      await deletePreset(decodeURIComponent(req.params.name));
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ message: "Database error" });
    }
  });
  // ─────────────────────────────────────────────────────────────────────────

  const httpServer = createServer(app);
  return httpServer;
}
