import express from "express";
import Order from "../models/Order.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// POST /api/orders (Auth required) - Create a new order
router.post("/", requireAuth, async (req, res) => {
  try {
    const { items, totalPrice, shippingInfo, paymentMethod, trackingId, courier, estimatedDeliveryDate } = req.body;
    if (!items || !totalPrice || !shippingInfo) {
      return res.status(400).json({ message: "Missing required order information." });
    }
    const order = await Order.create({
      userId: req.user.id,
      items,
      totalPrice,
      shippingInfo,
      paymentMethod: paymentMethod || "Cash on Delivery",
      trackingId: trackingId || `TRK-GZ-${Math.floor(100000 + Math.random() * 900000)}`,
      courier: courier || "SpeedPost Express",
      estimatedDeliveryDate: estimatedDeliveryDate || new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      status: "Processing",
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error creating order.", error: err.message });
  }
});

// GET /api/orders/my-orders (Auth required) - Get all orders for the current user
router.get("/my-orders", requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching your orders.", error: err.message });
  }
});

// GET /api/orders (Admin only) - Get all orders for management
router.get("/", requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching all orders.", error: err.message });
  }
});

// PATCH /api/orders/:id/status (Admin only) - Update order status
router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required." });
    
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found." });
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error updating order status.", error: err.message });
  }
});

export default router;
