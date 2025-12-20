import * as z from "zod";
import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import { error } from "console";
export const getUserbyUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
      omit: {
        password: true,
        imageId: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Success", data: user });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getSearchUser = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: username,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        image: true,
      },
    });
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Success", data: users });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    // 1. AMBIL ID DARI TOKEN (Middleware)
    // Pastikan di AuthenticateTokenMiddleware kamu menaruh data user di req.user
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: User ID not found." });
    }

    // 2. VALIDASI INPUT
    const userSchema = z.object({
      fullname: z.string().min(3, "Full name must be at least 3 characters long"),
      username: z.string().min(3, "Username must be at least 3 characters long"),
      bio: z.string().max(160, "Bio max 160 chars").optional(),
      currentPassword: z.string().optional(),
      newPassword: z.string().min(6, "New password must be at least 6 characters").optional(),
    });

    const validation = userSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Validation Failed",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { fullname, username, bio, currentPassword, newPassword } = validation.data;

    // 2. LOGIKA VALIDASI PASSWORD (Manual Check)
    // Jika user mengisi newPassword, dia WAJIB mengisi currentPassword juga
    if (newPassword && !currentPassword) {
      return res.status(400).json({
        message: "Validation Failed",
        errors: { currentPassword: ["Current password is required to set a new password"] },
      });
    }
    // 3. AMBIL DATA USER LAMA (Untuk perbandingan)
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 4. LOGIKA GANTI USERNAME (Cek Duplikasi)
    // Cek database HANYA JIKA username yang dikirim beda dengan yang lama
    if (username !== existingUser.username) {
      const usernameTaken = await prisma.user.findUnique({
        where: { username: username },
      });

      // Jika username sudah dipakai orang lain (bukan diri sendiri)
      if (usernameTaken && usernameTaken.id !== userId) {
        return res.status(400).json({
          message: "Username already taken",
          errors: { username: ["This username is already used by another user"] },
        });
      }
    }
    // 5. LOGIKA GANTI PASSWORD (Verifikasi & Hashing)
    let finalPassword = undefined; // Default undefined (artinya tidak diupdate)

    if (newPassword && currentPassword) {
      // Cek apakah password lama benar?
      const isPasswordValid = await bcrypt.compare(currentPassword, existingUser.password);

      if (!isPasswordValid) {
        return res.status(400).json({
          message: "Invalid password",
          errors: { currentPassword: ["Current password is incorrect"] },
        });
      }

      // Hash password baru
      finalPassword = await bcrypt.hash(newPassword, 10);
    }

    // 6. UPDATE KE DATABASE
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullname: fullname,
        username: username,
        bio: bio,
        password: finalPassword,
      },
    });
    const { password, imageId, ...userWithoutSensitiveData } = updatedUser;
    return res.status(200).json({
      message: "Profile updated successfully",
      data: userWithoutSensitiveData,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
