import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./DataBaseConnection/DBConnect.js";
import serverError from "./middleware/serverError.js";
import productServer from "./Routes/productRouter.js";
import companyRouter from "./Routes/companyRouter.js";
import userRouter from "./Routes/userRouter.js";
import orderRouter from "./Routes/orderRouter.js";
import paymentRouter from "./Routes/paymentRouter.js";

dotenv.config();
const server = express();

server.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

server.use(express.json());
server.use(cookieParser());

// DB Connection
await connectDB();

// Routes
server.use("/", productServer);
server.use("/", companyRouter);
server.use("/", userRouter);
server.use("/", orderRouter);
server.use("/", paymentRouter);

server.use((req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (token) {
    req.token = token;
  }
  next();
});
// Error Handling
server.use(serverError);

// Start the server
server.listen(process.env.PORT || 5100, () => {
  console.log(
    `Server listening on Port ${process.env.PORT} in ${process.env.NODE_ENV} mode`
  );
});
