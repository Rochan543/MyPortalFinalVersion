import { Router } from "express";
import bcrypt from "bcrypt";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, signToken } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { fullName, username, password } = req.body;
    if (!fullName || !username || !password) {
      res.status(400).json({ error: "fullName, username, and password are required" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Username already taken" });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      fullName,
      username,
      password: hashedPassword,
      role: "STUDENT",
    }).returning();
    const token = signToken({ id: user.id, username: user.username, role: user.role });
    res.status(201).json({
      token,
      user: { id: user.id, fullName: user.fullName, username: user.username, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    logger.error({ err }, "Register error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "username and password are required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = signToken({ id: user.id, username: user.username, role: user.role });
    res.json({
      token,
      user: { id: user.id, fullName: user.fullName, username: user.username, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ id: user.id, fullName: user.fullName, username: user.username, role: user.role, createdAt: user.createdAt });
  } catch (err) {
    logger.error({ err }, "GetMe error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
