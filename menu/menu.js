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

    let price = document.querySelector(
        "input[name='price']:checked"
    );



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

        if(price){

            let p = Number(price.value);

            if(p==200000){

                okPrice = product.price < 200000;

            }

            else if(p==300000){

                okPrice =
                    product.price>=200000 &&
                    product.price<=300000;

            }

            else if(p==400000){

                okPrice =
                    product.price>300000 &&
                    product.price<=400000;

            }

            else if(p==500000){

                okPrice =
                    product.price>400000 &&
                    product.price<=500000;

            }

            else{

                okPrice =
                    product.price>500000;

            }

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