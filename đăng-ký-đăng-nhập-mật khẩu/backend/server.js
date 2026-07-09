const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // BẮT BUỘC để đọc được req.body ở các route POST (vd /auth/dang-nhap)

const uri = "mongodb://trattt23406_db_user:Sweetcake@ac-ty4b5px-shard-00-00.fcgjst5.mongodb.net:27017,ac-ty4b5px-shard-00-01.fcgjst5.mongodb.net:27017,ac-ty4b5px-shard-00-02.fcgjst5.mongodb.net:27017/?ssl=true&replicaSet=atlas-yjqqup-shard-0&authSource=admin&appName=Cluster0";

const client = new MongoClient(uri);

let database;

// Regex kiểm tra định dạng email cơ bản — dùng chung cho các route liên quan
const KIEU_EMAIL_HOP_LE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//========================
// API Products
//========================
app.get('/data/products', async (req, res) => {
    try {
        const products = await database.collection('products').find({}).toArray();
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

//========================
// API Reviews
//========================
app.get('/data/reviews', async (req, res) => {
    try {
        const reviews = await database.collection('reviews').find({}).toArray();
        res.json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

//========================
// API Customization
//========================
app.get('/data/customization', async (req, res) => {
    try {
        const customization = await database.collection('customization').find({}).toArray();
        res.json(customization);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

//========================
// API Users
//========================
app.get('/data/users', async (req, res) => {
    try {
        const users = await database.collection('users').find({}).toArray();
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

//========================
// API Đăng ký tài khoản mới
//========================
app.post('/auth/dang-ky', async (req, res) => {
    try {
        const { name, phone, email, password } = req.body || {};

        // ---------- Kiểm tra họ và tên ----------
        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                field: 'fullname',
                message: "Vui lòng nhập họ và tên."
            });
        }

        // ---------- Kiểm tra số điện thoại ----------
        if (!phone) {
            return res.status(400).json({
                success: false,
                field: 'phone',
                message: "Vui lòng nhập số điện thoại."
            });
        }

        const sdt = String(phone).replace(/\D/g, '');
        if (sdt.length < 9 || sdt.length > 12) {
            return res.status(400).json({
                success: false,
                field: 'phone',
                message: "Số điện thoại không hợp lệ."
            });
        }

        // ---------- Kiểm tra mật khẩu ----------
        if (!password) {
            return res.status(400).json({
                success: false,
                field: 'password',
                message: "Vui lòng nhập mật khẩu."
            });
        }

        const matKhauHopLe = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
        if (!matKhauHopLe) {
            return res.status(400).json({
                success: false,
                field: 'password',
                message: "Mật khẩu chưa đạt yêu cầu (tối thiểu 8 ký tự, có chữ hoa và số)."
            });
        }

        // ---------- Kiểm tra định dạng email (tuỳ chọn, nếu có nhập) ----------
        const emailChuanHoa = email ? String(email).trim() : "";
        if (emailChuanHoa && !KIEU_EMAIL_HOP_LE.test(emailChuanHoa)) {
            return res.status(400).json({
                success: false,
                field: 'email',
                message: "Email không đúng định dạng."
            });
        }

        // ---------- Kiểm tra số điện thoại đã tồn tại chưa ----------
        const sdtDaTonTai = await database.collection('users').findOne({ phone: sdt });
        if (sdtDaTonTai) {
            return res.status(409).json({
                success: false,
                field: 'phone',
                message: "Số điện thoại này đã được đăng ký."
            });
        }

        // ---------- Kiểm tra email đã tồn tại chưa (chỉ khi người dùng có nhập email) ----------
        if (emailChuanHoa) {
            const emailDaTonTai = await database.collection('users').findOne({ email: emailChuanHoa });
            if (emailDaTonTai) {
                return res.status(409).json({
                    success: false,
                    field: 'email',
                    message: "Email này đã được sử dụng cho tài khoản khác."
                });
            }
        }

        // ---------- Tất cả hợp lệ -> lưu vào MongoDB ----------
        const nguoiDungMoi = {
            name: String(name).trim(),
            phone: sdt,
            email: emailChuanHoa,
            password: password, // Lưu ý: đang lưu plain text để nhất quán với /auth/dang-nhap hiện có
            createdAt: new Date()
        };

        const ketQua = await database.collection('users').insertOne(nguoiDungMoi);

        res.json({
            success: true,
            message: "Đăng ký thành công.",
            id: ketQua.insertedId,
            name: nguoiDungMoi.name,
            phone: nguoiDungMoi.phone,
            email: nguoiDungMoi.email
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi server, vui lòng thử lại sau." });
    }
});

//========================
// API Đăng nhập (so khớp mật khẩu trực tiếp, không hash)
//========================
app.post('/auth/dang-nhap', async (req, res) => {
    try {
        const { phone, password } = req.body || {};

        if (!phone || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập số điện thoại và mật khẩu.' });
        }

        // Chuẩn hoá số điện thoại về chỉ còn chữ số, tránh lệch do dấu cách
        const sdtChuanHoa = String(phone).replace(/\D/g, '');

        const nguoiDung = await database.collection('users').findOne({ phone: sdtChuanHoa });

        if (!nguoiDung) {
            return res.status(401).json({ message: 'Số điện thoại chưa được đăng ký tại SweetCake.' });
        }

        if (String(nguoiDung.password) !== String(password)) {
            return res.status(401).json({ message: 'Mật khẩu không đúng, vui lòng thử lại.' });
        }

        // Chỉ trả về các field cần thiết cho frontend, không cần trả cả document
        res.json({
            id: nguoiDung.id ?? nguoiDung._id,
            name: nguoiDung.name,
            email: nguoiDung.email,
            phone: nguoiDung.phone
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

//========================
// API Gửi OTP
//========================
app.post('/auth/send-otp', async (req, res) => {
    try {

        const { phone } = req.body || {};

        if (!phone) {
            return res.status(400).json({
                message: "Vui lòng nhập số điện thoại."
            });
        }

        // Chuẩn hoá số điện thoại
        const sdt = String(phone).replace(/\D/g, '');

        // Kiểm tra tài khoản tồn tại
        const user = await database.collection("users").findOne({
            phone: sdt
        });

        if (!user) {
            return res.status(404).json({
                message: "Số điện thoại chưa được đăng ký."
            });
        }

        // Sinh OTP
        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // Hết hạn sau 1 phút
        const expiredAt = new Date(
            Date.now() + 1 * 60 * 1000
        );

        // Xóa OTP cũ nếu có
        await database.collection("otp_codes").deleteMany({
            phone: sdt
        });

        // Lưu OTP mới
        await database.collection("otp_codes").insertOne({

            phone: sdt,
            otp: otp,
            expiredAt: expiredAt,
            createdAt: new Date()

        });

        // Demo: in OTP ra Console
        console.log("========== OTP ==========");
        console.log("Phone:", sdt);
        console.log("OTP:", otp);
        console.log("=========================");

        res.json({
            success: true,
            message: "OTP đã được tạo."
        });

    }
    catch (err) {

        console.error(err);
        res.status(500).json({
            error: "Lỗi server"

        });

    }
});

//========================
// API Xác thực OTP
//========================
app.post('/auth/verify-otp', async (req, res) => {

    try {

        const { phone, otp } = req.body || {};

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: "Thiếu số điện thoại hoặc OTP."
            });
        }

        // Chuẩn hóa số điện thoại
        const sdt = String(phone).replace(/\D/g, '');

        // Tìm OTP
        const data = await database.collection("otp_codes").findOne({
            phone: sdt
        });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy OTP."
            });
        }

        // Kiểm tra OTP hết hạn
        if (new Date() > new Date(data.expiredAt)) {

            await database.collection("otp_codes").deleteOne({
                _id: data._id
            });

            return res.json({
                success: false,
                message: "OTP đã hết hạn."
            });
        }

        // Kiểm tra OTP đúng hay sai
        if (data.otp !== otp) {

            return res.json({
                success: false,
                message: "OTP không chính xác."
            });
        }

        // OTP đúng -> xóa khỏi database
        await database.collection("otp_codes").deleteOne({
            _id: data._id
        });

        res.json({
            success: true,
            message: "Xác thực thành công."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Lỗi server"
        });

    }

});

//========================
// API Cập nhật mật khẩu mới (sau khi xác thực OTP thành công)
//========================
app.post('/auth/reset-password', async (req, res) => {
    try {
        const { phone, password } = req.body || {};

        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: "Thiếu số điện thoại hoặc mật khẩu mới."
            });
        }

        const matKhauHopLe = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
        if (!matKhauHopLe) {
            return res.status(400).json({
                success: false,
                message: "Mật khẩu chưa đạt yêu cầu (tối thiểu 8 ký tự, có chữ hoa và số)."
            });
        }

        const sdt = String(phone).replace(/\D/g, '');

        const nguoiDung = await database.collection('users').findOne({ phone: sdt });
        if (!nguoiDung) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản với số điện thoại này."
            });
        }

        await database.collection('users').updateOne(
            { phone: sdt },
            { $set: { password: password, updatedAt: new Date() } }
        );

        res.json({
            success: true,
            message: "Cập nhật mật khẩu thành công."
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Lỗi server" });
    }
});

//========================
// Khởi động Server (CHỈ MỘT hàm duy nhất)
//========================
async function startServer() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        database = client.db("SweetCake");
        console.log("🟢 Đã kết nối MongoDB Atlas");

        app.listen(3000, () => {
            console.log("🚀 Backend đang chạy tại http://localhost:3000");
        });
    } catch (err) {
        console.error("❌ Lỗi kết nối MongoDB:", err.name, "-", err.message);
    }
}

startServer();