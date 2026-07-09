document.addEventListener("DOMContentLoaded", () => {

    // ĐÓNG MỞ MENU THẢ XUỐNG 
    const nutMenu = document.getElementById("nut-kich-hoat-menu");
    const khungMenu = document.getElementById("o-chua-mega-menu");

    nutMenu.addEventListener("click", function(e) {
        e.preventDefault();
        khungMenu.classList.toggle("dang-kich-hoat");
    });

    document.addEventListener("click", function(e) {
        if (!nutMenu.contains(e.target) && !khungMenu.contains(e.target)) {
            khungMenu.classList.remove("dang-kich-hoat");
        }
    });

    // FETCH VÀ RENDER DỮ LIỆU SẢN PHẨM TRÊN MEGA MENU TỪ MONGODB
    const vungNapMenu = document.getElementById('vung-nap-san-pham-menu');

    fetch('http://localhost:3000/data/products')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(megaMenuProducts => {
            let htmlMenuProducts = '';

            const displayedProducts = megaMenuProducts.slice(0, 4);
            
            displayedProducts.forEach(m => {
                const shortDesc = m.description && m.description.length > 50 
                    ? m.description.substring(0, 50) + '...' 
                    : (m.description || 'Hương vị ngọt ngào cho mọi dịp đặc biệt.');

                htmlMenuProducts += `
                    <div class="dong-chi-tiet-mon-an">
                        <img src="${m.thumbnail}" alt="${m.name}">
                        <div class="chu-khoi-mon-an">
                            <h4>${m.name}</h4>
                            <p>${shortDesc}</p>
                        </div>
                    </div>
                `;
            });
            
            if (vungNapMenu) {
                vungNapMenu.innerHTML = htmlMenuProducts;
            }
        })
        .catch(error => {
            console.error('Lỗi khi tải dữ liệu sản phẩm cho Mega Menu:', error);
        });
    
    // TÌM THẺ GIỮ CHỖ VÀ NẠP FILE GIỎ HÀNG
    const cartContainer = document.getElementById("phan-ngan-keo-gio-hang");

    if (cartContainer) {
        fetch('/trang-gio-hang/frontend/ngan-keo-gio-hang.html')
            .then(response => {
                if (!response.ok) throw new Error("Không thể tải file giỏ hàng.");
                return response.text();
            })
            .then(html => {
                cartContainer.innerHTML = html;
                
                kichHoatSuKienGioHang();
                loadDuLieuGioHang();
            })
            .catch(error => console.error(error));
    }
});

// LOGIC ĐÓNG/MỞ NGĂN KÉO GIỎ HÀNG
function kichHoatSuKienGioHang() {
    const iconCart = document.querySelector(".bi-cart"); 
    const cartDrawer = document.getElementById("ngan-keo-gio-hang");
    const cartOverlay = document.getElementById("lop-phu-gio-hang");
    const btnCloseCart = document.getElementById("nut-dong-gio-hang");

    if (iconCart) {
        iconCart.addEventListener("click", (e) => {
            e.preventDefault();
            cartDrawer.classList.add("open");
            cartOverlay.classList.add("open");
        });
    }

    const dongGioHang = () => {
        cartDrawer.classList.remove("open");
        cartOverlay.classList.remove("open");
    };

    if (btnCloseCart) btnCloseCart.addEventListener("click", dongGioHang);
    if (cartOverlay) cartOverlay.addEventListener("click", dongGioHang);
}


// ==============================================================
// ĐỌC DỮ LIỆU TỪ LOCAL STORAGE LÊN NGĂN KÉO GIỎ HÀNG
// ==============================================================

const CART_STORAGE_KEY = "sweetcake_cart"; // Dùng chung key với trang giỏ hàng

