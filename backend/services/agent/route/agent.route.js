import { Router } from "express";
import { handlePrompt } from "../controller/agent.controller.js";

const router = Router();

// POST /prompt — invoke the multi-agent graph
router.post("/prompt", handlePrompt);

export default router;
