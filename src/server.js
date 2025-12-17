// src/server.js
import express from "express";
import dotenv from "dotenv";
import AuthRouter from "./routes/auth.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use("/api/auth", AuthRouter);

app.get("/", (req, res) => {
  res.send("Server Prisma Express Berjalan!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
