import { Router } from "express";
import { googleSignIn, getMe, logout } from "../controllers/auth.controller.js";

const router = Router();

// POST /google — Firebase Google Sign-In
router.post("/google", googleSignIn);

// GET /me — Check current session
router.get("/me", getMe);

// POST /logout — Destroy session
router.post("/logout", logout);

export default router;
