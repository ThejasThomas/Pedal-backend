const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/jwt/generateToken");
const User = require("../../model/userModel.js");
const { OAuth2Client } = require("google-auth-library");

const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    console.log("Processing Google authentication request");

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
        error: "TOKEN_MISSING",
      });
    }

    try {
      const client = new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      });
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const {
        sub: googleId,
        email,
        name,
        picture,
        email_verified,
      } = ticket.getPayload();
      if (!email_verified) {
        return res.status(400).json({
          success: false,
          message: "Email not verified with Google",
          error: "EMAIL_NOT_VERIFIED",
        });
      }

      // Find or create the user
      let user = await User.findOne({
        $or: [{ email }, { googleId }],
      }).exec();

      if (!user) {
        user = await User.create({
          googleId,
          email,
          firstName: name.split(" ")[0],
          lastName: name?.split(" ")[1] || null,
          isActive: true,
          isGoogleUser: true,
          lastLogin: new Date(),
        });
      } else {
        user.googleId = googleId;
        user.isGoogleUser = true;
        user.lastLogin = new Date();
        if (!user.avatar) user.avatar = picture;
        await user.save();
      }

      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      const cookieOptions = {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      };

      res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isGoogleUser: true,
        },
        accessToken,
        message: "Google authentication successful",
      });
    } catch (verificationError) {
      console.error("Token verification error:", verificationError);

      // Handle specific token timing errors
      if (verificationError.message?.includes("Token used too late")) {
        return res.status(401).json({
          success: false,
          message: "Login session expired. Please sign in again.",
          error: "TOKEN_TIMING_ERROR",
        });
      }

      // Handle other errors related to token verification
      return res.status(401).json({
        success: false,
        message:
          "Invalid token or session expired. Please try signing in again.",
        error: "TOKEN_VERIFICATION_FAILED",
      });
    }
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed. Please try again later.",
      error: "AUTH_FAILED",
    });
  }
};

module.exports = {
  googleAuth,
};
