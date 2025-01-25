const express = require("express");
const adminRoute = express.Router();
const { adminLogin } = require("../controller/admin/adminController");
const {
  addProduct,
  fetchproducts,
  editProduct,
  toggleProductListing,
  fetchProductDetails,
} = require("../controller/admin/productController");
const {
  addCategory,
  fetchCategory,
  editCategory, 
  toggleCategoryListing,
  fetchCategoryUser,
} = require("../controller/admin/categoryController");
const {
  getUserData,
  handleBlockUser,
  handleUnblockUser,
} = require("../controller/admin/userManagementController");
const { verifyAdmin } = require("../Middleware/userAuth");
const { getAllOrders,updateOrderStatus,getAllUsers,getOrderDetails } =require('../controller/admin/orderController');
const { addCoupon, fetchCoupons, deleteCoupon } = require("../controller/admin/couponController");

adminRoute.post("/login", adminLogin);
adminRoute.post("/addproduct", addProduct);
adminRoute.put("/editproduct/:id", editProduct);
adminRoute.post("/addcategory", addCategory);
adminRoute.get("/product", fetchproducts);
adminRoute.get("/category", fetchCategory);
adminRoute.patch("/toggle-listing/:id", toggleProductListing);
adminRoute.patch("/editCategory/:categoryId", editCategory);
adminRoute.patch("/toggleCategory/:id", toggleCategoryListing);
adminRoute.get("/fetchCategoryUser", fetchCategoryUser);
adminRoute.get("/fetchUserData", getUserData);
adminRoute.put("/handleBlockUser/:userId", handleBlockUser);
adminRoute.put("/unblockUser/:userId", handleUnblockUser);
adminRoute.get("/productDetails/:id", fetchProductDetails);
adminRoute.get('/getAllUsers',getAllUsers)
adminRoute.get('/getAllOrders',getAllOrders)
adminRoute.put("/updateOrderStatus/:orderId/status", updateOrderStatus);
adminRoute.post('/addcoupon',addCoupon)
adminRoute.get('/fetchCoupons',fetchCoupons)
adminRoute.delete('/deleteCoupon',deleteCoupon)
module.exports = adminRoute;
