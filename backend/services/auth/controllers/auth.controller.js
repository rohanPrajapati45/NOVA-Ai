import auth from "../config/firebase.js";
import User from "../models/user.model.js";

/**
 * POST /google
 * Verify Firebase ID token → find or create user → create session → set cookie.
 */
export const googleSignIn = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "ID token is required" });
    }

    // Verify the Firebase ID token (auth is the Auth instance from firebase-admin/auth)
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email, name, picture: photoURL } = decodedToken;

    // Find existing user or create a new one
    let user = await User.findOne({ uid });

    if (user) {
      // Existing user — update lastLogin
      user.lastLogin = new Date();
      await user.save();
    } else {
      // New user — create document
      user = await User.create({
        uid,
        email,
        name: name || "",
        photoURL: photoURL || "",
        lastLogin: new Date(),
        createdAt: new Date(),
      });
    }

    // Store user info in session (server-side, backed by Redis)
    req.session.userId = user._id.toString();
    req.session.loginAt = Date.now();

    return res.status(200).json({
      message: "Sign-in successful",
      user: {
        _id: user._id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    console.error("Google Sign-In error:", error.message);
    return res.status(401).json({ message: "Authentication failed", error: error.message });
  }
};

/**
 * GET /me
 * Check current session → return user info if valid, else 401.
 */
export const getMe = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findById(req.session.userId).select("-__v");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        _id: user._id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    console.error("getMe error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /logout
 * Destroy session → clear cookie.
 */
export const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err.message);
        return res.status(500).json({ message: "Logout failed" });
      }

      // Clear cookie with same flags used when setting it
      res.clearCookie("connect.sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      return res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};
