const Coupon =require('../../model/couponModel')

const fetchCouponDetails=async (req,res)=>{
        try{
            const {code}=req.body
            console.log('CODE',code);
            
            const couponData=await Coupon.findOne({code})

            if(!couponData){
                return res.status(404)
                .json({success:false,
                       message:"Coupon Not found",
                })
            }
            return res.status(200)
            .json({success:true,message:"couponData fetched successfully",CouponData:couponData})                   
        }catch(err){
            console.log(err)   
        }
}
module.exports={fetchCouponDetails}