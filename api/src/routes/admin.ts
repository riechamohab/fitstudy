import { Router } from "express";
import { auth } from "../auth.js";
import { user } from "../db/auth-schema.js";
import { db } from "../db/index.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

async function checkAdminRole(req: any, res: any, next: any) {
  const currentUser = await requireUser(req, res);

  if (!currentUser) {
    return;
  }

  if (currentUser.role !== "admin") {
    return res.status(403).json({
      error: "Admin access required",
    });
  }

  req.currentUser = currentUser;
  next();
}


router.get("/users", checkAdminRole, async (_req, res) => {
  try {
    const users = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }).from(user);

    res.json(users);

  } catch (error) {
    console.error("Admin users error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});
router.post("/users", checkAdminRole, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
    } = req.body;

    const newUser = await auth.api.createUser({
      body: {
        name,
        email,
        password,
        role,
      },
    });

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });

  } catch (error) {
    console.error("Create user error:", error);

    res.status(500).json({
      error: "Could not create user",
    });
  }
});

export default router;