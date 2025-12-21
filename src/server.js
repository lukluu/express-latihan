// src/server.js
import express from "express";
import dotenv from "dotenv";
import AuthRouter from "./routes/auth.route.js";
import UserRouter from "./routes/user.route.js";
import FollowRouter from "./routes/follow.route.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

// Routes
app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);
app.use("/api/follow", FollowRouter);

app.get("/", (req, res) => {
  res.send("Server Prisma Express Berjalan!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
