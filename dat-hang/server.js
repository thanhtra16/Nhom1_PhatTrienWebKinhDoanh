/******************************************************************
 * KHỞI TẠO SERVER & CẤU HÌNH CẦN THIẾT
 * (Chèn đoạn này vào TRÊN CÙNG của file server.js)
 ******************************************************************/
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express(); // TẠO BIẾN APP Ở ĐÂY ĐỂ ĐÁP ỨNG DÒNG SỐ 5

// Đọc dữ liệu dạng JSON từ client gửi lên (Cực kỳ quan trọng để req.body hoạt động)
app.use(express.json());
app.use(cors());

/******************************************************************
 * IMPORT CÁC MODELS (MONGODB)
 * Nhóm bạn cần đảm bảo các đường dẫn file Model này là chính xác
 ******************************************************************/
const Voucher = require("./models/Voucher");   // Thay bằng đường dẫn thực tế file Voucher model của bạn
const TimeSlot = require("./models/TimeSlot"); // Thay bằng đường dẫn thực tế file TimeSlot model của bạn
const Product = require("./models/Product");   // Thay bằng đường dẫn thực tế file Product model của bạn

/******************************************************************
 * KẾT NỐI DATABASE MONGODB
 * (Thay đoạn URL bên dưới bằng database thực tế của nhóm bạn)
 ******************************************************************/
mongoose.connect("mongodb://localhost:27017/Ten_Database_Cua_Ban")
    .then(() => console.log("Kết nối MongoDB thành công!"))
    .catch(err => console.error("Lỗi kết nối MongoDB:", err));



/******************************************************************
 * API
 * CHECK VOUCHER
 ******************************************************************/
