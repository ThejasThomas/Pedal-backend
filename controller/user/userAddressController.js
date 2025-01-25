const express =require('express')
const Address =require('../../model/addressModel')


const userAddress=async(req,res)=>{
    try {
        const {userId}=req.params;
        console.log('id::',userId);
        
        const {
            fullName,
            mobile,
            country,
            state,
            city,
            pincode,
            address
        } = req.body;
        console.log(req.body);

        
        
        if (!fullName || !mobile || !country || !state || !city || !pincode || !address){
            return res.status(400).json({ message: "All fields are required." });
        }
         if(!userId){
            return res.status(400).json({message:'Missing user ID'})
        }
        const newAddress = await Address.create({
            user:userId,
            fullName,
            mobile,
            country,
            state,
            city,
            pincode,
            address
        });
        console.log('new address',newAddress);
        
       
        return res.status(201).json({
            success: true,
            message: "Address added successfully",
            data: newAddress,
           
            
        });
    }catch(error){
        console.error("Error creating address:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}

const fetchUserAddress=async(req,res)=>{
    try{
        const {userId} =req.params;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
          }
        console.log('id:',userId)
        const user=await Address.find({user:userId})
        
        if(!user){
            return res.status(404)
            .json({success:false,message:"User not found."})
        }
        return res
     .status(200)
     .json({
      success:true,
      message:"address fetched",
      data:user})
    }catch(err){
        console.log(err);
      }
}
const deleteUserAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        console.log('Backend id',addressId);
        

        // Validate address ID
        if (!addressId) {
            return res.status(400).json({
                success: false,
                message: "Address ID is required."
            });
        }

        // Find and delete the address
        const deletedAddress = await Address.findByIdAndDelete(addressId);

        if (!deletedAddress) {
            return res.status(404).json({
                success: false,
                message: "Address not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Address deleted successfully",
            data: deletedAddress
        });

    } catch (error) {
        console.error("Error in deleteUserAddress:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};



module.exports ={
    userAddress,
    fetchUserAddress,
    deleteUserAddress
}