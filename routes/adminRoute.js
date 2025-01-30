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
const { getAllOrders,updateOrderStatus,getAllUsers,getOrderDetails,} =require('../controller/admin/orderController');
const { addCoupon, fetchCoupons, deleteCoupon } = require("../controller/admin/couponController");
const { addProductOffer, getOffer, createCategoryOffer, getAllCategoryOffers, removeCategoryOffer, getProductOffers, removeProductOffer } = require("../controller/admin/offerController");
const { getSalesReport, downloadController } = require("../controller/admin/salesReportController");

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
adminRoute.post('/addProductOffer',addProductOffer)
adminRoute.get('/fetchProdOffer',getOffer)
adminRoute.post('/addCategoryOffer',createCategoryOffer)
adminRoute.get('/getAllCategoryOffers',getAllCategoryOffers)
adminRoute.delete('/deleteCategoryOffer/:offerId',removeCategoryOffer)
adminRoute.get('/getproductoffers',getProductOffers)
adminRoute.delete('/deleteProductOffers/:offerId',removeProductOffer)
adminRoute.get('/fetchsalesreport',getSalesReport)
adminRoute.get('/sales/download/pdf',downloadController.downloadPdf)
adminRoute.get('/sales/download/excel',downloadController.downloadExcel)
module.exports = adminRoute;
