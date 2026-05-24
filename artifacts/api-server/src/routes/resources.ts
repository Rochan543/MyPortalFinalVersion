import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db, resourcesTable, previousYearPapersTable } from "@workspace/db";
import { eq, ilike, or, and } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/auth";
import { logger } from "../lib/logger";
import cloudinary from "../lib/cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const router = Router();

// const uploadsDir = path.resolve(process.cwd(), "uploads");
// if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// const storage = multer.diskStorage({
//   destination(req, _file, cb) {
//     const subDir = req.path.includes("previous-papers") ? "papers" : "resources";
//     const dir = path.join(uploadsDir, subDir);
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
//     cb(null, dir);
//   },
//   filename(_req, file, cb) {
//     const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
//     cb(null, `${unique}-${file.originalname}`);
//   },
// });

// const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = req.path.includes("previous-papers")
      ? "previous-papers"
      : "resources";

return {
  folder: `myportal/${folder}`,
  resource_type: "auto",
  public_id: `${Date.now()}-${file.originalname}`,
};
    },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

// ── RESOURCES ────────────────────────────────────────────────────────────────

// Admin: List all resources
router.get("/admin/resources/list", authenticate, requireAdmin, async (req, res) => {
  try {
    const resources = await db.select().from(resourcesTable).orderBy(resourcesTable.createdAt);
    res.json(resources);
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: Upload resource
router.post("/admin/resources/upload", authenticate, requireAdmin, upload.single("file"), async (req, res) => {
  try {
    const { subjectName, topicName, title, description, tags } = req.body;
    if (!title) { res.status(400).json({ error: "title required" }); return; }

    const fileType = req.file ? path.extname(req.file.originalname).replace(".", "").toLowerCase() : null;
    const [resource] = await db.insert(resourcesTable).values({
      subjectName: subjectName || null,
      topicName: topicName || null,
      title,
      description: description || null,
      fileName: req.file?.originalname || null,
      fileType,
      // filePath: req.file ? path.relative(process.cwd(), req.file.path) : null,
      filePath: (req.file as any)?.path || null,
      fileSize: req.file?.size || null,
      tags: tags || null,
      uploadedBy: req.user!.id,
    }).returning();

    res.status(201).json(resource);
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: Edit resource
router.put("/admin/resources/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { subjectName, topicName, title, description, tags } = req.body;
    const [updated] = await db.update(resourcesTable).set({
      ...(subjectName !== undefined && { subjectName }),
      ...(topicName !== undefined && { topicName }),
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(tags !== undefined && { tags }),
    }).where(eq(resourcesTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: Delete resource
router.delete("/admin/resources/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
    // if (resource?.filePath) {
    //   try { fs.unlinkSync(path.resolve(process.cwd(), resource.filePath)); } catch {}
    // }
    await db.delete(resourcesTable).where(eq(resourcesTable.id, id));
    res.status(204).send();
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Student: List resources
router.get("/resources", async (req, res) => {
  try {
    const { subject, topic, search } = req.query as Record<string, string>;
    let query = db.select().from(resourcesTable);
    const conditions = [];
    if (subject) conditions.push(eq(resourcesTable.subjectName, subject));
    if (topic) conditions.push(eq(resourcesTable.topicName, topic));
    if (search) conditions.push(or(
      ilike(resourcesTable.title, `%${search}%`),
      ilike(resourcesTable.subjectName, `%${search}%`),
      ilike(resourcesTable.topicName, `%${search}%`),
    ));
    const resources = await (conditions.length > 0
      ? db.select().from(resourcesTable).where(and(...conditions))
      : db.select().from(resourcesTable)
    ).orderBy(resourcesTable.createdAt);
    res.json(resources);
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Student: Get resource detail
router.get("/resources/:id", authenticate, async (req, res) => {
  try {
    const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, parseInt(String(req.params.id)))).limit(1);
    if (!resource) { res.status(404).json({ error: "Not found" }); return; }
    res.json(resource);
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Student: View / Download resource file
// router.get("/resources/:id/file", authenticate, async (req, res) => {
//   try {
//     const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, parseInt(String(req.params.id)))).limit(1);
//     if (!resource?.filePath) { res.status(404).json({ error: "File not found" }); return; }
//     const absPath = path.resolve(process.cwd(), resource.filePath);
//     if (!fs.existsSync(absPath)) { res.status(404).json({ error: "File missing on server" }); return; }
//     const download = req.query.download === "1";
//     if (download) {
//       res.download(absPath, resource.fileName || "file");
//     } else {
//       res.sendFile(absPath);
//     }
//   } catch (err) {
//     logger.error({ err });
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

router.get("/resources/:id/file", async (req, res) => {
  try {
    const [resource] = await db
      .select()
      .from(resourcesTable)
      .where(eq(resourcesTable.id, parseInt(String(req.params.id))))
      .limit(1);

    if (!resource?.filePath) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const download = req.query.download === "1";

    if (download) {
      return res.redirect(resource.filePath);
    }

    return res.redirect(resource.filePath);

  } catch (err) {
    logger.error({ err });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Student: Get TXT/DOCX content as text
// router.get("/resources/:id/content", authenticate, async (req, res) => {
//   try {
//     const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, parseInt(String(req.params.id)))).limit(1);
//     if (!resource?.filePath) { res.status(404).json({ error: "No file" }); return; }
//     const absPath = path.resolve(process.cwd(), resource.filePath);
//     if (!fs.existsSync(absPath)) { res.status(404).json({ error: "File missing" }); return; }

//     if (resource.fileType === "txt") {
//       const text = fs.readFileSync(absPath, "utf-8");
//       res.json({ content: text, type: "text" });
//     } else if (resource.fileType === "docx") {
//       const mammoth = await import("mammoth");
//       const result = await mammoth.convertToHtml({ path: absPath });
//       res.json({ content: result.value, type: "html" });
//     } else {
//       res.status(400).json({ error: "Use /file endpoint for PDFs" });
//     }
//   } catch (err) {
//     logger.error({ err });
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// ── PREVIOUS YEAR PAPERS ─────────────────────────────────────────────────────

// Admin: List
router.get("/admin/previous-papers/list", authenticate, requireAdmin, async (req, res) => {
  try {
    const papers = await db.select().from(previousYearPapersTable).orderBy(previousYearPapersTable.examYear);
    res.json(papers);
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: Upload paper
router.post("/admin/previous-papers/upload", authenticate, requireAdmin, upload.single("file"), async (req, res) => {
  try {
    const { examName, examYear, shiftName, subjectName, title, description } = req.body;
    if (!title) { res.status(400).json({ error: "title required" }); return; }

    const fileType = req.file ? path.extname(req.file.originalname).replace(".", "").toLowerCase() : null;
    const [paper] = await db.insert(previousYearPapersTable).values({
      examName: examName || null,
      examYear: examYear ? parseInt(examYear) : null,
      shiftName: shiftName || null,
      subjectName: subjectName || null,
      title,
      description: description || null,
      fileName: req.file?.originalname || null,
      fileType,
      // filePath: req.file ? path.relative(process.cwd(), req.file.path) : null,
      filePath: (req.file as any)?.path || null,
      fileSize: req.file?.size || null,
      uploadedBy: req.user!.id,
    }).returning();

    res.status(201).json(paper);
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: Edit paper
router.put("/admin/previous-papers/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { examName, examYear, shiftName, subjectName, title, description } = req.body;
    const [updated] = await db.update(previousYearPapersTable).set({
      ...(examName !== undefined && { examName }),
      ...(examYear !== undefined && { examYear: parseInt(examYear) }),
      ...(shiftName !== undefined && { shiftName }),
      ...(subjectName !== undefined && { subjectName }),
      ...(title && { title }),
      ...(description !== undefined && { description }),
    }).where(eq(previousYearPapersTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: Delete paper
router.delete("/admin/previous-papers/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const [paper] = await db.select().from(previousYearPapersTable).where(eq(previousYearPapersTable.id, id)).limit(1);
    // if (paper?.filePath) {
    //   try { fs.unlinkSync(path.resolve(process.cwd(), paper.filePath)); } catch {}
    // }
    await db.delete(previousYearPapersTable).where(eq(previousYearPapersTable.id, id));
    res.status(204).send();
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Student: List papers
router.get("/previous-papers", async (req, res) => {
  try {
    const { examName, year, search } = req.query as Record<string, string>;
    const conditions = [];
    if (examName) conditions.push(eq(previousYearPapersTable.examName, examName));
    if (year) conditions.push(eq(previousYearPapersTable.examYear, parseInt(String(year))));
    if (search) conditions.push(or(
      ilike(previousYearPapersTable.title, `%${search}%`),
      ilike(previousYearPapersTable.examName, `%${search}%`),
    ));
    const papers = await (conditions.length > 0
      ? db.select().from(previousYearPapersTable).where(and(...conditions))
      : db.select().from(previousYearPapersTable)
    ).orderBy(previousYearPapersTable.examYear);
    res.json(papers);
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Student: Get paper detail
router.get("/previous-papers/:id", authenticate, async (req, res) => {
  try {
    const [paper] = await db.select().from(previousYearPapersTable).where(eq(previousYearPapersTable.id, parseInt(String(req.params.id)))).limit(1);
    if (!paper) { res.status(404).json({ error: "Not found" }); return; }
    res.json(paper);
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Student: View/Download paper file
// router.get("/previous-papers/:id/file", authenticate, async (req, res) => {
//   try {
//     const [paper] = await db.select().from(previousYearPapersTable).where(eq(previousYearPapersTable.id, parseInt(String(req.params.id)))).limit(1);
//     if (!paper?.filePath) { res.status(404).json({ error: "File not found" }); return; }
//     const absPath = path.resolve(process.cwd(), paper.filePath);
//     if (!fs.existsSync(absPath)) { res.status(404).json({ error: "File missing" }); return; }
//     const download = req.query.download === "1";
//     if (download) {
//       res.download(absPath, paper.fileName || "paper");
//     } else {
//       res.sendFile(absPath);
//     }
//   } catch (err) {
//     logger.error({ err });
//     res.status(500).json({ error: "Internal server error" });
//   }
// });
router.get("/previous-papers/:id/file", async (req, res) => {
  try {
    const [paper] = await db
      .select()
      .from(previousYearPapersTable)
      .where(eq(previousYearPapersTable.id, parseInt(String(req.params.id))))
      .limit(1);

    if (!paper?.filePath) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const download = req.query.download === "1";

    if (download) {
      return res.redirect(paper.filePath);
    }

    return res.redirect(paper.filePath);

  } catch (err) {
    logger.error({ err });
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
