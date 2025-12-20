import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export const AuthenticateTokenMiddleware = async (req, res, next) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  try {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ message: "Unauthorized, token not found" });
    }
    const token = header.split("Bearer ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });
    req.user = {
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      image: user.image,
      bio: user.bio,
    };
    next();
  } catch (error) {
    res.status(401).json({ message: "Something went wrong" });
  }
};
