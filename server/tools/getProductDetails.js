import { tool } from "langchain";
import { z } from "zod";
import mongoose from "mongoose";
import ProductModel from "../models/product.model.js";
import { formatProduct } from "./productHelper.js";

const getProductDetailsTool = tool(
  async ({ productId }) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return JSON.stringify({
          success: false,
          message: "Invalid product ID",
        });
      }

      const product = await ProductModel.findOne({
        _id: productId,
        publish: true,
      }).lean();

      if (!product) {
        return JSON.stringify({
          success: false,
          message: "Product not found",
        });
      }

      return JSON.stringify({
        success: true,
        product: formatProduct(product),
      });
    } catch (error) {
      console.error("Product Details Error:", error);

      return JSON.stringify({
        success: false,
        message: "Unable to get product details",
      });
    }
  },

  {
    name: "get_product_details",
    description:
      "Get complete information about a specific GrabNGo product using its product ID.",
    schema: z.object({
      productId: z.string().describe("MongoDB product ID"),
    }),
  },
);

export default getProductDetailsTool;
