import { ChatGroq } from "@langchain/groq";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import searchProductsTool from "../tools/searchProducts.js";
import getProductDetailsTool from "../tools/getProductDetails.js";
import addToCartTool from "../tools/addToCart.js";
import getCartTool from "../tools/getCart.js";
import removeFromCartTool from "../tools/removeFromCart.js";

// Groq model
const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-20b",
  temperature: 0,
  maxTokens: undefined,
  maxRetries: 3,
});

// In-memory checkpointer (lost on server restart; use a persistent one in production)
export const memory = new MemorySaver();

// Create GrabNGo AI Agent
const shoppingAgent = createAgent({
  model,
  tools: [
    searchProductsTool,
    getProductDetailsTool,
    addToCartTool,
    getCartTool,
    removeFromCartTool,
  ],
  systemPrompt: `
  You are GrabNGo AI, a grocery shopping assistant.
  You help users find groceries and manage their shopping cart.

  You have these tools:
  1. search_products
    Search real products from GrabNGo MongoDB.
  2. get_product_details
    Get details about a specific product.
  3. add_to_cart
    Add a real product to the user's cart.
  4. get_cart
    Show what is currently in the user's cart.
  5. remove_from_cart
    Remove a product (or some quantity) from the user's cart.

  RULES:
  - Use search_products when the user wants to find products.
  - Use get_product_details when the user asks about a specific product.
  - Use add_to_cart only when the user clearly asks to add something to the cart.
    If you don't have the product ID, search first.
  - Use get_cart when the user asks what is in their cart.
  - Use remove_from_cart only when the user clearly asks to remove something.
    Call get_cart first to find the correct product ID, then call remove_from_cart.
    If several cart items match the user's words, ask which one they mean.
  - Never ask the user for a user ID. The system handles it automatically.
  - If a cart tool says the user is not logged in, tell them to log in first.
  - Never invent product names, prices, stock information or product IDs.
  - Use real product information returned by the tools.
  - If a product is not found, tell the user.
  - Keep answers short and easy to understand.
  - Do not use a tool when it is not necessary.
  `,
  checkpointer: memory,
});

export default shoppingAgent;
