const User = require('../../model/userModel');
const Order = require('../../model/orderModel');
const Product = require('../../model/productModel');
const Category = require('../../model/categoryModel');

async function fetchDashBoardData(req, res) {
    try {
        const { timeFilter } = req.query;
        
        if (!['week', 'month', 'year'].includes(timeFilter)) {
            return res.status(400).json({ success: false, message: 'Invalid time filter' });
        }

        const currentDate = new Date();
        const startDate = new Date();

        switch (timeFilter) {
            case "week": 
                startDate.setDate(currentDate.getDate() - 7); 
                startDate.setHours(0, 0, 0, 0);  // Reset to start of day
                break;
            case "month": 
                startDate.setMonth(currentDate.getMonth() - 1);
                startDate.setHours(0, 0, 0, 0);  // Reset to start of day
                break;
            case "year": 
                startDate.setFullYear(currentDate.getFullYear() - 1);
                startDate.setHours(0, 0, 0, 0);  // Reset to start of day
                break;
        }

        // Total Users and Registration
        const TotalCustomers=await User.countDocuments();
 
        console.log('Date range:', {
          startDate,
          currentDate,
          timeFilter
      });
      

        // Categories Aggregation
        const categoriesAggregation = await Category.aggregate([
            { $group: {
                _id: null,
                totalCategories: { $sum: 1 },
                activeCategories: { $sum: { $cond: ["$isActive", 1, 0] } }
            }}
        ]);

        // Sales Chart Data
        const salesChartData = await Order.aggregate([
            { $match: { 
                createdAt: { $gte: startDate, $lte: currentDate },
                orderStatus: "DELIVERED" 
            }},
            { $group: {
                _id: { 
                    $dateToString: { 
                        format: "%Y-%m-%d", 
                        date: "$createdAt" 
                    }
                },
                totalSales: { $sum: "$totalAmount" },
                orderCount: { $sum: 1 }
            }},
            { $project: {
                name: "$_id",
                sales: "$totalSales",
                count: "$orderCount"
            }},
            { $sort: { name: 1 } }
        ]);
      console.log('saless', salesChartData);
      const orders = await Order.find({ 
        createdAt: { $gte: startDate, $lte: currentDate },
        orderStatus: "DELIVERED"
    });
    console.log('Matching orders:', orders.length);
        

        // Total Sales Aggregation
        const totalSalesAggregation = await Order.aggregate([
            { $match: { orderStatus: "DELIVERED" } },
            { $group: {
                _id: null,
                totalSales: { $sum: "$totalAmount" },
                totalOrders: { $sum: 1 },
                averageOrderValue: { $avg: "$totalAmount" }
            }}
        ]);

        const bestProducts = await Order.aggregate([
          { $unwind: "$products" },
          { $match: { orderStatus: "DELIVERED" } },
          { $lookup: {
              from: "products",
              localField: "products.product",
              foreignField: "_id",
              as: "productDetails"
          }},
          { $unwind: "$productDetails" },
          { $group: {
              _id: "$productDetails._id",
              name: { $first: "$productDetails.name" },
              sales: { $sum: "$products.quantity" },
              revenue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } }
          }},
          { $sort: { sales: -1 } },
          { $limit: 10 }
      ]);
      

        // Best Selling Categories with Details
        const bestCategories = await Order.aggregate([
          { $unwind: "$products" },
          { $match: { orderStatus: "DELIVERED" } },
          { $lookup: {
              from: "products",
              localField: "products.product",
              foreignField: "_id",
              as: "productDetails"
          }},
          { $unwind: "$productDetails" },
          { $lookup: {
              from: "categories",
              localField: "productDetails.category",
              foreignField: "_id",
              as: "categoryDetails"
          }},
          { $unwind: "$categoryDetails" },
          { $group: {
              _id: "$categoryDetails._id",
              name: { $first: "$categoryDetails.name" },
              totalQuantitySold: { $sum: "$products.quantity" },
              totalRevenue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } }
          }},
          { $sort: { totalQuantitySold: -1 } },
          { $limit: 10 }
      ]);

        res.status(200).json({
            success: true,
            message: "Dashboard Data",
            totalCustomers: TotalCustomers,
            // newCustomers: customerAggregation[0]?.newCustomers || 0,
            totalCategories: categoriesAggregation[0]?.totalCategories || 0,
            activeCategories: categoriesAggregation[0]?.activeCategories || 0,
            totalProducts: await Product.countDocuments(),
            totalSales: totalSalesAggregation[0]?.totalSales || 0,
            totalOrders: totalSalesAggregation[0]?.totalOrders || 0,
            averageOrderValue: totalSalesAggregation[0]?.averageOrderValue || 0,
            salesChart: salesChartData,
            bestCategories,
            bestProducts,
            // activeCustomers: customerAggregation[0]?.activeCustomers || 0,

        });
    } catch (err) {
        console.error("Dashboard Data Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data",
            error: err.message,
        });
    }
}

module.exports = { fetchDashBoardData };