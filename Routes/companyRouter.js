import express from "express";
import Company from "../Models/companyModel.js";
import catchAsyncError from "../middleware/catchAsyncError.js";
import CustomErrorHandler from "../utils/customError.js";
import mongoose from "mongoose";
import APIFeatures from "../utils/ApiFeatures.js";
import Product from "../Models/productModel.js";
import {
  authorizeRoles,
  isAuthenticatedUser,
} from "../middleware/authenticate.js";

const companyRouter = express.Router();

// search products

//Get Products -
companyRouter.get(
  "/getSearchProducts",
  isAuthenticatedUser,
  catchAsyncError(async (req, res, next) => {
    const resPerPage = 10;

    let buildQuery = () => {
      return new APIFeatures(Product.find(), req.query).search().filter();
    };

    const filteredProductsCount = await buildQuery().query.countDocuments({});
    const totalProductsCount = await Product.countDocuments({});
    let productsCount = totalProductsCount;

    if (filteredProductsCount !== totalProductsCount) {
      productsCount = filteredProductsCount;
    }

    const products = await buildQuery().paginate(resPerPage).query;

    res.status(200).json({
      success: true,
      count: productsCount,
      resPerPage,
      products,
    });
  })
);
// GET - all companies
companyRouter.get(
  "/companies",
  isAuthenticatedUser,
  catchAsyncError(async (req, res, next) => {
    const companies = await Company.find();
    res.status(200).json({ success: true, companies });
  })
);

//GET - Get a single company

companyRouter.get(
  "/company/:id",
  isAuthenticatedUser,
  catchAsyncError(async (req, res, next) => {
    const companyId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return next(new CustomErrorHandler("Invalid company ID format", 400));
    }

    try {
      // Extract query parameters for price and ratings
      const { price, ratings } = req.query;

      // Build query for price filter
      let priceFilter = {};
      if (price) {
        const priceRange = price.split("-");
        if (priceRange.length === 2) {
          const [minPrice, maxPrice] = priceRange;
          priceFilter = {
            price: {
              $gte: minPrice,
              $lte: maxPrice,
            },
          };
        }
      }

      // Build query for ratings filter
      let ratingsFilter = {};
      if (ratings) {
        ratingsFilter = { ratings: ratings };
      }

      // Combine filters for products
      const productFilters = { ...priceFilter, ...ratingsFilter };

      const company = await Company.findById(companyId).populate({
        path: "products",
        select:
          "name price description images isAvailable category seller ratings numOfReviews reviews workers createdAt",
        match: productFilters, // Apply the filter to the populated products
      });

      if (!company) {
        return next(new CustomErrorHandler("Company not found", 404));
      }

      const count = company.products.length;

      res.status(200).json({
        success: true,
        count,
        products: company.products,
      });
    } catch (error) {
      next(error);
    }
  })
);

// GET - Get a specific product by companyId and productId

companyRouter.get(
  "/company/:companyId/product/:productId",
  isAuthenticatedUser,
  catchAsyncError(async (req, res, next) => {
    const { companyId, productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return next(new CustomErrorHandler("Invalid company ID format", 400));
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new CustomErrorHandler("Invalid product ID format", 400));
    }

    const company = await Company.findById(companyId).populate({
      path: "products",
      select:
        "name price description images isAvailable category seller ratings numOfReviews reviews createdAt",
    });

    if (!company) {
      return next(new CustomErrorHandler("Company not found", 404));
    }

    const product = company.products.find(
      (prod) => prod._id.toString() === productId
    );

    if (!product) {
      return next(new CustomErrorHandler("Product not found", 404));
    }

    res.status(200).json({
      success: true,
      product,
    });
  })
);

// ADMIN Routes

// POST - Create a new Company (ADMIN)
companyRouter.post(
  "/admin/new-company",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const companyData = req.body;

    // Check if the company name already exists
    const existingCompanycategory = await Company.findOne({
      category: companyData.category,
    });

    if (existingCompanycategory) {
      return next(
        new CustomErrorHandler("Company category already exists", 400)
      );
    }

    // Create a new company
    const newCompany = new Company({
      ...companyData,
    });

    await newCompany.save();
    res.status(201).json({
      success: true,
      message: "Company created successfully",
      newCompany,
    });
  })
);

// PUT - Update a Single company (ADMIN)
companyRouter.put(
  "/admin/company/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    let company = await Company.findById(req.params.id);

    if (!company) {
      return next(new CustomErrorHandler("Company not found", 404));
    }

    company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(201).json({ success: true, company });
  })
);

// DELETE - Delete a company (ADMIN)
companyRouter.delete(
  "/admin/company/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return next(new CustomErrorHandler("Company not found", 404));
    }

    await company.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "Company deleted successfully" });
  })
);

export default companyRouter;
