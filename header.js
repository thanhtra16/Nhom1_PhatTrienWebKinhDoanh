// --- FILE JAVASCRIPT ĐIỀU KHIỂN HEADER DÙNG CHUNG ---

async function loadHeaderComponent() {
    try {
        const response = await fetch('../header.html');
        if (!response.ok) throw new Error('Không thể đọc file header.html');
        
        const headerHtml = await response.text();
        const container = document.getElementById('header-shared');
        
        if (container) {
            container.innerHTML = headerHtml;
            
            // 🚀 ƯU TIÊN 1: Kích hoạt đóng mở menu trước để giao diện hoạt động ngay lập tức
            kichHoatDongMoMenu();
            kichHoatNutDangKy();
            
            // 🚀 ƯU TIÊN 2: Gọi dữ liệu từ server sau (nếu server lỗi thì menu vẫn bấm mở được khung rỗng)
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
        if (!response.ok) throw new Error('Lỗi kết nối mạng đến Server 3000');
        
        const allProducts = await response.json(); 
        const megaMenuProducts = allProducts.slice(0, 6); // Lấy 6 sản phẩm đầu tiên

        let htmlMenuProducts = '';
        megaMenuProducts.forEach(m => {
            htmlMenuProducts += `
                <a href="chi-tiet.html?id=${m.id}" class="dong-chi-tiet-mon-an">
                    <img src="${m.thumbnail}" alt="${m.name}">            
                    <div class="chu-khoi-mon-an">
                        <h4>${m.name}</h4>
                        <p>${m.description.substring(0, 55)}...</p>
                    </div>
                </a>
            `;
        });
        
        const vungNapMenu = document.getElementById('vung-nap-san-pham-menu');
        if (vungNapMenu) {
            vungNapMenu.innerHTML = htmlMenuProducts;
        }
    } catch (error) {
        console.warn("⚠️ Server chưa bật, tạm thời chưa load được danh sách bánh vào Menu:", error);
    }
}

// 3. Hàm xử lý nút đăng ký nhận ưu đãi
function kichHoatNutDangKy() {
    const nutDangKy = document.getElementById("nut-dang-ky-ngay");
    if (nutDangKy) {
        nutDangKy.addEventListener("click", function() {
            window.location.href = "../dangky.html"; 
        });
    }
}

// Chạy khởi động khi trang tải xong
document.addEventListener("DOMContentLoaded", loadHeaderComponent);