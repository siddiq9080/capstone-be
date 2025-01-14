import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const jwtToken = (payload, expiry) => {
  return jwt.sign(payload, process.env.JWT_KEY, { expiresIn: expiry });
};

export default jwtToken;
