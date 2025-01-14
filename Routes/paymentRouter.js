import express from "express";
import { isAuthenticatedUser } from "../middleware/authenticate.js";
import Stripe from "stripe";
import catchAsyncError from "../middleware/catchAsyncError.js";

const paymentRouter = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

paymentRouter.post(
  "/payment/process",
  isAuthenticatedUser,
  catchAsyncError(async (req, res, next) => {
    try {
      const { amount, shipping } = req.body;

      const minAmountInINR = 50;
      if (amount < minAmountInINR) {
        return res.status(400).json({
          success: false,
          message: `Amount must be at least ₹${minAmountInINR} to meet the Stripe minimum requirement.`,
        });
      }

      const transformedShipping = {
        ...shipping,
        address: {
          city: shipping.address.city,
          postal_code: shipping.address.postalCode,
          state: shipping.address.state,
          country: shipping.address.country,
        },
      };

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 1),
        currency: "INR",
        description: "CLEANEASE PAYMENT",
        metadata: { integration_check: "accept_payment" },
        shipping: transformedShipping,
      });

      res.status(200).json({
        success: true,
        client_secret: paymentIntent.client_secret,
      });
    } catch (error) {
      next(error);
    }
  })
);

paymentRouter.get(
  "/sendStripeApi",
  isAuthenticatedUser,
  catchAsyncError(async (req, res, next) => {
    res.status(200).json({
      stripeApiKey: process.env.STRIPE_PUBLIC_KEY,
    });
  })
);

export default paymentRouter;
