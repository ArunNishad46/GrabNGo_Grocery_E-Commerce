import { useState, useEffect, useRef } from "react";
import { FaRobot, FaTimes, FaPaperPlane, FaRedo } from "react-icons/fa";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";

const INITIAL_MESSAGE = {
  role: "assistant",
  content: "Hi! 👋 I am GrabNGo AI. How can I help with your groceries today?",
};

const AIShoppingAssistant = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [resetting, setResetting] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Generate or retrieve persistent guest sessionId
  useEffect(() => {
    let currentSession = localStorage.getItem("ai_session_id");
    if (!currentSession) {
      currentSession = "sess_" + crypto.randomUUID();
      localStorage.setItem("ai_session_id", currentSession);
    }
    setSessionId(currentSession);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setMessage("");
    setLoading(true);

    try {
      const response = await Axios({
        ...SummaryApi.aiChat,
        data: {
          message: text,
          sessionId, // identifies conversation thread on backend
        },
      });

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: response.data.success
            ? response.data.message
            : "Sorry, I couldn't process that. Please try again.",
        },
      ]);

      // If the AI changed the cart, refresh your cart here, e.g.:
      // fetchCartItem();
    } catch (error) {
      console.error("AI Error:", error);
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "Sorry, I ran into an issue. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = async () => {
    if (loading || resetting) return;

    setResetting(true);
    try {
      await Axios({ ...SummaryApi.aiReset, data: { sessionId } });
      setMessages([INITIAL_MESSAGE]);
      setMessage("");
    } catch (error) {
      console.error("AI reset error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't reset the chat. Please try again.",
        },
      ]);
    } finally {
      setResetting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-14 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-xl hover:bg-green-700 transition"
        >
          <FaRobot size={23} />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[515px] w-[400px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border-2 border-green-600 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-green-600 px-4 py-3 text-white">
            <div>
              <p className="font-semibold">GrabNGo AI</p>
              <p className="text-xs text-green-100">Smart shopping assistant</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                disabled={loading || resetting}
                title="New chat"
                className="rounded-full p-2 hover:bg-green-700 disabled:opacity-40"
              >
                <FaRedo className={resetting ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-green-700"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    item.role === "user"
                      ? "bg-green-600 text-white"
                      : "bg-white text-gray-700 shadow-sm"
                  }`}
                >
                  {item.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="w-fit rounded-2xl bg-white px-3 py-2 text-sm text-gray-500 shadow-sm animate-pulse">
                Thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-gray-300 bg-white p-3">
            <div className="flex gap-2 rounded-xl border border-gray-300 focus-within:border-green-500 px-3 py-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Find groceries, add items to cart..."
                rows={1}
                maxLength={500}
                disabled={loading}
                className="min-w-0 flex-1 resize-none outline-none text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !message.trim()}
                className="self-end text-green-600 disabled:opacity-40"
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIShoppingAssistant;
