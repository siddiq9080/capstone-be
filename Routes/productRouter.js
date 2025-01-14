import express from "express";
import Company from "../Models/companyModel.js";
import catchAsyncError from "../middleware/catchAsyncError.js";
import CustomErrorHandler from "../utils/customError.js";
import Product from "../Models/productModel.js";
import { authorizeRoles, isAuthenticatedUser } from "../middleware/authenticate.js";

const productServer = express.Router();


// GET all products (ADMIN)
productServer.get(
  "/getAllProducts",
  isAuthenticatedUser,
  catchAsyncError(async (req, res, next) => {
    const products = await Product.find();
    res.status(200).json({ success: true, products });
  })
);

// Get a single product

productServer.get(
  "/product/:id",
  isAuthenticatedUser,
  catchAsyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new CustomErrorHandler("Product not found", 404));
    }

    res.status(200).json({ success: true, product });
  })
);

// ADMIN Route

// GET all products (ADMIN)
productServer.get(
  "/adminGetAllProducts",
    isAuthenticatedUser,
    authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const products = await Product.find();
    res.status(200).json({ success: true, products });
  })
);

// POST - create a new Product (ADMIN)


productServer.post(
  "/admin/new-product",
    isAuthenticatedUser,
    authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const {
      name,
      price,
      description,
      images,
      isAvailable,
      category,
      seller,
      workers,
    } = req.body;

    if (
      !name ||
      !price ||
      !description ||
      !images ||
      !category ||
      !seller ||
      !workers
    ) {
      return next(new CustomErrorHandler("All fields are required", 400));
    }

    const findCompany = await Company.findOne({ category });

    if (!findCompany) {
      return next(
        new CustomErrorHandler(
          "No company found with this matching category",
          404
        )
      );
    }

    const newProduct = new Product({
      name,
      price,
      description,
      images,
      isAvailable,
      category,
      seller,
      workers,
      company: findCompany._id,
    });

    await newProduct.save();

    findCompany.products.push(newProduct._id);
    await findCompany.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully and added to company",
      newProduct,
    });
  })
);


// PUT - Update a Single product (ADMIN)

productServer.put(
  "/admin/product/:id",
    isAuthenticatedUser,
    authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(new CustomErrorHandler("Product not found", 404));
    }

    // Update the product in the Product model
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Find the company that contains the product in its products array
    const company = await Company.findOne({ products: product._id }).populate(
      "products"
    );

    if (!company) {
      console.log("Company not found with product ID:", product._id);
      return next(new CustomErrorHandler("Company not found", 404));
    }

    const productIndex = company.products.findIndex(
      (prod) => prod._id.toString() === product._id.toString()
    );

    if (productIndex !== -1) {
      // Update the product in the company's products array
      company.products[productIndex] = {
        ...company.products[productIndex],
        ...req.body,
        updatedAt: new Date(),
      };

      await company.save();
    } else {
      console.log("Product not found in company products array");
      return next(
        new CustomErrorHandler("Product not found in company products", 404)
      );
    }

    res.status(201).json({ success: true, product });
  })
);

//DELETE - Delete a single product (ADMIN)

productServer.delete(
  "/admin/product/:id",
    isAuthenticatedUser,
    authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new CustomErrorHandler("Product not found", 404));
    }

    await product.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  })
);

// POST - Create a new Review

productServer.post(
  "/create-review",
  isAuthenticatedUser,
  catchAsyncError(async (req, res, next) => {
    const { productId, rating, comment } = req.body;

    const review = {
      user: req.user.id,
      rating,
      comment,
    };

    const product = await Product.findById(productId);
    //finding user review exists
    const isReviewed = product.reviews.find((review) => {
      return review.user.toString() == req.user.id.toString();
    });

    if (isReviewed) {
      //updating the  review
      product.reviews.forEach((review) => {
        if (review.user.toString() == req.user.id.toString()) {
          review.comment = comment;
          review.rating = rating;
        }
      });
    } else {
      //creating the review
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length;
    }
    //find the average of the product reviews
    product.ratings =
      product.reviews.reduce((acc, review) => {
        return review.rating + acc;
      }, 0) / product.reviews.length;
    product.ratings = isNaN(product.ratings) ? 0 : product.ratings;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
    });
  })
);

// GET - Get Reviews

productServer.get(
  "/get-reviews",
  isAuthenticatedUser,
  catchAsyncError(async (req, res, next) => {
    const product = await Product.findById(req.query.id).populate(
      "reviews.user",
      "name email"
    );

    res.status(200).json({
      success: true,
      reviews: product.reviews,
    });
  })
);

// DELETE - Delete a review

productServer.delete(
  "/delete-review",
  isAuthenticatedUser,
  catchAsyncError(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);

    //filtering the reviews which does match the deleting review id
    const reviews = product.reviews.filter((review) => {
      return review._id.toString() !== req.query.id.toString();
    });
    //number of reviews
    const numOfReviews = reviews.length;

    //finding the average with the filtered reviews
    let ratings =
      reviews.reduce((acc, review) => {
        return review.rating + acc;
      }, 0) / reviews.length;
    ratings = isNaN(ratings) ? 0 : ratings;

    //save the product document
    await Product.findByIdAndUpdate(req.query.productId, {
      reviews,
      numOfReviews,
      ratings,
    });
    res.status(200).json({
      success: true,
    });
  })
);

export default productServer;
