// --- FILE JAVASCRIPT ĐIỀU KHIỂN FOOTER DÙNG CHUNG ---

async function loadFooterComponent() {
    try {
        // 1. Tải file footer.html từ thư mục lớn bên ngoài
        const response = await fetch('../footer.html');
        if (!response.ok) throw new Error('Không thể đọc file footer.html');
        
        const footerHtml = await response.text();
        const container = document.getElementById('footer-shared');
        
        if (container) {
            container.innerHTML = footerHtml;
            
            // 🚀 QUAN TRỌNG: HTML nạp vào trang xong xuôi mới gọi hàm gắn sự kiện nút bấm
            kichHoatLogicGuiEmail();
        }
    } catch (error) {
        console.error("Lỗi hệ thống nạp cấu trúc Footer:", error);
    }
}

// 2. Hàm gom logic kiểm tra và lắng nghe sự kiện gửi email của bạn
function kichHoatLogicGuiEmail() {
    const nutGuiEmail = document.querySelector(".newsletter-gui-email");
    const oNhapEmail = document.querySelector(".newsletter-nhap-email");

    if (!nutGuiEmail || !oNhapEmail) return;

    // Lắng nghe sự kiện click vào nút Gửi
    nutGuiEmail.addEventListener("click", function () {
        xuLyXacThucEmail(oNhapEmail);
    });

    // Thêm tính năng: Nhấn phím Enter trong ô nhập cũng kích hoạt gửi luôn cho tiện
    oNhapEmail.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            xuLyXacThucEmail(oNhapEmail);
        }
    });
}

// 3. Hàm lõi xử lý validation (Giữ nguyên 100% logic thông báo của bạn)
function xuLyXacThucEmail(oNhapEmail) {
    const emailValue = oNhapEmail.value.trim(); 

    // Kiểm tra trống
    if (emailValue === "") {
        alert("Vui lòng nhập địa chỉ email của bạn trước khi bấm gửi!");
        oNhapEmail.focus(); 
        return;
    }

    // Kiểm tra định dạng
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailValue)) {
        alert("Địa chỉ email không đúng định dạng (Ví dụ: name@gmail.com). Bạn vui lòng kiểm tra lại nhé!");
        oNhapEmail.focus();
        return;
    }

    // Thành công
    alert("🎉 Đăng ký nhận bản tin thành công! Cảm ơn bạn đã quan tâm đến tiệm bánh.");
    oNhapEmail.value = ""; 
}

// Chạy kích hoạt nạp Footer ngay khi trình duyệt sẵn sàng
document.addEventListener("DOMContentLoaded", loadFooterComponent);