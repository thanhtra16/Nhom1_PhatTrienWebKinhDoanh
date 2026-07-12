// ==============================================================
// HẰNG SỐ DÙNG CHUNG
// ==============================================================
const CART_STORAGE_KEY = "sweetcake_cart"; // Dùng chung key với trang giỏ hàng
const API_PRODUCTS_URL = "http://localhost:3000/data/products";


// ==============================================================
// KHỞI TẠO KHI DOM SẴN SÀNG
// ==============================================================
document.addEventListener("DOMContentLoaded", () => {
    khoiTaoMegaMenu();
    taiVaKhoiTaoNganKeoGioHang();
    ganSuKienIconTaiKhoan(); // Gắn độc lập, không phụ thuộc vào giỏ hàng
});


// ==============================================================
// MEGA MENU: ĐÓNG/MỞ + NẠP SẢN PHẨM TỪ MONGODB
// ==============================================================
function khoiTaoMegaMenu() {
    const nutMenu = document.getElementById("nut-kich-hoat-menu");
    const khungMenu = document.getElementById("o-chua-mega-menu");

    if (!nutMenu || !khungMenu) return; 

    // ĐÓNG MỞ MENU THẢ XUỐNG
    nutMenu.addEventListener("click", function (e) {
        e.preventDefault();
        khungMenu.classList.toggle("dang-kich-hoat");
    });

    document.addEventListener("click", function (e) {
        if (!nutMenu.contains(e.target) && !khungMenu.contains(e.target)) {
            khungMenu.classList.remove("dang-kich-hoat");
        }
    });

    // FETCH VÀ RENDER DỮ LIỆU SẢN PHẨM TRÊN MEGA MENU
    taiSanPhamMegaMenu();
}

