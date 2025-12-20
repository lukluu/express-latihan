import express from "express";
import { AuthenticateTokenMiddleware } from "../middleware/auth.middleware.js";
import { getUserbyUsername, getSearchUser, updateUser } from "../controllers/user.controller.js";
const UserRouter = express.Router();
UserRouter.get("/search", getSearchUser);
UserRouter.get("/:username", getUserbyUsername);
UserRouter.put("/update-user", AuthenticateTokenMiddleware, updateUser);
export default UserRouter;
