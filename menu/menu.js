// =========================
// LOAD JSON
// =========================

let products = [];
let filteredProducts = [];

fetch("data/products.json")
    .then(res => res.json())
    .then(data => {
        products = data;
        filteredProducts = [...products];

        renderProducts(filteredProducts);
        addEvents();
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

        grid.innerHTML += `

        <div class="product-card">

            <div class="product-image">

                ${product.bestSeller ?
                `<div class="badge">Bán chạy</div>`
                : ""}

                <img src="${product.image}" alt="${product.name}">

                <div class="hover-layer">

                    <button class="buy-btn">
                        Mua ngay
                    </button>

                    <button class="cart-btn">
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

        let okSpecial =
            specials.length==0 ||
            specials.includes(product.special);

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