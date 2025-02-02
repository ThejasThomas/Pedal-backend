const Coupon =require('../../model/couponModel')

const addCoupon=async (req,res)=>{
    try{
        const {coupon} =req.body
        const{
            code,
            description,
            discount_value,
            min_purchase_amount,
            max_discount_amount,
            expiration_date,
            usage_limit,
           }=coupon

           const isExit=await Coupon.findOne({code})
           if(isExit){
            return res.status(409).json({message:"Coupon already exist"})
           }
           const data = new Coupon({
            code,
            description,
            discountValue:discount_value,
            minPurchaseAmount:min_purchase_amount,
            maxDiscountAmount: max_discount_amount,
            expirationDate: expiration_date,
            // usageLimit:usage_limit,
           })
           await data.save()

           if(data){
            return res.status(201).json({message:"Coupon added successfully"})
           }
           return res.status(400).json({message:"Failed to add coupon"})

        }catch(err){
            console.log("Eror",err);
            return res.status(500).json({ success: false, message: "Server error" });
         }
        }

    const fetchCoupons= async (req,res)=>{
        try{
            const coupons=await Coupon.find({})
            if (!coupons ) {
                return res.status(404).json({ message: "No coupons found" });
            }
            return res.status(200).json({message:"Coupons fetched successfully",Coupons:coupons})
        }catch(err){
            console.log('Error',err);
            return res.status(500).json({ message: "Internal server error" });

        }
    }

    const deleteCoupon =async (req,res)=>{
        try{
            const {_id} =req.query
            console.log(_id);
            const deleted =await Coupon.findByIdAndDelete(_id)

            if(deleted){
                return res.status(200).json({message:"Coupon deleted successfully"})
            }
            return res.status(404).json({message:"Coupon not found"})
            
        }catch(err){
            console.log('Error',err);
            return res.status(500).json({success:false,message:"internal server error"})
            
        }
    }


        module.exports={addCoupon,fetchCoupons,deleteCoupon}