import express from "express";
import { LoginUser, MeUser, RegisterUser } from "../controllers/auth.controller.js";
import { AuthenticateTokenMiddleware } from "../middleware/auth.middleware.js";
const AuthRouter = express.Router();

AuthRouter.post("/register", RegisterUser);
AuthRouter.post("/login", LoginUser);
AuthRouter.get("/me", AuthenticateTokenMiddleware, MeUser);

export default AuthRouter;
