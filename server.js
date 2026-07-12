const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Đọc dữ liệu JSON từ frontend

const uri = "mongodb://trattt23406_db_user:Sweetcake@ac-ty4b5px-shard-00-00.fcgjst5.mongodb.net:27017,ac-ty4b5px-shard-00-01.fcgjst5.mongodb.net:27017,ac-ty4b5px-shard-00-02.fcgjst5.mongodb.net:27017/?ssl=true&replicaSet=atlas-yjqqup-shard-0&authSource=admin&appName=Cluster0";
const client = new MongoClient(uri);

let database;
const KIEU_EMAIL_HOP_LE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const { ObjectId } = require('mongodb');

// Middleware xác thực đơn giản: token = chính user._id
async function xacThuc(req, res, next) {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.replace('Bearer ', '').trim();
        if (!token || token === 'null') {
            return res.status(401).json({ message: 'Chưa đăng nhập.' });
        }
        const user = await database.collection('users').findOne({ _id: new ObjectId(token) });
        if (!user) return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' });
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' });
    }
}

//==========================================================
// 1. CÁC API DỮ LIỆU (GET)
//==========================================================
app.get('/data/products', async (req, res) => {
    try {
        const products = await database.collection('products').find({}).toArray();
        res.json(products);
    } catch (err) { res.status(500).json({ error: 'Lỗi server' }); }
});

app.get('/data/reviews', async (req, res) => {
    try {
        const reviews = await database.collection('reviews').find({}).toArray();
        res.json(reviews);
    } catch (err) { res.status(500).json({ error: 'Lỗi server' }); }
});

app.get('/data/customization', async (req, res) => {
    try {
        const customization = await database.collection('customization').find({}).toArray();
        res.json(customization);
    } catch (err) { res.status(500).json({ error: 'Lỗi server' }); }
});

app.get('/data/addresses', async (req, res) => {
    try {
        const addresses = await database.collection('addresses').find({}).toArray();
        res.json(addresses);
    } catch (err) { res.status(500).json({ error: 'Lỗi lấy sổ địa chỉ' }); }
});

app.get('/data/coupons', async (req, res) => {
    try {
        const coupons = await database.collection('coupons').find({}).toArray();
        res.json(coupons);
    } catch (err) { res.status(500).json({ error: 'Lỗi lấy mã giảm giá' }); }
});

app.get('/data/time-slots', async (req, res) => {
    try {
        const slots = await database.collection('time_slots').find({}).toArray();
        res.json(slots);
    } catch (err) { res.status(500).json({ error: 'Lỗi lấy khung giờ đặt lịch' }); }
});

app.get('/data/posts', async (req, res) => {
    try {
        const posts = await database.collection('posts').find({}).toArray();
        res.json(posts);
    } catch (err) { res.status(500).json({ error: "Lỗi nội bộ Server" }); }
});

app.get("/data/faqs", async (req, res) => {
    try {
        const faqs = await database.collection("faqs").find({}).toArray();
        res.json(faqs);
    } catch (err) { res.status(500).json({ error: "Lỗi lấy FAQ" }); }
});

//==========================================================
// 2. CÁC API ĐƠN HÀNG
//==========================================================
app.get('/api/orders', xacThuc, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const status = req.query.status || 'all';
        const search = req.query.search || '';

        const bo_loc = { customer_id: req.user._id.toString() };
        if (status !== 'all') bo_loc.status = status;
        if (search) {
            bo_loc.$or = [
                { id: { $regex: search, $options: 'i' } },           // ===== SỬA: order_code -> id =====
                { 'items.product_name': { $regex: search, $options: 'i' } }
            ];
        }

        const tongSo = await database.collection('orders').countDocuments(bo_loc);
        const donHangs = await database.collection('orders')
            .find(bo_loc)
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        res.json({
            orders: donHangs,
            pagination: { page, totalPages: Math.max(1, Math.ceil(tongSo / limit)) }
        });
    } catch (err) {
        res.status(500).json({ orders: [], pagination: { page: 1, totalPages: 1 } });
    }
});
app.post('/api/orders', xacThucTuyChon, async (req, res) => {          // ===== THÊM: xacThuc =====
    try {
        const donHang = req.body;
        if (!donHang || !donHang.id || !donHang.customer_name) {
            return res.status(400).json({ success: false, error: 'Dữ liệu không hợp lệ' });
        }
        donHang.customer_id = req.user ? req.user._id.toString() : null;
        donHang.created_at = new Date();
        donHang.status = donHang.status || 'received';
        const result = await database.collection('orders').insertOne(donHang);
        res.status(201).json({ success: true, message: 'Đặt hàng thành công!', orderId: result.insertedId });
    } catch (err) { res.status(500).json({ success: false, error: 'Lỗi xử lý đơn hàng' }); }
});
// Middleware xác thực TÙY CHỌN — dùng cho các route cho phép đặt hàng không cần đăng nhập.
// Nếu có token hợp lệ thì gắn req.user để biết khách là ai; nếu không có/token sai thì
// vẫn cho đi tiếp (req.user = null), không chặn.
async function xacThucTuyChon(req, res, next) {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.replace('Bearer ', '').trim();
        if (!token || token === 'null') {
            req.user = null;
            return next();
        }
        const user = await database.collection('users').findOne({ _id: new ObjectId(token) });
        req.user = user || null; // token sai/không tìm thấy user -> vẫn cho qua như khách vãng lai
        next();
    } catch (err) {
        req.user = null; // token không hợp lệ (vd không phải ObjectId) -> vẫn cho qua
        next();
    }
}
app.get('/api/orders/:id', async (req, res) => {
    try {
        const order = await database.collection('orders').findOne({ id: req.params.id });
        order ? res.json(order) : res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng' });
    } catch (err) { res.status(500).json({ success: false, error: 'Lỗi hệ thống' }); }
});

