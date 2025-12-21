export const followUserAccount = async (req, res) => {
  try {
    const { username } = req.params;
    const followerId = req.user.id;
    const userToFollow = await prisma.user.findUnique({
      where: { username: username },
    });
    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }
    if (userToFollow.id === followerId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: userToFollow.id,
        },
      },
    });
    if (existingFollow) {
      return res
        .status(400)
        .json({ message: "You are already following this user" });
    }
    await prisma.follow.create({
      data: {
        followerId: followerId,
        followingId: userToFollow.id,
      },
    });
    return res.status(200).json({ message: "Successfully followed the user" });
  } catch (error) {
    console.error("Follow user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
