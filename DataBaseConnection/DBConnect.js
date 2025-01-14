import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const connectDB = async () => {
  try {
    await mongoose.connect(url);
    console.log("DB Connected succssfully");
  } catch (error) {
    console.log("Error while connecting DB");
    process.exit(1);
  }
};

export default connectDB;
