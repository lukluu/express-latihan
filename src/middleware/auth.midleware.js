import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
};
