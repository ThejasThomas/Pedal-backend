const express =require('express')
const Order =require('../../model/orderModel')
const User=require('../../model/userModel')
const ExcelJS =require('exceljs')
const PDFDocument = require('pdfkit');


const getSalesReport = async (req, res) => {
    try {
      const { filterType, startDate, endDate } = req.query;
      console.log('heyy',req.query);
      
      
      let dateFilter = { orderStatus: 'DELIVERED' };
      const currentDate = new Date();
      
      switch (filterType) {
        case 'daily':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dateFilter.createdAt = {
            $gte: today,
            $lte: currentDate
          };
          break;
          
        case 'weekly':
          const weekStart = new Date();
          weekStart.setDate(currentDate.getDate() - 7);
          dateFilter.createdAt = {
            $gte: weekStart,
            $lte: currentDate
          };
          break;
          
        case 'monthly':
          const monthStart = new Date();
          monthStart.setMonth(currentDate.getMonth() - 1);
          dateFilter.createdAt = {
            $gte: monthStart,
            $lte: currentDate
          };
          break;
          
        case 'yearly':
          const yearStart = new Date();
          yearStart.setFullYear(currentDate.getFullYear() - 1);
          dateFilter.createdAt = {
            $gte: yearStart,
            $lte: currentDate
          };
          break;
          
        case 'custom':
          if (startDate && endDate) {
            const customStartDate = new Date(startDate);
            customStartDate.setHours(0, 0, 0, 0);
            const customEndDate = new Date(endDate);
            customEndDate.setHours(23, 59, 59, 999);
            
            dateFilter.createdAt = {
              $gte: customStartDate,
              $lte: customEndDate
            };
          }
          break;
      }
  
      const orders = await Order.find(dateFilter)
        .populate('user', 'firstName email')
        .populate({
          path: 'products.product',
          select: 'name images description price'
        })
        .sort({ createdAt: -1 });
  
      const summary = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        totalProducts: orders.reduce((sum, order) => 
          sum + order.products.reduce((pSum, product) => pSum + product.quantity, 0), 0),
        averageOrderValue: orders.length > 0 ? 
          orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0,
        totalDiscounts: orders.reduce((sum, order) => 
          sum + (order.products.reduce((pSum, product) => 
            pSum + ((product.discountAmount || 0) * product.quantity), 0)), 0)
      };
  
      const paymentMethodStats = orders.reduce((acc, order) => {
        acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + 1;
        return acc;
      }, {});
  
      const timeData = orders.reduce((acc, order) => {
        let timeKey;
        
        switch (filterType) {
          case 'daily':
            timeKey = new Date(order.createdAt).toLocaleString('default', { 
              hour: 'numeric', 
              hour12: true 
            });
            break;
          case 'weekly':
            timeKey = new Date(order.createdAt).toLocaleString('default', { 
              weekday: 'long' 
            });
            break;
          case 'monthly':
            timeKey = new Date(order.createdAt).toLocaleString('default', { 
              day: 'numeric' 
            });
            break;
          case 'yearly':
          case 'custom':
            timeKey = new Date(order.createdAt).toLocaleString('default', { 
              month: 'long' 
            });
            break;
        }
  
        if (!acc[timeKey]) {
          acc[timeKey] = {
            revenue: 0,
            orders: 0,
            products: 0
          };
        }
        
        acc[timeKey].revenue += order.totalAmount;
        acc[timeKey].orders += 1;
        acc[timeKey].products += order.products.reduce((sum, p) => sum + p.quantity, 0);
        
        return acc;
      }, {});
  
      const orderDetails = orders.map(order => ({
        _id: order._id,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        user: order.user,
        products: order.products.map(item => ({
          _id: item._id,
          quantity: item.quantity,
          price: item.price,
          productName: item.productName,
          productImage: item.productImage,
          productDescription: item.productDescription,
          originalPrice: item.originalPrice,
          discountAmount: item.discountAmount,
          discountType: item.discountType
        }))
      }));
  
      return res.status(200).json({
        success: true,
        message: "Sales report generated successfully",
        data: {
          summary,
          paymentMethodStats,
          timeData,
          orderDetails
        }
      });
    } catch (error) {
      console.error("Error generating sales report:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to generate sales report"
      });
    }
  };

  const downloadController = {
    async downloadPdf(req, res) {
      try {
        const { filterType, startDate, endDate } = req.query;
        
        const query = {};
        if (startDate && endDate) {
          query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }
        
        const orders = await Order.find(query)
          .populate('user', 'email name')
          .populate('shippingAddress')
          .sort({ createdAt: -1 });
    
        const doc = new PDFDocument({
          margin: 30,
          size: 'A4'
        });
    
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=SalesReport.pdf');
        doc.pipe(res);
    
        // Define consistent spacing and positioning
        const pageWidth = 535;
        const margins = {
          left: 30,
          right: 30
        };
    
        // Column positions with adjusted widths
        const columns = {
          orderId: { x: margins.left, width: 80 },
          customer: { x: margins.left + 85, width: 120 },
          date: { x: margins.left + 210, width: 80 },
          amount: { x: margins.left + 295, width: 80 },
          discounts: { x: margins.left + 380, width: 80 },
          status: { x: margins.left + 465, width: 70 }
        };
    
        // Header
        doc.font('Helvetica-Bold')
           .fontSize(16)
           .text('Sales Report', margins.left, 30, {
             width: pageWidth,
             align: 'center'
           });
    
        let y = 60;
    
        // Table headers
        doc.font('Helvetica-Bold')
           .fontSize(9);
    
        // Draw header background
        doc.rect(margins.left, y, pageWidth, 15)
           .fill('#f3f4f6');
    
        // Draw header texts
        doc.fillColor('#000000')
           .text('Order ID', columns.orderId.x, y + 3)
           .text('Customer', columns.customer.x, y + 3)
           .text('Date', columns.date.x, y + 3)
           .text('Amount', columns.amount.x, y + 3)
           .text('Discounts', columns.discounts.x, y + 3)
           .text('Status', columns.status.x, y + 3);
    
        y += 20;
    
        let totalSales = 0;
        let totalDiscounts = 0;
    
        // Reduce font sizes and line spacing for content
        doc.font('Helvetica')
           .fontSize(8);
    
        // Table content
        orders.forEach((order, index) => {
          const orderDiscounts = order.products.reduce((sum, product) => {
            return sum + (product.discountAmount || 0) + (product.couponDiscount || 0);
          }, 0);
    
          totalDiscounts += orderDiscounts;
          totalSales += order.totalAmount;
    
          // Order details - main row
          doc.text(order._id.toString().slice(-6), columns.orderId.x, y)
             .text(order.user.email, columns.customer.x, y, { width: columns.customer.width, ellipsis: true })
             .text(order.createdAt.toLocaleDateString(), columns.date.x, y)
             .text(`Rs.${order.totalAmount.toFixed(2)}`, columns.amount.x, y)
             .text(`Rs.${orderDiscounts.toFixed(2)}`, columns.discounts.x, y)
             .text(order.orderStatus, columns.status.x, y);
    
          y += 12;
    
          // Product details with compact layout
          order.products.forEach(product => {
            doc.text(`• ${product.productName} (${product.quantity}x Rs.${product.price})`,
              columns.orderId.x + 5, y, {
                width: pageWidth - 40,
                lineGap: 2
              });
    
            y += 10;
    
            if (product.discountAmount > 0) {
              doc.text(`  Discount: Rs.${product.discountAmount.toFixed(2)})`,
                columns.orderId.x + 10, y);
              y += 8;
            }
    
            if (product.couponDiscount > 0) {
              doc.text(`  Coupon: Rs.${product.couponDiscount.toFixed(2)}`,
                columns.orderId.x + 10, y);
              y += 8;
            }
          });
    
          // Add a thin separator line
          doc.strokeColor('#e5e7eb')
             .moveTo(margins.left, y)
             .lineTo(pageWidth + margins.left, y)
             .stroke();
    
          y += 8;
        });
    
        // Summary section with reduced spacing
        y += 5;
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .text('Summary', margins.left, y);
    
        y += 15;
    
        // Summary details
        doc.fontSize(9);
        const summaryX = pageWidth - 200;
        const valueX = pageWidth - 50;
    
        doc.text('Total Sales (Before Discounts):', summaryX, y)
           .text(`${(totalSales + totalDiscounts).toFixed(2)}`, valueX, y);
    
        y += 12;
        doc.text('Total Discounts Applied:', summaryX, y)
           .text(`Rs.${totalDiscounts.toFixed(2)}`, valueX, y);
    
        y += 12;
        doc.font('Helvetica-Bold')
           .text('Net Sales Amount:', summaryX, y)
           .text(`Rs.${totalSales.toFixed(2)}`, valueX, y);
    
        doc.end();
      } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ message: 'Failed to generate PDF' });
      }
    },
  
    async downloadExcel(req, res) {
      try {
        const { filterType, startDate, endDate } = req.query;
        
        const query = {};
        if (startDate && endDate) {
          query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }
  
        const orders = await Order.find(query)
          .populate('user', 'email name')
          .populate('shippingAddress')
          .sort({ createdAt: -1 });
  
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');
  
        worksheet.columns = [
          { header: 'Order ID', key: 'orderId', width: 15 },
          { header: 'Customer', key: 'customer', width: 25 },
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Products', key: 'products', width: 40 },
          { header: 'Payment Method', key: 'paymentMethod', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Total Amount', key: 'amount', width: 15 }
        ];
  
        orders.forEach(order => {
          const productsList = order.products
            .map(p => `${p.productName} (${p.quantity}x Rs.${p.price})`)
            .join('\n');
  
          worksheet.addRow({
            orderId: order._id.toString().slice(-6),
            customer: order.user.name || order.user.email,
            date: order.createdAt.toLocaleDateString(),
            products: productsList,
            paymentMethod: order.paymentMethod,
            status: order.orderStatus,
            amount: order.totalAmount
          });
        });
  
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
  
        const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        worksheet.addRow([]);
        worksheet.addRow(['Total Sales', '', '', '', '', '', totalSales]);
        const lastRow = worksheet.lastRow;
        lastRow.font = { bold: true };
  
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=SalesReport.xlsx');
  
        // Write to response
        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        console.error('Excel generation error:', error);
        res.status(500).json({ message: 'Failed to generate Excel file' });
      }
    }
  };

  module.exports ={ getSalesReport ,downloadController} 