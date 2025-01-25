const express = require("express");
const User = require("../../model/userModel");
const bcrypt = require('bcrypt');
const {generateAccessToken,generateRefreshToken} =require('../../utils/jwt/generateToken')
const jwt = require('jsonwebtoken');
require("dotenv").config();


const securePassword = async (password) => {
    try {
        return await bcrypt.hash(password, 10);
    } catch (error) {
        console.log(error);
        throw new Error('Password hashing failed');
    }
};

const adminLogin = async (req, res) => {
    try {
        if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
            throw new Error('JWT admin secret is not configured');
        }

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }
        const adminInfo = await User.findOne({ email });

          if (!adminInfo) {
            return res.status(404).json({
                success: false,
                message: "Email is not registered",
            });
        }

        if (adminInfo?.isAdmin) {
            const isPasswordValid = await bcrypt.compare(password, adminInfo.password);
            
            if (isPasswordValid) {
                const token = jwt.sign(
                    { id: adminInfo._id },
                    process.env.ACCESS_TOKEN_SECRET, 
                    { expiresIn: "30d" }
                );
                adminInfo.password = undefined;
                const accessToken = generateAccessToken(adminInfo._id);
                const refreshToken = generateRefreshToken(adminInfo._id);

                res.cookie("adminAccessToken", accessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "Strict",
                    maxAge: 15 * 60 * 1000,
                });
                res.cookie("adminRefreshToken", refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "Strict",
                    maxAge: 7 * 24 * 60 * 60 * 1000, 
                });

                return res.status(200).json({
                    success:true,
                    message: "Login successful",
                    admin:adminInfo,
                });
            } else {
                return res.status(401).json({ message: "Invalid password" });
            }
        } else {
            return res.status(401).json({ message: "No admin access" });
        }
    } catch (err) {
        console.error("Unexpected error during admin login:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error. Please try again later.",
        });
    }
};

module.exports = {
    adminLogin,
};