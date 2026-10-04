import express from "express";
import { chatWithAI, resetChat } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/chat", chatWithAI);
router.post("/reset", resetChat);

export default router;
