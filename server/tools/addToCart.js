import { tool } from "langchain";
import { z } from "zod";
import mongoose from "mongoose";
import ProductModel from "../models/product.model.js";
import CartProductModel from "../models/cartproduct.model.js";
import UserModel from "../models/user.model.js";

const addToCartTool = tool(
  async ({ productId, quantity }, config) => {
    try {
      // userId comes from the server (verified JWT), NOT from the LLM
      const userId = config?.configurable?.userId;

      if (!userId) {
        return JSON.stringify({
          success: false,
          message: "User is not logged in. Ask the user to log in first.",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return JSON.stringify({
          success: false,
          message: "Invalid product ID",
        });
      }

      const product = await ProductModel.findOne({
        _id: productId,
        publish: true,
      });

      if (!product) {
        return JSON.stringify({ success: false, message: "Product not found" });
      }

      const hasStockInfo =
        product.stock !== null && product.stock !== undefined;

      if (hasStockInfo && product.stock <= 0) {
        return JSON.stringify({
          success: false,
          message: `${product.name} is out of stock`,
        });
      }

      const qty = Math.min(Math.max(Math.floor(Number(quantity)) || 1, 1), 20);

      const cartItem = await CartProductModel.findOne({ userId, productId });
      const newQty = (cartItem?.quantity || 0) + qty;

      if (hasStockInfo && newQty > product.stock) {
        return JSON.stringify({
          success: false,
          message: `Only ${product.stock} of ${product.name} available`,
        });
      }

      if (cartItem) {
        cartItem.quantity = newQty;
        await cartItem.save();

        return JSON.stringify({
          success: true,
          message: `${product.name} quantity updated in cart`,
          quantity: cartItem.quantity,
        });
      }

      const created = await CartProductModel.create({
        quantity: qty,
        userId,
        productId,
      });

      await UserModel.updateOne(
        { _id: userId },
        { $addToSet: { shopping_cart: created._id } },
      );

      return JSON.stringify({
        success: true,
        message: `${product.name} added to cart`,
        quantity: created.quantity,
      });
    } catch (error) {
      console.error("Add To Cart Error:", error);
      return JSON.stringify({
        success: false,
        message: "Unable to add product to cart",
      });
    }
  },
  {
    name: "add_to_cart",
    description:
      "Add a real GrabNGo product to the logged-in user's shopping cart.",
    schema: z.object({
      productId: z.string().describe("ID of the product to add"),
      quantity: z.number().default(1).describe("Number of products to add"),
    }),
  },
);

export default addToCartTool;