app.post("/api/voucher", async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        if (!code) {
            return res.json({
                success: false,
                message: "Vui lòng nhập mã giảm giá."
            });
        }
        const voucher = await Voucher.findOne({
            code: code.trim().toUpperCase(),
            active: true
        });
        if (!voucher) {
            return res.json({
                success: false,
                message: "Mã giảm giá không tồn tại."
            });
        }
        if (voucher.expired < new Date()) {
            return res.json({
                success: false,
                message: "Mã giảm giá đã hết hạn."
            });
        }
        let discount = 0;
        if (voucher.type === "percent") {
            discount = subtotal * voucher.value / 100;
        } else {
            discount = voucher.value;
        }
        if (discount > subtotal) {
            discount = subtotal;
        }
        res.json({
            success: true,
            code: voucher.code,
            type: voucher.type,
            value: voucher.value,
            discount
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});
/******************************************************************
 * API
 * CHECK TIME SLOT
 ******************************************************************/
app.post("/api/check-slot", async (req, res) => {
    try {
        const { date, slot } = req.body;
        if (!date || !slot) {
            return res.status(400).json({
                success: false,
                message: "Thiếu ngày hoặc khung giờ."
            });
        }
        let timeSlot = await TimeSlot.findOne({
            date,
            slot
        });
        /*
            Nếu ngày đó chưa tồn tại
            => tạo mới
            mặc định mỗi ca nhận tối đa 20 đơn
        */
        if (!timeSlot) {
            timeSlot = new TimeSlot({
                date,
                slot,
                current: 0,
                max: 20
            });
            await timeSlot.save();
        }
        if (timeSlot.current >= timeSlot.max) {
            return res.json({
                success: false,
                message: "Khung giờ đã đầy.",
                available: false
            });
        }
        res.json({
            success: true,
            available: true,
            remain: timeSlot.max - timeSlot.current
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});
/******************************************************************
 * API
 * CREATE ORDER (PART 1)
 ******************************************************************/
/******************************************************************
 * API
 * CREATE ORDER
 ******************************************************************/
app.post("/api/orders", async (req, res) => {
    try {
        const {
            customer,
            deliveryType,
            address,
            receiveDate,
            receiveSlot,
            items,
            voucher,
            paymentMethod
        } = req.body;

        /**********************************************************
         * VALIDATE
         **********************************************************/
        if (!customer || !customer.name || !customer.phone || !customer.email) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin khách hàng."
            });
        }
        if (!receiveDate || !receiveSlot) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn ngày và khung giờ nhận."
            });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Giỏ hàng đang trống."
            });
        }
        if (deliveryType === "delivery" && (!address || !address.district || !address.ward || !address.detail)) {
            return res.status(400).json({
                success: false,
                message: "Thiếu địa chỉ giao hàng."
            });
        }

        /**********************************************************
         * CHECK SLOT
         **********************************************************/
        const slot = await TimeSlot.findOne({
            date: receiveDate,
            slot: receiveSlot
        });
        if (slot && slot.current >= slot.max) {
            return res.json({
                success: false,
                message: "Khung giờ đã đầy."
            });
        }

        /**********************************************************
         * CHECK STOCK
         **********************************************************/
        let subtotal = 0;
        const orderItems = [];
        for (const item of items) {
            const product = await Product.findOne({ id: item.productId });
            if (!product) {
                return res.json({
                    success: false,
                    message: `Không tìm thấy sản phẩm ${item.productId}`
                });
            }
            if (product.stock < item.quantity) {
                return res.json({
                    success: false,
                    message: `${product.name} chỉ còn ${product.stock} sản phẩm.`
                });
            }
            subtotal += product.price * item.quantity;
            orderItems.push({
                productId: product.id,
                name: product.name,
                quantity: item.quantity,
                price: product.price
            });
        }

        /**********************************************************
         * SHIPPING
         **********************************************************/
        let shippingFee = 0;
        if (deliveryType === "delivery") {
            shippingFee = 30000;
        }

        /**********************************************************
         * VOUCHER
         **********************************************************/
        let discount = 0;
        let voucherCode = "";
        if (voucher) {
            const voucherData = await Voucher.findOne({
                code: voucher.toUpperCase(),
                active: true
            });
            if (!voucherData) {
                return res.json({
                    success: false,
                    message: "Voucher không hợp lệ."
                });
            }
            if (voucherData.expired < new Date()) {
                return res.json({
                    success: false,
                    message: "Voucher đã hết hạn."
                });
            }
            voucherCode = voucherData.code;
            if (voucherData.type === "percent") {
                discount = (subtotal * voucherData.value) / 100;
            } else {
                discount = voucherData.value;
            }
            if (discount > subtotal) {
                discount = subtotal;
            }
        }

        /**********************************************************
         * TOTAL
         **********************************************************/
        const total = subtotal + shippingFee - discount;

        const orderData = {
            customer,
            deliveryType,
            address,
            receiveDate,
            receiveSlot,
            items: orderItems,
            voucher: voucherCode,
            shippingFee,
            discount,
            total,
            paymentMethod
        };

        /**********************************************************
         * START TRANSACTION
         **********************************************************/
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            /******************************************************
             * Sinh mã đơn hàng
             ******************************************************/
            const orderId = await generateOrderId();

            /******************************************************
             * Trừ tồn kho
             ******************************************************/
            for (const item of orderItems) {
                const product = await Product.findOne({ id: item.productId }).session(session);

                if (!product) {
                    throw new Error(`Không tìm thấy sản phẩm ${item.productId}`);
                }
                if (product.stock < item.quantity) {
                    throw new Error(`${product.name} chỉ còn ${product.stock} sản phẩm.`);
                }

                product.stock -= item.quantity;
                await product.save({ session });
            }

            /******************************************************
             * Update Time Slot (Đã sửa lỗi logic lặp khối IF)
             ******************************************************/
            let slotData = await TimeSlot.findOne({
                date: receiveDate,
                slot: receiveSlot
            }).session(session);

            if (!slotData) {
                slotData = new TimeSlot({
                    date: receiveDate,
                    slot: receiveSlot,
                    current: 1,
                    max: 20
                });
                await slotData.save({ session });
            } else {
                if (slotData.current >= slotData.max) {
                    throw new Error("Khung giờ đã đầy.");
                }
                slotData.current++;
                await slotData.save({ session });
            }

            /******************************************************
             * QR
             ******************************************************/
            const qr = createQR(orderData.total, orderId);

            /******************************************************
             * CREATE ORDER
             ******************************************************/
            const order = new Order({
                orderId,
                customer: orderData.customer,
                deliveryType: orderData.deliveryType,
                address: orderData.address,
                receiveDate: orderData.receiveDate,
                receiveSlot: orderData.receiveSlot,
                items: orderData.items,
                voucher: orderData.voucher,
                shippingFee: orderData.shippingFee,
                discount: orderData.discount,
                total: orderData.total,
                payment: {
                    method: paymentMethod || "vietqr",
                    status: "Pending"
                },
                qr
            });
            await order.save({ session });

            /******************************************************
             * COMMIT
             ******************************************************/
            await session.commitTransaction();
            await session.endSession();

            /******************************************************
             * RESPONSE
             ******************************************************/
            return res.json({
                success: true,
                message: "Đặt hàng thành công.",
                orderId,
                total,
                payment: {
                    bank: "MB BANK",
                    accountNumber: "123456789",
                    accountName: "SWEETCAKE",
                    amount: orderData.total,
                    content: orderId,
                    qr
                }
            });
        } catch (error) {
            await session.abortTransaction();
            await session.endSession();
            console.error(error);
            return res.status(500).json({
                success: false,
                message: "Không thể tạo đơn hàng.",
                error: error.message
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/******************************************************************
 * START SERVER
 ******************************************************************/
app.listen(PORT, () => {
    console.log("========================================");
    console.log("🍰 SweetCake Server is running...");
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log("📦 MongoDB Connected");
    console.log("========================================");
});