function taiSanPhamMegaMenu() {
    const vungNapMenu = document.getElementById('vung-nap-san-pham-menu');

    fetch(API_PRODUCTS_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(megaMenuProducts => {
            const displayedProducts = megaMenuProducts.slice(0, 4);
            const htmlMenuProducts = displayedProducts
                .map(renderMegaMenuItemHtml)
                .join('');

            if (vungNapMenu) {
                vungNapMenu.innerHTML = htmlMenuProducts;
            }
        })
        .catch(error => {
            console.error('Lỗi khi tải dữ liệu sản phẩm cho Mega Menu:', error);
        });
}

function renderMegaMenuItemHtml(m) {
    const shortDesc = m.description && m.description.length > 50
        ? m.description.substring(0, 50) + '...'
        : (m.description || 'Hương vị ngọt ngào cho mọi dịp đặc biệt.');

    return `
        <div class="dong-chi-tiet-mon-an">
            <img src="${m.thumbnail}" alt="${m.name}">
            <div class="chu-khoi-mon-an">
                <h4>${m.name}</h4>
                <p>${shortDesc}</p>
            </div>
        </div>
    `;
}


// ==============================================================
// NGĂN KÉO GIỎ HÀNG: NẠP FILE HTML + KHỞI TẠO SỰ KIỆN
// ==============================================================
function taiVaKhoiTaoNganKeoGioHang() {
    const cartContainer = document.getElementById("phan-ngan-keo-gio-hang");
    if (!cartContainer) return;

    fetch('/trang-gio-hang/ngan-keo-gio-hang.html')
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

// LOGIC ĐÓNG/MỞ NGĂN KÉO GIỎ HÀNG
// LOGIC ĐÓNG/MỞ NGĂN KÉO GIỎ HÀNG
function kichHoatSuKienGioHang() {
    const cartDrawer = document.getElementById("ngan-keo-gio-hang");
    const cartOverlay = document.getElementById("lop-phu-gio-hang");
    const btnCloseCart = document.getElementById("nut-dong-gio-hang");

    // Dùng delegation trên document vì icon .bi-cart nằm trong header
    // được nạp bất đồng bộ (có thể chưa tồn tại lúc đoạn này chạy)
    document.addEventListener("click", (e) => {
        const iconCart = e.target.closest(".bi-cart");
        if (iconCart) {
            e.preventDefault();

            const dangMo = cartDrawer.classList.contains("open");

            if (dangMo) {
                cartDrawer.classList.remove("open");
                cartOverlay.classList.remove("open");
            } else {
                cartDrawer.classList.add("open");
                cartOverlay.classList.add("open");
            }
        }
    });

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
async function loadDuLieuGioHang() {
    const vungNapSp = document.getElementById("vung-nap-sp-gio-hang");
    const theTongTien = document.getElementById("tong-tien-gio-hang");

    if (!vungNapSp || !theTongTien) return;

    try {
        // 1. Lấy dữ liệu từ Local Storage
        const cartItems = layGioHangTuLocalStorage();

        // Nếu không có sản phẩm nào
        if (cartItems.length === 0) {
            vungNapSp.innerHTML = renderGioHangTrongHtml();
            theTongTien.innerText = "0đ";
            return;
        }

        // 2. Fetch danh sách sản phẩm từ MongoDB để lấy thông tin chi tiết (ảnh, tên, giá)
        const response = await fetch(API_PRODUCTS_URL);
        if (!response.ok) {
            throw new Error("Không lấy được dữ liệu sản phẩm");
        }
        const allProducts = await response.json();

        // 3. Đối chiếu Local Storage với API để render
        const html = cartItems
            .map(cartItem => {
                const sp = allProducts.find(p => String(p.id) === String(cartItem.id));
                return sp ? renderCartItemHtml(sp, cartItem) : '';
            })
            .join('');

        vungNapSp.innerHTML = html;
        capNhatTongTien();

    } catch (error) {
        console.error(error);
        vungNapSp.innerHTML = "<p>Không tải được dữ liệu.</p>";
    }
}

function layGioHangTuLocalStorage() {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
}

function renderGioHangTrongHtml() {
    return '<p class="chu-thuong" style="text-align: center; padding: 40px;">Giỏ hàng của bạn đang trống.</p>';
}

function renderCartItemHtml(sp, cartItem) {
    return `
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

// LẮNG NGHE SỰ KIỆN CLICK VÀO ICON TÀI KHOẢN (TRÊN HEADER)
function ganSuKienIconTaiKhoan() {
    const linkTaiKhoan = document.querySelector('a.bi-person-circle');
    if (!linkTaiKhoan) return;

    linkTaiKhoan.addEventListener('click', (e) => {
        e.preventDefault();

        localStorage.setItem('activeTab', 'tab-thong-tin');

        // Kiểm tra xem có phải đang ở trang quản lý rồi không
        if (window.location.pathname.includes('quan-ly-tai-khoan.html')) {
            window.location.reload();
        } else {
            window.location.href = '/trang-quan-ly-tai-khoan/quan-ly-tai-khoan.html';
        }
    });
}


// ==============================================================
// TÍNH TỔNG TIỀN TRONG NGĂN KÉO GIỎ HÀNG
// ==============================================================
function capNhatTongTien() {
    let tong = 0;
    document.querySelectorAll(".item-gio-hang").forEach(item => {
        const checkbox = item.querySelector(".checkbox-sp");

        if (checkbox && checkbox.checked) {
            const price = Number(checkbox.dataset.price);
            const qty = Number(checkbox.dataset.qty); 
            tong += (price * qty);
        }
    });

    const tongTienEl = document.getElementById("tong-tien-gio-hang");
    if (tongTienEl) {
        tongTienEl.innerText = new Intl.NumberFormat("vi-VN").format(tong) + "đ";
    }
}


// ==============================================================
// SỰ KIỆN TOÀN CỤC: TÍCH CHỌN / XÓA SẢN PHẨM TRONG NGĂN KÉO
// ==============================================================

// BẮT SỰ KIỆN TÍCH CHECKBOX
document.addEventListener("change", function (e) {
    if (e.target.classList.contains("checkbox-sp")) {
        capNhatTongTien();
    }
});

// BẮT SỰ KIỆN XÓA SẢN PHẨM Ở NGĂN KÉO
document.addEventListener("click", function (e) {
    if (e.target.classList.contains("icon-xoa")) {
        xoaSanPhamKhoiGioHang(e.target.closest(".item-gio-hang"));
    }
});

function xoaSanPhamKhoiGioHang(item) {
    if (!item) return;

    const itemId = item.dataset.id;

    // 1. Xóa khỏi Local Storage
    let cartItems = layGioHangTuLocalStorage();
    cartItems = cartItems.filter(cartItem => String(cartItem.id) !== String(itemId));
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));

    // 2. Xóa khỏi Giao diện và cập nhật tiền
    item.remove();
    capNhatTongTien();

    // 3. Nếu xóa hết thì hiện thông báo trống
    const remainingItems = document.querySelectorAll('.item-gio-hang');
    if (remainingItems.length === 0) {
        const vungNapSp = document.getElementById("vung-nap-sp-gio-hang");
        if (vungNapSp) vungNapSp.innerHTML = renderGioHangTrongHtml();
    }
}


// ==============================================================
// THÊM SẢN PHẨM VÀO GIỎ HÀNG (Dùng ở trang Danh sách / Chi tiết SP)
// ==============================================================
window.themVaoGioHang = function (productId) {
    let cartItems = layGioHangTuLocalStorage();

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
