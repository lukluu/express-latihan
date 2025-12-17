import * as z from "zod";
import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
export const RegisterUser = async (req, res) => {
  try {
    // validation logic here
    const userSchema = z.object({
      username: z
        .string()
        .min(3, "Username must be at least 3 characters long"),
      password: z
        .string()
        .min(6, "Password must be at least 6 characters long"),
      fullname: z
        .string()
        .min(3, "Full name must be at least 3 characters long"),
      email: z.string().email("Invalid email address"),
    });

    const validatedData = userSchema.parse(req.body);

    // cek email dan username sudah terdaftar atau belum
    const emailExists = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    if (emailExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const usernameExists = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    // simpan user ke database
    const newUser = await prisma.user.create({
      data: {
        username: validatedData.username,
        password: hashedPassword,
        fullname: validatedData.fullname,
        email: validatedData.email,
      },
    });
    const token = jwt.sign(
      {
        id: newUser.id,
      },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: "1h" }
    );
    return res.status(201).json({
      message: "User registered successfully",
      token: token,
      data: {
        id: newUser.id,
        username: newUser.username,
        fullname: newUser.fullname,
        email: newUser.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }
    console.error("Registration error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const LoginUser = async (req, res) => {
  try {
    // validation email dan password
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const emailExists = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!emailExists) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // bandingkan password dengan yang di database
    const passwordMatch = await bcrypt.compare(password, emailExists.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // jika berhasil, buatkan token jwt dan kirim ke client
    const jwtSecret = process.env.JWT_SECRET || "default_secret_key";
    const token = jwt.sign(
      {
        id: emailExists.id,
      },
      jwtSecret,
      { expiresIn: "1h" }
    );
    return res.status(200).json({
      message: "Login successful",
      token: token,
      data: {
        id: emailExists.id,
        username: emailExists.username,
        fullname: emailExists.fullname,
        email: emailExists.email,
        image: emailExists.image,
        bio: emailExists.bio,
      },
    });
    // res.send("Login user");
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
