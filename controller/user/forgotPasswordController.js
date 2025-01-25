const User = require('../../model/userModel');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const Otp =require('../../model/otpModel')
require('dotenv').config();

const otpStore = new Map();

const forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
  
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required.",
        });
      }
  
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Email is not registered.",
        });
      }

      const otpp=  await Otp.find()      
      if(otpp){
        await Otp.deleteMany()
      }


  
      // Generate OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      console.log(otp);
      
      
      // Store OTP with expiry (10 minutes)
await Otp.create({
    email,
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,

})
  
      // Send email with OTP
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP for password reset is ${otp}. It will expire in 10 minutes.`,
      });
  
      return res.status(200).json({
        success: true,
        message: "OTP sent successfully to your email.",
      });
  
    } catch (error) {
      console.error("Error in forgot password:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };
  const verifyForgotPasswordOtp = async (req, res) => {
    try {
      const { email, otp } = req.body;
      console.log('req',req.body);
      
  
      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: "Email and OTP are required."
        });
      }
      
      const otpRecord = await Otp.findOne({
        email,
        // type: 'reset-password'
      })
  
      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: "No OTP found. Please request a new one."
        });
      }
  
    //   if (otpRecord.expiresAt < Date.now()) {
    //     await Otp.deleteOne({ _id: otpRecord._id });
    //     return res.status(400).json({
    //       success: false,
    //       message: "OTP has expired. Please request a new one."
    //     });
    //   }
  
      if (otpRecord.otp !== otp) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP."
        });
      }
  
      // Don't delete the OTP yet as we'll need to verify it again during password reset
      return res.status(200).json({
        success: true,
        message: "OTP verified successfully."
      });
  
    } catch (error) {
      console.error("Error in OTP verification:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to verify OTP."
      });
    }
  };

  const resetPassword=async (req,res)=>{
    try{
        const {newPassword,email}=req.body
        console.log("lllllll",newPassword)
        const user= await User.findOne({email:email})
        user.password = await bcrypt.hash(newPassword, 10);
        user.save()
         return res.status(200).json({
          message:"password resetted successfully"
        })
    }catch(err){
      console.log(err)
    }
  }
  module.exports ={ forgotPassword,verifyForgotPasswordOtp,resetPassword }