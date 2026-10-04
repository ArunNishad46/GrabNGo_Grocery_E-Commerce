import { tool } from "langchain";
import { z } from "zod";
import ProductModel from "../models/product.model.js";
import CartProductModel from "../models/cartproduct.model.js";
import { formatProduct } from "./productHelper.js";

const getCartTool = tool(
  async (_input, config) => {
    try {
      // userId comes from the server (verified JWT), NOT from the LLM
      const userId = config?.configurable?.userId;

      if (!userId) {
        return JSON.stringify({
          success: false,
          message: "User is not logged in. Ask the user to log in first.",
        });
      }

      const cartItems = await CartProductModel.find({ userId }).lean();

      if (!cartItems.length) {
        return JSON.stringify({
          success: true,
          message: "Cart is empty",
          items: [],
          total: 0,
        });
      }

      const products = await ProductModel.find({
        _id: { $in: cartItems.map((item) => item.productId) },
      }).lean();

      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      let total = 0;
      const items = [];

      for (const item of cartItems) {
        const product = productMap.get(item.productId.toString());
        if (!product) continue; // product deleted from store

        const formatted = formatProduct(product);
        const lineTotal = formatted.finalPrice * item.quantity;
        total += lineTotal;

        items.push({
          productId: formatted.id,
          name: formatted.name,
          quantity: item.quantity,
          unitPrice: formatted.finalPrice,
          lineTotal,
        });
      }

      return JSON.stringify({ success: true, items, total });
    } catch (error) {
      console.error("Get Cart Error:", error);

      return JSON.stringify({
        success: false,
        message: "Unable to get cart",
      });
    }
  },

  {
    name: "get_cart",
    description:
      "Get the logged-in user's current shopping cart items with product IDs, quantities and total. Use this to show the cart, or to find the product ID before removing an item.",
    schema: z.object({}),
  },
);

export default getCartTool;