async function loadDuLieuGioHang() {
    const vungNapSp = document.getElementById("vung-nap-sp-gio-hang");
    const theTongTien = document.getElementById("tong-tien-gio-hang");

    if (!vungNapSp || !theTongTien) return;

    try {
        // 1. Lấy dữ liệu từ Local Storage
        const cartItems = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];

        // Nếu không có sản phẩm nào
        if (cartItems.length === 0) {
            vungNapSp.innerHTML = '<p class="chu-thuong" style="text-align: center; padding: 40px;">Giỏ hàng của bạn đang trống.</p>';
            theTongTien.innerText = "0đ";
            return;
        }

        // 2. Fetch danh sách sản phẩm từ MongoDB để lấy thông tin chi tiết (ảnh, tên, giá)
        const response = await fetch("http://localhost:3000/data/products");
        if (!response.ok) {
            throw new Error("Không lấy được dữ liệu sản phẩm");
        }
        const allProducts = await response.json();

        let html = "";
        
        // 3. Đối chiếu Local Storage với API để render
        cartItems.forEach(cartItem => {
            const sp = allProducts.find(p => String(p.id) === String(cartItem.id));
            
            if (sp) {
                html += `
                <div class="item-gio-hang" data-id="${sp.id}">

                    <div class="chon-sp">
                        <input
                            type="checkbox"
                            class="checkbox-sp"
                            checked
                            data-id="${sp.id}"
                            data-price="${sp.price}"
                            data-qty="${cartItem.qty}"> </div>

                    <img
                        src="http://localhost:3000/${sp.thumbnail}"
                        alt="${sp.name}"
                    >

                    <div class="thong-tin-item-gio">
                        <h4>${sp.name}</h4>
                        <p>SL: ${cartItem.qty}</p> <div class="gia-item-gio">
                            ${new Intl.NumberFormat("vi-VN").format(sp.price)}đ
                        </div>
                    </div>

                    <div class="hanh-dong-sp">
                        <i
                            class="fa-solid fa-trash icon-xoa"
                            data-id="${sp.id}">
                        </i>
                    </div>

                </div>
                `;
            }
        });

        vungNapSp.innerHTML = html;
        capNhatTongTien();

    } catch(error) {
        console.error(error);
        vungNapSp.innerHTML = "<p>Không tải được dữ liệu.</p>";
    }
}

// HÀM TÍNH TỔNG TIỀN TRONG NGĂN KÉO
function capNhatTongTien() {
    let tong = 0;
    document.querySelectorAll(".item-gio-hang").forEach(item => {
        const checkbox = item.querySelector(".checkbox-sp");
        
        if (checkbox && checkbox.checked) {
            const price = Number(checkbox.dataset.price);
            const qty = Number(checkbox.dataset.qty); // Lấy số lượng để nhân lên
            tong += (price * qty);
        }
    });
    
    const tongTienEl = document.getElementById("tong-tien-gio-hang");
    if (tongTienEl) {
        tongTienEl.innerText = new Intl.NumberFormat("vi-VN").format(tong) + "đ";
    }
}

// BẮT SỰ KIỆN TÍCH CHECKBOX
document.addEventListener("change", function(e){
    if (e.target.classList.contains("checkbox-sp")) {
        capNhatTongTien();
    }
});

// BẮT SỰ KIỆN XÓA SẢN PHẨM Ở NGĂN KÉO
document.addEventListener("click", function(e) {
    if (e.target.classList.contains("icon-xoa")) {
        const item = e.target.closest(".item-gio-hang");
        if (item) {
            const itemId = item.dataset.id;
            
            // 1. Xóa khỏi Local Storage
            let cartItems = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
            cartItems = cartItems.filter(cartItem => String(cartItem.id) !== String(itemId));
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));

            // 2. Xóa khỏi Giao diện và cập nhật tiền
            item.remove();
            capNhatTongTien();

            // 3. Nếu xóa hết thì hiện thông báo trống
            const remainingItems = document.querySelectorAll('.item-gio-hang');
            if (remainingItems.length === 0) {
                const vungNapSp = document.getElementById("vung-nap-sp-gio-hang");
                if (vungNapSp) vungNapSp.innerHTML = '<p class="chu-thuong" style="text-align: center; padding: 40px;">Giỏ hàng của bạn đang trống.</p>';
            }
        }
    }
});

// ==============================================================
// HÀM THÊM SẢN PHẨM VÀO GIỎ HÀNG (Dùng ở trang Danh sách / Chi tiết SP)
// ==============================================================
window.themVaoGioHang = function(productId) {
    let cartItems = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    
    // Kiểm tra xem sản phẩm đã có trong giỏ chưa
    const viTri = cartItems.findIndex(item => String(item.id) === String(productId));

    if (viTri > -1) {
        // Nếu có rồi thì tăng số lượng
        cartItems[viTri].qty += 1;
    } else {
        // Nếu chưa có thì thêm mới vào
        cartItems.push({ id: productId, qty: 1 });
    }

    // Lưu lại vào bộ nhớ
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));

    // Nạp lại ngăn kéo giỏ hàng để hiển thị sản phẩm vừa thêm
    loadDuLieuGioHang();

    // Tự động mở ngăn kéo ra cho khách hàng xem
    document.getElementById("ngan-keo-gio-hang").classList.add("open");
    document.getElementById("lop-phu-gio-hang").classList.add("open");
};