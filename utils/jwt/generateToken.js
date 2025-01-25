const jwt=require('jsonwebtoken')

const generateAccessToken = (userData) => {
    try {
      // return jwt.sign({ _id: data }, process.env.ACCESS_TOKEN_SECRET, {
      //   expiresIn: "13m",
      // });
      return jwt.sign({ _id: userData.userId , role:userData.role}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "2h",
      });
    } catch (err) {
      console.error("Error generating access token:", err);
      throw new Error("Failed to generate access token");
    }
  };
  
  const generateRefreshToken = (userData) => {
    try {
      return jwt.sign({ _id: userData.userId, role: userData.role }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d'
      });
    } catch (err) {
      console.error("Error generating refresh token:", err);
      throw new Error("Failed to generate refresh token");
    }
  };
  

module.exports = { generateAccessToken, generateRefreshToken };
