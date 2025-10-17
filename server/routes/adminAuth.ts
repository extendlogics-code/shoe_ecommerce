import { Router } from "express";
import { authenticateAdmin, createAdminUser } from "../services/adminService";

const router = Router();

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body as { email?: unknown; password?: unknown };

  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  try {
    const admin = await authenticateAdmin(email, password);
    if (!admin) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    res.json({ message: "Login successful", role: admin.role });
  } catch (error) {
    next(error);
  }
});

router.post("/users", async (req, res, next) => {
  const { creatorEmail, creatorPassword, email, password, role } = req.body as {
    creatorEmail?: unknown;
    creatorPassword?: unknown;
    email?: unknown;
    password?: unknown;
    role?: unknown;
  };

  if (
    typeof creatorEmail !== "string" ||
    typeof creatorPassword !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    res.status(400).json({ message: "Creator and new admin credentials are required" });
    return;
  }

  const normalizedRole = typeof role === "string" ? role.toLowerCase() : "viewer";

  if (normalizedRole !== "viewer") {
    res.status(400).json({ message: "Only view-level access can be provisioned via this endpoint" });
    return;
  }

  try {
    const creator = await authenticateAdmin(creatorEmail, creatorPassword);
    if (!creator || creator.role !== "superadmin") {
      res.status(403).json({ message: "Only superadmins can manage admin access" });
      return;
    }

    const admin = await createAdminUser({
      email,
      password,
      role: "viewer"
    });

    res.status(201).json({ message: "Admin access created", admin });
  } catch (error) {
    next(error);
  }
});

export default router;
