import mongoose, { model, Schema } from "mongoose";

const companySchema = new Schema({
  companyName: {
    type: String,
    required: [true, "Please enter Company Name"],
    unique: true,
  },
  image: {
    type: String,
    required: [true, "Please provide the company image URL"],
  },
  category: {
    type: String,
    required: [true, "Please enter product category"],
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
  description: {
    type: String,
    required: [true, "Please enter description"],
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
});

const Company = model("Company", companySchema, "companies");

export default Company;
