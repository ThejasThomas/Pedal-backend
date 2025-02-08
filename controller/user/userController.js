const express = require("express");
const User = require("../../model/userModel");
const Otp = require("../../model/otpModel"); 
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { generateAccessToken, generateRefreshToken } = require("../../utils/jwt/generateToken");
const { error } = require("console");
const otpStore = new Map();


const fetchUserAccountData = async (req, res) => {
  try {
    const { userId } = req.params;
    // console.log(userId);
    
                     
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const user = await User.findById(userId, '-password -__v');

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user account data:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};


const signup = async (req, res) => {
  try {
    const { firstName, lastName, password, confirmPassword, email, phone } = req.body;

    if (!firstName || !lastName || !password || !confirmPassword || !email || !phone) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = crypto.randomInt(100000, 999999).toString();
    console.log("Generated OTP:", otp);

    await Otp.create({
      email,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      data: { firstName, lastName, phone, email, password: hashedPassword }, 
    });
    require('dotenv').config();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });

    return res.status(200).json({ success: true, message: "OTP sent successfully." });
  } catch (error) {
    console.error("Error during signup:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
const updateUserData=async(req,res)=>{
  try{
    const { userId } =req.params;
    console.log('id',userId);
    
    const updateData=req.body;
    if(!userId){
      return res.status(400).json({ message:'User ID is required'})
    }
    const existingData =await User.findById(userId);
    if(!existingData){
      return res.status(404).json({ message: 'User not found'});
    }
    const UpdatedObject= {
      firstName:updateData.firstName ||  existingData.firstName,
      lastName:updateData.lastName || existingData.lastName,
      email:updateData.email || existingData.email,
      phone:updateData.phone || existingData.phone,

    }
    const updatedUserData=await User.findByIdAndUpdate(
      userId,
      UpdatedObject,
       {new:true , runValidators:true }
    )
    if(!updateUserData){
      return res.status(500).json({message:'Failed to updateUser details'})
    }
    res.status(200).json({
      success: true,
      message:'UserData updated successfully',
      user:updatedUserData
    })
  }
  catch{
    console.error('Error updating product',error);
    res.status(500).json({message:'Error updating Userdata',error:error.message})
    
  }
}

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("Verifying OTP for email:", email);

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord || otpRecord.otp !== otp || otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const userData = otpRecord.data;
    // console.log("User data from OTP record:", userData);

    if (!userData) {
      return res.status(400).json({ message: "User data is missing or invalid." });
    }

    const user = await User.create(userData);
    // console.log('Created user:', user);

    await Otp.deleteMany({ email });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. Registration complete.",
      user,
    });
  } catch (error) {
    console.error("Error during OTP verification:", error);
    return res.status(500).json({ message: "Failed to verify OTP." });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const existingOtpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });
    if (!existingOtpRecord || !existingOtpRecord.data) {
      return res.status(400).json({ message: "No pending registration found for this email." });
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    await Otp.create({
      email,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      data: existingOtpRecord.data
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });

    return res.status(200).json({ success: true, message: "OTP resent successfully." });
  } catch (error) {
    console.error("Error during OTP resending:", error);
    return res.status(500).json({ message: "Failed to resend OTP." });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }
    
      // console.log(message);
      
    const userData = await User.findOne({ email: email });
    if (!userData) {
      console.log('User not found',email);
      
      return res.status(404).json({
        success: false,
        message: "Email is not registered, Please Signup",
      });
    }
    if (userData.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not access to login",
      });
    }

    


    
    if (userData.isBlocked) {
      return res.status(403).json({ message: 'Account is blocked. Please contact support.' });
    }
    if (!password || !userData.password) {
      return res.status(400).json({
        success: false,
        message: "Invalid login request. Password is missing.",
      });
    }

    const matchPass = await bcrypt.compare(password, userData.password);
    if (!matchPass) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (userData.isActive === false) {
      const message = "Your account is currently inactive, and access to the website is restricted.";
      return res.status(403).json({ success: false, message });
    }

    userData.password = undefined;
    const tokenData = {
      userId: userData._id,
      role: "user"
    };

    // Generate tokens with proper data structure
    const accessToken = generateAccessToken(tokenData);
    const refreshToken = generateRefreshToken(tokenData);


    res.cookie("accessToken", accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login Successful, Welcome Back",
      user:userData,
    });

  } catch (err) {
    console.error("Unexpected error during login:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

module.exports = { signup, verifyOtp, resendOtp, login,fetchUserAccountData,updateUserData };