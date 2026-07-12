const path = require("path");
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "..")));

// 1. Chuỗi kết nối 
const uri = "mongodb://trattt23406_db_user:Sweetcake@ac-ty4b5px-shard-00-00.fcgjst5.mongodb.net:27017,ac-ty4b5px-shard-00-01.fcgjst5.mongodb.net:27017,ac-ty4b5px-shard-00-02.fcgjst5.mongodb.net:27017/?ssl=true&replicaSet=atlas-yjqqup-shard-0&authSource=admin&appName=Cluster0";
const client = new MongoClient(uri);


// Biến dùng chung để giữ kết nối database xuyên suốt
let database;


// Hàm khởi chạy kết nối một lần duy nhất khi bật server
async function startServer() {
    try {
        await client.connect();
        database = client.db('SweetCake');
        console.log("🟢 Đã kết nối thành công và giữ luồng tới MongoDB Atlas!");
       
        // Chỉ chạy Server API sau khi đã kết nối Database thành công
        app.listen(3000, () => {
            console.log(" Backend đang chạy tại: http://localhost:3000");
        });
    } catch (err) {
        console.error(" Lỗi kết nối MongoDB ban đầu:", err);
    }
}


// 2. Định nghĩa API Endpoint lấy dữ liệu sản phẩm
app.get('/data/products', async (req, res) => {
    try {
        // Lấy trực tiếp collection từ kết nối có sẵn, KHÔNG đóng/mở lại nữa
        const collection = database.collection('products');
        const products = await collection.find({}).toArray();
       
        res.json(products);
    } catch (error) {
        console.error("❌ Lỗi khi lấy dữ liệu:", error);
        res.status(500).json({ error: "Lỗi nội bộ Server" });
    }
});


// Kích hoạt chạy hệ thống
startServer();
