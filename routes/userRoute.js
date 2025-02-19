const express = require("express");
const userRoute = express.Router();
const {fetchProductsForUser} =require('../controller/user/productHomeController')
const {
  signup,
  verifyOtp,
  resendOtp,
  login,
  fetchUserAccountData,updateUserData
} = require("../controller/user/userController");
const {userAddress,fetchUserAddress,deleteUserAddress } =require('../controller/user/userAddressController')
const { fetchproducts } = require("../controller/admin/productController");
const  verifyUser  = require("../Middleware/userAuth");
const {addToCart,updateCart,validateCart,clearCart,getCartDetails,removeFromCart} =require('../controller/user/cartController')
const {placeOrderList,getOrderedProductDetails,getUserOrders,cancelOrder, verifyPayment, handleFailedOrder, checkProductAvailability, returnReqest, retryPayment } =require('../controller/user/orderController')
const {forgotPassword, verifyForgotPasswordOtp, resetPassword} =require('../controller/user/forgotPasswordController');
const { addCoupon } = require("../controller/admin/couponController");
const { fetchCouponDetails } = require("../controller/user/couponUserController");
const { addFunds, getTransactionHistory, getWalletDetails, getWalletBalance, processWalletPayment } = require("../controller/user/walletController");
const { addToWishlist, getWishlist, removeFromWishlist } = require("../controller/user/wishlistController");
userRoute.post("/signup", signup);
userRoute.post("/verifyOtp", verifyOtp);
userRoute.post("/resendOtp", resendOtp);
userRoute.post('/login',login)
userRoute.get('/products',fetchProductsForUser)
userRoute.get('/fetchUserAccountData/:userId',fetchUserAccountData)
userRoute.put('/updateUserData/:userId',updateUserData)
userRoute.post('/useraddress/:userId',userAddress)
userRoute.get('/fetchuseraddress/:userId',fetchUserAddress)
userRoute.delete('/deleteaddress/:addressId',deleteUserAddress)
userRoute.post('/addToCart',addToCart)
userRoute.post('/updatecart',updateCart)
userRoute.get('/validateCart/:userId',validateCart)
userRoute.get('/getcartdetails/:userId',getCartDetails)
userRoute.delete('/removefromcart/:userId/:productId',removeFromCart)
userRoute.post('/placeorder',placeOrderList)
userRoute.post('/clearcart/:userId',clearCart)
userRoute.get('/getorderedproduct/:orderId',getOrderedProductDetails)
userRoute.get('/getUserOrders/:userId',getUserOrders)
userRoute.post('/cancelOrder/:orderId',cancelOrder)
userRoute.post('/forgot-password',forgotPassword)
userRoute.post('/verifyforgotpassword',verifyForgotPasswordOtp)
userRoute.post('/reset-password',resetPassword)
userRoute.post('/apply-coupon',fetchCouponDetails)
userRoute.post('/verifypayment/:id',verifyPayment)
userRoute.post('/handlefailureorder/:id',handleFailedOrder)
userRoute.post('/productavailbale',checkProductAvailability)
userRoute.post('/walletadd',addFunds)
userRoute.get('/wallet/:userId',getWalletDetails)
userRoute.post('/addToWishlist',addToWishlist)
userRoute.get('/getwishlistproducts',getWishlist)
userRoute.post('/wishlistremoveproducts',removeFromWishlist)
userRoute.post('/requestReturn',returnReqest)
userRoute.post('/retrypayment',retryPayment)
userRoute.get('/walletbalance/:userId',getWalletBalance)
userRoute.post('/walletpayment',processWalletPayment)
module.exports = userRoute;

