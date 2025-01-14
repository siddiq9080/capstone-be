import mongoose, { model, Schema } from "mongoose";

const productSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please enter product name"],
    maxLength: [100, "Product name cannot exceed 100 characters"],
  },
  price: {
    type: Number,
    required: true,
    default: 0.0,
  },
  ratings: {
    type: String,
    default: "0",
  },
  description: {
    type: String,
    required: [true, "Please enter product description"],
  },
  images: [
    {
      image: {
        type: String,
        required: true,
      },
    },
  ],
  category: {
    type: String,
    required: [true, "Please select product category"],
    enum: {
      values: [
        "Home Cleaning",
        "Office Cleaning",
        "Carpet Cleaning",
        "Toilet Cleaning",
        "Car Wash",
        "Yard Cleaning",
        "Deep Cleaning",
        "Post-construction Cleaning",
        "Laundry Services",
        "Window Cleaning",
        "Sanitization Services",
      ],
      message: "Please select a correct cleaning service category",
    },
  },
  seller: {
    type: String,
    required: [true, "Please enter product seller"],
  },
  isAvailable: {
    type: Boolean,
    required: true,
  },
  numOfReviews: {
    type: Number,
    required: true,
    default: 0,
  },
  workers: {
    type: Number,
    required: [true, "Please enter workers limit"],
    default: 3,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      rating: {
        type: String,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const Product = model("Product", productSchema, "products");

export default Product;
