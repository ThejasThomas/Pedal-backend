const express=require('express')
const User =require('../../model/userModel')
const bcrypt =require('bcrypt')
const jwt =require('jsonwebtoken')
require('dotenv').config();
const getUserData = async(req, res) => {
    try {
      const {page=1,limit =10} =req.query;
      const skip =(page -1)*limit;

      const users = await User.find({ isAdmin: false })
      .skip(skip)
      .limit(Number(limit));

      const totalUsers = await User.countDocuments({ isAdmin: false });


      res.json({users,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  };
  const handleBlockUser=async(req,res)=>{
        try{
            const {userId} =req.params;
            console.log(userId);
            
            await User.findByIdAndUpdate(userId,
              {isBlocked:true},
              { new: true }
            )
            if (!userId) {
              return res.status(404).json({ message: 'User not found' });
            }
            res.json({message:'User Blocked successfully'})
        }catch(err){
            console.error(err);
            res.status(500).json({message:'Failed to block user'})
        }
  }
  const handleUnblockUser=async(req,res)=>{
try{
  const{userId} = req.params;
  await User.findByIdAndUpdate(userId,
    {isBlocked:false},
    { new: true }
  )
  if (!userId) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({message:'User unblocked successfully'})
}catch(err){
  console.error(err);
  res.status(500).json({message:'Failed to unblock user'})
  
}
  }

module.exports ={
    getUserData,
    handleBlockUser,
    handleUnblockUser
}