import express from "express";
import CustomErrorHandler from "../utils/customError.js";
import catchAsyncError from "../middleware/catchAsyncError.js";
import Order from "../Models/orderModel.js";
import {
  authorizeRoles,
  isAuthenticatedUser,
} from "../middleware/authenticate.js";

const orderRouter = express.Router();

// POST - Create a new order

orderRouter.post(
  "/create/new-order",
  isAuthenticatedUser,
  catchAsyncError(async (req, res, next) => {
    const {
      orderItems,
      shippingInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paymentInfo,
    } = req.body;

    const order = await Order.create({
      orderItems,
      shippingInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paymentInfo,
      paidAt: Date.now(),
      user: req.user.id,
    });

    res.status(201).json({
      success: true,
      order,
    });
  })
);

// GET - Get a single order

orderRouter.get(
  "/order/:id",
  catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!order) {
      return next(new CustomErrorHandler("Order not found", 404));
    }

    res.status(200).json({ success: true, order });
  })
);

//GET - MyOrders

orderRouter.get(
  "/my-orders",
  isAuthenticatedUser,
  catchAsyncError(async (req, res, next) => {
    const orders = await Order.find({ user: req.user.id });

    res.status(200).json({
      success: true,
      orders,
    });
  })
);

//ADMIN

//GET - Get all orders

orderRouter.get(
  "/Admin/getAllOrders",
   isAuthenticatedUser,
   authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const orders = await Order.find();

    let totalAmount = 0;

    orders.forEach((order) => {
      totalAmount += order.totalPrice;
    });

    res.status(200).json({
      success: true,
      totalAmount,
      orders,
    });
  })
);

// ADMIN - UPDATE - Update a order

orderRouter.put(
  "/admin/orders/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new CustomErrorHandler("Order not found", 404));
    }

    if (order.orderStatus === "Completed") {
      return next(
        new CustomErrorHandler("Booking has already been Completed", 400)
      );
    }

    if (!req.body.orderStatus) {
      return next(new CustomErrorHandler("Booking status is required", 400));
    }

    order.orderStatus = req.body.orderStatus;

    if (req.body.orderStatus === "Completed") {
      order.deliveredAt = Date.now();
    }

    await order.save();

    res.status(200).json({
      success: true,
      order,
    });
  })
);

//ADMIN - DELETE - Delete a order

orderRouter.delete(
  "/admin/orders/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(
        new CustomErrorHandler(
          `Booking not found with ID: ${req.params.id}`,
          404
        )
      );
    }

    await order.deleteOne();

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  })
);

export default orderRouter;
