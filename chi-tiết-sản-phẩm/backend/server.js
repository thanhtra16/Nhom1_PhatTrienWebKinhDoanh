const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());

const uri = "mongodb://trattt23406_db_user:Sweetcake@ac-ty4b5px-shard-00-00.fcgjst5.mongodb.net:27017,ac-ty4b5px-shard-00-01.fcgjst5.mongodb.net:27017,ac-ty4b5px-shard-00-02.fcgjst5.mongodb.net:27017/?ssl=true&replicaSet=atlas-yjqqup-shard-0&authSource=admin&appName=Cluster0";

const client = new MongoClient(uri);

let database;

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