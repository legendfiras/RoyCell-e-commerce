import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    detail: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, default: 0, min: 0 },
    badge: { type: String, default: undefined },
    imageUrl: { type: String, default: undefined },
    rating: { type: String, default: "4.8/5" },
    reviews: { type: String, default: "0" },
    color: { type: String, default: "graphite" }
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
