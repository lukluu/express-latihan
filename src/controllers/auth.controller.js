import * as z from "zod";
import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const RegisterUser = async (req, res) => {
  try {
    // 1. VALIDASI INPUT (Clean & Safe)
    const userSchema = z.object({
      fullname: z.string().min(3, "Full name must be at least 3 characters long"),
      username: z
        .string()
        .min(3, "Username must be at least 3 characters long")
        .refine(
          async (username) => {
            // Zod melakukan query ke database secara diam-diam
            const user = await prisma.user.findUnique({ where: { username } });
            return !user; // Valid jika user TIDAK ditemukan (return true)
          },
          { message: "Username already taken" }
        ), // Pesan error custom

      email: z
        .string()
        .email("Invalid email address")
        .refine(
          async (email) => {
            const user = await prisma.user.findUnique({ where: { email } });
            return !user;
          },
          { message: "Email already registered" }
        ),
      password: z.string().min(6, "Password must be at least 6 characters long"),
    });

    const validation = await userSchema.safeParseAsync(req.body);

    // Jika validasi input gagal
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors, // Format error rapi & konsisten
      });
    }

    const { fullname, username, email, password } = validation.data;

    // 2. CEK DUPLIKASI (Optimasi: 1x Query Database)
    // Cek apakah email ATAU username sudah ada
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { username: username }],
      },
    });

    // Jika ditemukan data kembar
    if (existingUser) {
      // Kita beri tahu user secara spesifik apa yang salah
      if (existingUser.email === email) {
        return res.status(400).json({
          message: "Registration failed",
          errors: { email: ["Email already registered"] },
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({
          message: "Registration failed",
          errors: { username: ["Username already taken"] },
        });
      }
    }

    // 3. HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. SIMPAN USER BARU
    const newUser = await prisma.user.create({
      data: {
        fullname,
        username,
        email,
        password: hashedPassword,
      },
    });

    // 5. GENERATE TOKEN (Auto Login setelah Register)
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET || "default_secret_key", { expiresIn: "1h" });

    // 6. KIRIM RESPONSE
    return res.status(201).json({
      message: "User registered successfully",
      token: token,
      data: {
        id: newUser.id,
        fullname: newUser.fullname,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    // Catch ini HANYA menangkap error server (Db mati, syntax error, dll)
    console.error("Registration error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const LoginUser = async (req, res) => {
  try {
    // 1. VALIDASI INPUT (Zod)
    const loginSchema = z.object({
      email: z.string().email("Invalid email format"),
      password: z.string().min(1, "Password is required"), // Minimal ada isinya
    });

    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { email, password } = validation.data;

    // 2. CARI USER DI DATABASE
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    // 3. LOGIKA VERIFIKASI (User Check & Password Check)
    // Kita buat default gagal dulu
    if (!user) {
      // Return 401 (Unauthorized) bukan 400
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 4. GENERATE TOKEN
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "default_secret_key", { expiresIn: "1h" });

    // 5. KIRIM RESPONSE
    const { password: pass, ...userWithoutPassword } = user;
    return res.status(200).json({
      message: "Login successful",
      token: token,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const MeUser = async (req, res) => {
  try {
    return res.status(200).json({
      message: "Success",
      data: req.user,
    });
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
