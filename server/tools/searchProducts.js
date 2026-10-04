import { tool } from "langchain";
import { z } from "zod";
import ProductModel from "../models/product.model.js";
import { formatProduct } from "./productHelper.js";

// Escape special regex characters so user/LLM input can't break the query
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const searchProductsTool = tool(
  async ({ query, maxPrice }) => {
    try {
      const filters = {
        publish: true,
      };

      // Maximum price
      if (maxPrice !== undefined && maxPrice !== null) {
        filters.price = {
          $lte: Number(maxPrice),
        };
      }

      // Product name search (escaped + length-limited)
      if (query && query.trim()) {
        filters.name = {
          $regex: escapeRegex(query.trim().slice(0, 50)),
          $options: "i",
        };
      }

      const products = await ProductModel.find(filters).limit(6).lean();

      if (!products.length) {
        return JSON.stringify({
          success: false,
          message: "No products found",
        });
      }

      return JSON.stringify({
        success: true,
        products: products.map(formatProduct),
      });
    } catch (error) {
      console.error("Search Products Error:", error);

      return JSON.stringify({
        success: false,
        message: "Unable to search products",
      });
    }
  },

  {
    name: "search_products",
    description:
      "Search real GrabNGo grocery products by name or maximum price. Use this when the user wants to find grocery products.",
    schema: z.object({
      query: z
        .string()
        .describe("Product name or keyword, for example milk, rice, biscuit"),
      maxPrice: z
        .number()
        .optional()
        .describe("Maximum product price if the user specifies a budget"),
    }),
  },
);

export default searchProductsTool;
