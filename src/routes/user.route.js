import express from "express";
import { AuthenticateTokenMiddleware } from "../middleware/auth.middleware.js";
import {
  getUserbyUsername,
  getSearchUser,
  updateUser,
  updatePhotoUser,
} from "../controllers/user.controller.js";
import upload from "../middleware/upload.middleware.js";

const UserRouter = express.Router();
UserRouter.get("/search", getSearchUser);
UserRouter.get("/:username", getUserbyUsername);
UserRouter.put("/update-user", AuthenticateTokenMiddleware, updateUser);
UserRouter.put(
  "/update-photo-user",
  AuthenticateTokenMiddleware,
  upload.single("image"),
  updatePhotoUser
);
export default UserRouter;
