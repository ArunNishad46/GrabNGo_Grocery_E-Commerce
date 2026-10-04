import jwt from "jsonwebtoken";
import shoppingAgent, { memory } from "../services/aiAgent.js";

const getUserId = (req) => {
  const token =
    req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
    return decoded.id || decoded._id || null;
  } catch {
    return null; // invalid/expired token -> guest
  }
};

const getThreadId = (userId, sessionId) =>
  userId
    ? `user_${userId}`
    : `guest_${String(sessionId || "default").slice(0, 64)}`;

export const chatWithAI = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Message is required" });
    }
    if (message.length > 500) {
      return res
        .status(400)
        .json({ success: false, message: "Message is too long" });
    }

    const userId = getUserId(req);
    const threadId = getThreadId(userId, sessionId);

    const result = await shoppingAgent.invoke(
      { messages: [{ role: "user", content: message.trim() }] },
      { configurable: { thread_id: threadId, userId } },
    );

    const lastMessage = result.messages[result.messages.length - 1];
    return res
      .status(200)
      .json({ success: true, message: lastMessage.content });
  } catch (error) {
    console.error("AI Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "AI assistant failed to process your request.",
    });
  }
};

// Clears the AI's memory for this user/guest so the next message starts fresh
export const resetChat = async (req, res) => {
  try {
    const userId = getUserId(req);
    const threadId = getThreadId(userId, req.body?.sessionId);

    await memory.deleteThread(threadId);

    return res.status(200).json({ success: true, message: "Chat reset" });
  } catch (error) {
    console.error("AI Reset Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to reset chat" });
  }
};
