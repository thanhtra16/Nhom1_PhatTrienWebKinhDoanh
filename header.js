// --- FILE JAVASCRIPT ĐIỀU KHIỂN HEADER DÙNG CHUNG ---

async function loadHeaderComponent() {
    try {
        const response = await fetch('../header.html');
        if (!response.ok) throw new Error('Không thể đọc file header.html');
        
        const headerHtml = await response.text();
        const container = document.getElementById('header-shared');
        
        if (container) {
            container.innerHTML = headerHtml;
            
            // ƯU TIÊN 1: Kích hoạt đóng mở menu trước để giao diện hoạt động ngay lập tức
            kichHoatDongMoMenu();
            kichHoatNutDangKy();
            kichHoatTogglePage(); 
            // ƯU TIÊN 2: Gọi dữ liệu từ server sau
            layDuLieuVaRenderMegaMenu(); 
        }
    } catch (error) {
        console.error("Lỗi hệ thống nạp cấu trúc Header:", error);
    }
}

// 1. Hàm đóng/mở Menu (Logic chuẩn bảo vệ sự kiện click)
function kichHoatDongMoMenu() {
    const nutMenu = document.getElementById("nut-kich-hoat-menu");
    const khungMenu = document.getElementById("o-chua-mega-menu");

    if (nutMenu && khungMenu) {
        nutMenu.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation(); // Chặn sự kiện lan ra ngoài làm menu bị đóng ngay lập tức
            khungMenu.classList.toggle("dang-kich-hoat");
        };

        document.onclick = function(e) {
            if (!nutMenu.contains(e.target) && !khungMenu.contains(e.target)) {
                khungMenu.classList.remove("dang-kich-hoat");
            }
        };
    } else {
        console.error("Không tìm thấy nút kích hoạt hoặc ô chứa mega menu!");
    }
}

// 2. Hàm gọi dữ liệu sản phẩm từ MongoDB lên Mega Menu
async function layDuLieuVaRenderMegaMenu() {
    try {
        const response = await fetch('http://localhost:3000/data/products'); 
        if (!response.ok) throw new Error(`Server trả về lỗi: ${response.status}`);
        
        const allProducts = await response.json(); 
        console.log("Dữ liệu nhận được từ MongoDB:", allProducts); // Kiểm tra xem data thật sự là gì

        if (!Array.isArray(allProducts)) {
            throw new Error("Dữ liệu trả về không phải là một mảng dữ liệu!");
        }

        const megaMenuProducts = allProducts.slice(0, 6); // Lấy 6 sản phẩm đầu tiên
        let htmlMenuProducts = '';
        
        megaMenuProducts.forEach(m => {
            // Phòng hờ nếu có bản ghi thiếu description hoặc tên trường id viết khác
            const productId = m.id || m._id;
            const productDesc = m.description ? (m.description.substring(0, 55) + "...") : "Chưa có mô tả cho món bánh này.";
            
            htmlMenuProducts += `
                <a href="/chi-tiet-san-pham.html?id=${productId}" class="dong-chi-tiet-mon-an">
                    <img src="../${m.thumbnail || 'media/default.png'}" alt="${m.name || 'Bánh'}">                    
                    <div class="chu-khoi-mon-an">
                        <h4>${m.name || 'Chưa có tên'}</h4>
                        <p>${productDesc}</p>
                    </div>
                </a>
            `;
        });
        
        const vungNapMenu = document.getElementById('vung-nap-san-pham-menu');
        if (vungNapMenu) {
            vungNapMenu.innerHTML = htmlMenuProducts;
            console.log("🎉 Đã render dữ liệu lên Mega Menu thành công!");
        }
    } catch (error) {
        // Nơi nhận lỗi chuẩn xác nhất!
        console.error("❌ LỖI THỰC TẾ TẠI FRONTEND:", error.message);
    }
}

// 3. Hàm xử lý nút đăng ký nhận ưu đãi
function kichHoatNutDangKy() {
    const nutDangKy = document.getElementById("nut-dang-ky-ngay");
    if (nutDangKy) {
        nutDangKy.addEventListener("click", function() {
            window.location.href = "../dang-ky-dang-nhap/dang-ky.html"; 
        });
    }
}

// =========================
// TOGGLE ĐIỀU HƯỚNG ICON HEADER
// Nhấn icon: nếu đang ở đúng trang icon đó trỏ tới -> quay lại trang trước
// Nếu chưa ở trang đó -> điều hướng tới bình thường
// =========================

function kichHoatTogglePage() {

    const cacIconHeader = document.querySelectorAll(".header-icons a[href]:not([href='#'])");

    cacIconHeader.forEach(icon => {

        icon.addEventListener("click", function(e) {

            const tenTrangDich = this.getAttribute("href").split("/").pop();
            const tenTrangHienTai = window.location.pathname.split("/").pop();

            if (tenTrangDich === tenTrangHienTai) {
                e.preventDefault();
                window.history.back();
            }
            // Ngược lại: để trình duyệt điều hướng đến trang đích như bình thường

        });

    });

}

// Chạy khởi động khi trang tải xong
document.addEventListener("DOMContentLoaded", loadHeaderComponent);

