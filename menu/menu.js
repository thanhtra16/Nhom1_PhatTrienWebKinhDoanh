// 
//// /js/index.js
document.addEventListener("DOMContentLoaded", function() {
    fetch('/header/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Lỗi tải header:', error));
});
//  =========================
// LOAD JSON
// =========================

let products = [];
let filteredProducts = [];

// Map category thật trong dữ liệu (tiếng Anh) sang nhãn filter "Dịp đặc biệt" (tiếng Việt)
// Sửa/bổ sung nếu bạn thêm category mới trong MongoDB
const CATEGORY_TO_OCCASION = {
    "Birthday Cake": "Sinh nhật",
    "Anniversary Cake": "Kỷ niệm",
    "Wedding Cake": "Tiệc cưới",
    "Valentine Cake": "Valentine"
};

fetch("http://localhost:3000/data/products")
    .then(res => res.json())
    .then(data => {
        products = data;
        filteredProducts = [...products];

        renderProducts(filteredProducts);
        addEvents();
    })
    .catch(err => {
        console.error("Lỗi tải sản phẩm:", err);
    });


// =========================
// RENDER
// =========================

function renderProducts(list) {

    const grid = document.getElementById("product-grid");

    if (list.length === 0) {

        grid.innerHTML = `
            <h3>Không tìm thấy sản phẩm phù hợp.</h3>
        `;

        return;
    }

    grid.innerHTML = "";

    list.forEach(product => {

        // MongoDB tự sinh _id (ObjectId) — ưu tiên field id (số) nếu có, fallback về _id
        const idSp = product.id ?? product._id;

        grid.innerHTML += `

        <div class="product-card" onclick="xemChiTietSanPham('${idSp}')" style="cursor:pointer;">

            <div class="product-image">

                ${product.bestSeller ?
                `<div class="badge">Bán chạy</div>`
                : ""}

                <img src="${product.thumbnail}" alt="${product.name}">

                <div class="hover-layer">

                    <a href="../chi-tiet-san-pham/chi-tiet-san-pham.html?id=${idSp}" class="nut-bam" onclick="event.stopPropagation()">
                        Mua ngay
                    </a>

                    <button class="cart-btn" onclick="event.stopPropagation(); themVaoGio('${idSp}')">
                        Thêm vào giỏ
                    </button>

                </div>

            </div>

            <div class="product-info">

                <div class="product-name">
                    ${product.name}
                </div>

                <div class="product-price">
                    ${formatPrice(product.price)}
                </div>

            </div>

        </div>

        `;

    });

}


// =========================
// ĐIỀU HƯỚNG ĐẾN TRANG CHI TIẾT SẢN PHẨM
// =========================

function xemChiTietSanPham(id) {
    window.location.href = `../chi-tiet-san-pham/chi-tiet-san-pham.html?id=${id}`;
}

// Demo thêm giỏ hàng ngay tại trang menu (không điều hướng)
function themVaoGio(id) {
    const product = products.find(p => String(p.id ?? p._id) === String(id));
    if (product) {
        alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
    }
}


// =========================
// FORMAT PRICE
// =========================

function formatPrice(price){

    return new Intl.NumberFormat("vi-VN",{

        style:"currency",

        currency:"VND"

    }).format(price);

}



// =========================
// FILTER
// =========================

function addEvents(){

    document.querySelectorAll("input").forEach(item=>{

        item.addEventListener("change",filterProducts);

    });

    document
        .getElementById("search")
        .addEventListener("keyup",filterProducts);

    document
        .getElementById("sort")
        .addEventListener("change",filterProducts);

}



// =========================
// FILTER LOGIC
// =========================

function filterProducts(){

    let search = document
        .getElementById("search")
        .value
        .toLowerCase();

    let specials = getChecked(".special");

    let flavors = getChecked(".flavor");

    let types = getChecked(".type");

    let prices = getChecked(".price");



    filteredProducts = products.filter(product=>{

        let okSearch = product.name
            .toLowerCase()
            .includes(search);

        // So khớp filter "Dịp đặc biệt" (tiếng Việt) với category thật (tiếng Anh) qua bảng map
        let occasion = CATEGORY_TO_OCCASION[product.category] || product.category;
        let okSpecial =
            specials.length==0 ||
            specials.includes(occasion);

        let okFlavor =
            flavors.length==0 ||
            flavors.includes(product.flavor);

        let okType =
            types.length==0 ||
            types.includes(product.type);

        let okPrice = true;

        if (prices.length > 0) {

            okPrice = false;

            prices.forEach(price => {

                switch (price) {

                    case "200000":
                        if (product.price < 200000)
                            okPrice = true;
                        break;

                    case "300000":
                        if (product.price >= 200000 &&
                            product.price <= 300000)
                            okPrice = true;
                        break;

                    case "400000":
                        if (product.price > 300000 &&
                            product.price <= 400000)
                            okPrice = true;
                        break;

                    case "500000":
                        if (product.price > 400000 &&
                            product.price <= 500000)
                            okPrice = true;
                        break;

                    case "999999999":
                        if (product.price > 500000)
                            okPrice = true;
                        break;

                }

            });

        }

        return(

            okSearch &&
            okSpecial &&
            okFlavor &&
            okType &&
            okPrice

        );

    });


    sortProducts();

}



// =========================
// SORT
// =========================

function sortProducts(){

    let value =
        document.getElementById("sort").value;

    if(value=="low"){

        filteredProducts.sort((a,b)=>a.price-b.price);

    }

    else if(value=="high"){

        filteredProducts.sort((a,b)=>b.price-a.price);

    }

    renderProducts(filteredProducts);

}



// =========================
// GET CHECKED
// =========================

function getChecked(selector){

    let arr=[];

    document
        .querySelectorAll(selector+":checked")
        .forEach(item=>{

            arr.push(item.value);

        });

    return arr;

}
