import { tool } from "langchain";
import { z } from "zod";
import mongoose from "mongoose";
import ProductModel from "../models/product.model.js";
import CartProductModel from "../models/cartproduct.model.js";
import UserModel from "../models/user.model.js";

const removeFromCartTool = tool(
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

      // Only look inside THIS user's cart
      const cartItem = await CartProductModel.findOne({ userId, productId });

      if (!cartItem) {
        return JSON.stringify({
          success: false,
          message: "This product is not in your cart",
        });
      }

      const product = await ProductModel.findById(productId).lean();
      const name = product?.name || "Product";

      // Remove only some quantity (e.g. "remove 2 milk")
      const removeQty =
        quantity !== undefined && quantity !== null
          ? Math.floor(Number(quantity))
          : null;

      if (removeQty && removeQty > 0 && removeQty < cartItem.quantity) {
        cartItem.quantity -= removeQty;
        await cartItem.save();

        return JSON.stringify({
          success: true,
          message: `Removed ${removeQty} of ${name}. ${cartItem.quantity} left in cart`,
          quantity: cartItem.quantity,
        });
      }

      // Remove the whole item
      await CartProductModel.deleteOne({ _id: cartItem._id });

      await UserModel.updateOne(
        { _id: userId },
        { $pull: { shopping_cart: cartItem._id } },
      );

      return JSON.stringify({
        success: true,
        message: `${name} removed from cart`,
        quantity: 0,
      });
    } catch (error) {
      console.error("Remove From Cart Error:", error);

      return JSON.stringify({
        success: false,
        message: "Unable to remove product from cart",
      });
    }
  },

  {
    name: "remove_from_cart",
    description:
      "Remove a product from the logged-in user's cart. If quantity is given, remove only that many; otherwise remove the item completely.",
    schema: z.object({
      productId: z
        .string()
        .describe("ID of the product to remove (get it from get_cart)"),
      quantity: z
        .number()
        .optional()
        .describe(
          "How many to remove. Leave empty to remove the whole item from the cart",
        ),
    }),
  },
);

export default removeFromCartTool;
