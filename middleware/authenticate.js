import jwt from "jsonwebtoken";

import catchAsyncError from "./catchAsyncError.js";
import CustomErrorHandler from "../utils/customError.js";
import User from "../Models/userModel.js";

export const isAuthenticatedUser = catchAsyncError(async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return next(
      new CustomErrorHandler("Login first to handle this resource", 401)
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return next(new CustomErrorHandler("Invalid or expired token", 401));
  }
});

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new CustomErrorHandler(`Role ${req.user.role} is not allowed`, 401)
      );
    }
    next();
  };
};
