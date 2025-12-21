import express from "express";
import { AuthenticateTokenMiddleware } from "../middleware/auth.middleware.js";
import { followUserAccount } from "../controllers/follow.controller.js";
const FollowRouter = express.Router();
FollowRouter.post("/", AuthenticateTokenMiddleware, followUserAccount);

export default FollowRouter;
