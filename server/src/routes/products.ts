import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { Product } from "../models/Product";
import { requireAdmin } from "../middleware/auth";

export const productsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const productDto = (product: any) => ({
  id: String(product._id),
  name: product.name,
  detail: product.detail,
  category: product.category,
  price: product.price,
  oldPrice: product.oldPrice,
  badge: product.badge,
  image: product.imageUrl,
  rating: product.rating,
  reviews: product.reviews,
  color: product.color
});

productsRouter.get("/", async (_req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products.map(productDto));
});

productsRouter.post("/", requireAdmin, upload.single("image"), async (req, res) => {
  const imageUrl = req.file
    ? `data:image/webp;base64,${(await sharp(req.file.buffer)
        .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer()).toString("base64")}`
    : undefined;

  const product = await Product.create({
    name: req.body.name,
    detail: req.body.detail,
    category: req.body.category,
    price: Number(req.body.price),
    oldPrice: Number(req.body.oldPrice || req.body.price || 0),
    badge: req.body.badge === "Best seller" ? "Best seller" : undefined,
    imageUrl,
    rating: req.body.rating || "4.8/5",
    reviews: req.body.reviews || "0",
    color: req.body.color || "graphite"
  });

  res.status(201).json(productDto(product));
});

productsRouter.put("/:id", requireAdmin, upload.single("image"), async (req, res) => {
  const existing = await Product.findById(req.params.id);
  if (!existing) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  const imageUrl = req.file
    ? `data:image/webp;base64,${(await sharp(req.file.buffer)
        .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer()).toString("base64")}`
    : existing.imageUrl;

  existing.set({
    name: req.body.name,
    detail: req.body.detail,
    category: req.body.category,
    price: Number(req.body.price),
    oldPrice: Number(req.body.oldPrice || req.body.price || 0),
    badge: req.body.badge === "Best seller" ? "Best seller" : undefined,
    imageUrl
  });

  await existing.save();
  res.json(productDto(existing));
});

productsRouter.delete("/:id", requireAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
