import { sql } from "drizzle-orm";
import { Router } from "express";
import { auth } from "../auth.js";
import { user } from "../db/auth-schema.js";
import { db } from "../db/index.js";
import { requireAdmin } from "../lib/auth-session.js";

const router = Router();

router.get("/users", requireAdmin, async (_req, res) => {
  try {
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user);

    res.json(users);

  } catch (error) {
    console.error("Admin users error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});


router.post("/users", requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

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


router.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        error: "User id is required",
      });
    }

  await db
  .delete(user)
  .where(sql`${user.id} = ${id}`);

    res.json({
      message: "User deleted successfully",
    });

  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      error: "Could not delete user",
    });
  }
});


router.put("/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        error: "User id is required",
      });
    }

    const {
      name,
      email,
      role,
    } = req.body;

    const updatedUser = await db
      .update(user)
      .set({
        name,
        email,
        role,
      })
.where(sql`${user.id} = ${id}`)
      .returning();

    res.json({
      message: "User updated successfully",
      user: updatedUser[0],
    });

  } catch (error) {
    console.error("Update user error:", error);

    res.status(500).json({
      error: "Could not update user",
    });
  }
});


export default router;