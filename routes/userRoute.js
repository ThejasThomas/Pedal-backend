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
const {placeOrderList,getOrderedProductDetails,getUserOrders,cancelOrder, verifyPayment, handleFailedOrder, checkProductAvailability } =require('../controller/user/orderController')
const {forgotPassword, verifyForgotPasswordOtp, resetPassword} =require('../controller/user/forgotPasswordController');
const { addCoupon } = require("../controller/admin/couponController");
const { fetchCouponDetails } = require("../controller/user/couponUserController");
const { addFunds, getTransactionHistory, getWalletDetails } = require("../controller/user/walletController");
userRoute.post("/signup", signup);
userRoute.post("/verifyOtp", verifyOtp);
userRoute.post("/resendOtp", resendOtp);
userRoute.post('/login',login)
userRoute.get('/products',verifyUser,fetchProductsForUser)
userRoute.get('/fetchUserAccountData/:userId',verifyUser,fetchUserAccountData)
userRoute.put('/updateUserData/:userId',verifyUser,updateUserData)
userRoute.post('/useraddress/:userId',verifyUser,userAddress)
userRoute.get('/fetchuseraddress/:userId',verifyUser,fetchUserAddress)
userRoute.delete('/deleteaddress/:addressId',deleteUserAddress)
userRoute.post('/addToCart',verifyUser,addToCart)
userRoute.post('/updatecart',updateCart)
userRoute.get('/validateCart/:userId',validateCart)
userRoute.get('/getcartdetails/:userId',verifyUser,getCartDetails)
userRoute.delete('/removefromcart/:userId/:productId',verifyUser,removeFromCart)
userRoute.post('/placeorder',verifyUser,placeOrderList)
userRoute.post('/clearcart/:userId',verifyUser,clearCart)
userRoute.get('/getorderedproduct/:orderId',verifyUser,getOrderedProductDetails)
userRoute.get('/getUserOrders/:userId',verifyUser,getUserOrders)
userRoute.post('/cancelOrder/:orderId',verifyUser,cancelOrder)
userRoute.post('/forgot-password',forgotPassword)
userRoute.post('/verifyforgotpassword',verifyForgotPasswordOtp)
userRoute.post('/reset-password',resetPassword)
userRoute.post('/apply-coupon',fetchCouponDetails)
userRoute.post('/verifypayment/:id',verifyPayment)
userRoute.post('/handlefailureorder/:id',handleFailedOrder)
userRoute.post('/productavailbale',checkProductAvailability)
userRoute.post('/walletadd',addFunds)
userRoute.get('/wallet/:userId',getWalletDetails)
module.exports = userRoute;