//==========================================================
// 3. CÁC API TÀI KHOẢN (ĐĂNG KÝ, ĐĂNG NHẬP, OTP)
//==========================================================
//==========================================================
// 3. CÁC API TÀI KHOẢN (ĐĂNG KÝ, ĐĂNG NHẬP, OTP)
//==========================================================

// Đăng ký
app.post('/auth/dang-ky', async (req, res) => {
    try {
        const { name, phone, email, password } = req.body || {};
        if (!name || !phone || !password) return res.status(400).json({ success: false, message: "Thiếu thông tin." });
        
        const sdt = String(phone).replace(/\D/g, '');
        const sdtDaTonTai = await database.collection('users').findOne({ phone: sdt });
        if (sdtDaTonTai) return res.status(409).json({ success: false, field: 'phone', message: "Số điện thoại đã được đăng ký." });

        const nguoiDungMoi = { name: String(name).trim(), phone: sdt, email: email ? String(email).trim() : "", password, createdAt: new Date() };
        const ketQua = await database.collection('users').insertOne(nguoiDungMoi);
        res.json({ success: true, message: "Đăng ký thành công.", id: ketQua.insertedId });
    } catch (err) { res.status(500).json({ success: false, message: "Lỗi server." }); }
});

// Đăng nhập
app.post('/auth/dang-nhap', async (req, res) => {
    try {
        const { phone, password } = req.body || {};
        const sdtChuanHoa = String(phone).replace(/\D/g, '');
        const nguoiDung = await database.collection('users').findOne({ phone: sdtChuanHoa });

        if (!nguoiDung) return res.status(401).json({ message: 'Số điện thoại chưa được đăng ký.' });
        if (String(nguoiDung.password) !== String(password)) return res.status(401).json({ message: 'Mật khẩu không đúng.' });

        res.json({ id: nguoiDung._id, name: nguoiDung.name, email: nguoiDung.email, phone: nguoiDung.phone });
    } catch (err) { res.status(500).json({ error: 'Lỗi server' }); }
});

// Gửi OTP
app.post('/auth/send-otp', async (req, res) => {
    try {
        const { phone } = req.body || {};
        const sdt = String(phone).replace(/\D/g, '');
        const user = await database.collection("users").findOne({ phone: sdt });
        if (!user) return res.status(404).json({ message: "Số điện thoại chưa được đăng ký." });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await database.collection("otp_codes").deleteMany({ phone: sdt });
        await database.collection("otp_codes").insertOne({ 
            phone: sdt, otp, expiredAt: new Date(Date.now() + 60000), createdAt: new Date() 
        });
        
        console.log("=== OTP MỚI ===", sdt, ":", otp);
        res.json({ success: true, message: "OTP đã được tạo." });
    } catch (err) { res.status(500).json({ error: "Lỗi server" }); }
});

// Xác thực OTP
app.post('/auth/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body || {};
        const sdt = String(phone).replace(/\D/g, '');
        const data = await database.collection("otp_codes").findOne({ phone: sdt });

        if (!data || data.otp !== otp || new Date() > new Date(data.expiredAt)) {
            return res.json({ success: false, message: "OTP không chính xác hoặc hết hạn." });
        }
        await database.collection("otp_codes").deleteOne({ _id: data._id });
        res.json({ success: true, message: "Xác thực thành công." });
    } catch (err) { res.status(500).json({ error: "Lỗi server" }); }
});

// Reset Mật khẩu
app.post('/auth/reset-password', async (req, res) => {
    try {
        const { phone, password } = req.body || {};
        const sdt = String(phone).replace(/\D/g, '');
        await database.collection('users').updateOne({ phone: sdt }, { $set: { password, updatedAt: new Date() } });
        res.json({ success: true, message: "Cập nhật mật khẩu thành công." });
    } catch (err) { res.status(500).json({ success: false, error: "Lỗi server" }); }
});
//==========================================================
// 4. KHỞI ĐỘNG SERVER
//==========================================================
async function startServer() {
    try {
        await client.connect();
        database = client.db("SweetCake");
        console.log("🟢 Đã kết nối MongoDB Atlas");

        app.listen(3000, () => {
            console.log("🚀 Backend đang chạy tại http://localhost:3000");
        });
    } catch (err) {
        console.error("❌ Lỗi kết nối:", err);
    }
}

startServer();