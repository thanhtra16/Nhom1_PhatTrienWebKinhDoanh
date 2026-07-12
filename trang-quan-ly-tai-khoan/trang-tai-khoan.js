// ===== THÊM MỚI: đầu file =====
const KHOA_LUU_NGUOI_DUNG = 'sweetcake_nguoi_dung';
const KHOA_LUU_ID_NGUOI_DUNG = 'sweetcake_id_nguoi_dung';

// Lấy thông tin user đã lưu lúc đăng nhập
function layThongTinNguoiDungDaLuu() {
    try {
        const raw = localStorage.getItem(KHOA_LUU_NGUOI_DUNG);
        if (!raw) return null;
        const nguoiDung = JSON.parse(raw);
        if (!nguoiDung.id && nguoiDung._id) nguoiDung.id = nguoiDung._id;
        return nguoiDung;
    } catch (err) {
        console.warn('Không đọc được thông tin người dùng đã lưu:', err);
        return null;
    }
}

// Loại bỏ field nhạy cảm (password, __v) trước khi lưu lại vào localStorage
function layThongTinAnToan(nguoiDung) {
    if (!nguoiDung) return null;
    const { password, __v, ...anToan } = nguoiDung;
    if (!anToan.id && anToan._id) anToan.id = anToan._id;
    return anToan;
}

// Đổ dữ liệu user vào sidebar + form "Thông tin tài khoản"
function hienThiThongTinNguoiDung(nguoiDung) {
    if (!nguoiDung) return;

    const oTenSidebar = document.querySelector('.acc-user-name');
    if (oTenSidebar && nguoiDung.name) oTenSidebar.textContent = nguoiDung.name;

    const oForm = document.getElementById('accForm');
    if (!oForm) return;

    const oHoTen = oForm.querySelector('input[type="text"]');
    const oSdt = oForm.querySelector('input[type="tel"]');
    const oEmail = oForm.querySelector('input[type="email"]');

    if (oHoTen) oHoTen.value = nguoiDung.name || '';
    if (oSdt) oSdt.value = nguoiDung.phone || '';
    if (oEmail) oEmail.value = nguoiDung.email || '';
}

// Kiểm tra đăng nhập + hiển thị thông tin ngay khi vào trang
function khoiTaoHienThiTaiKhoan() {
    const nguoiDung = layThongTinNguoiDungDaLuu();
    if (!nguoiDung) {
        location.href = '../dang-ky-dang-nhap/dang-nhap.html'; // chỉnh lại đường dẫn cho đúng cấu trúc thư mục của bạn
        return;
    }
    hienThiThongTinNguoiDung(nguoiDung);
}

// Xử lý nút Đăng xuất
function khoiTaoDangXuat() {
    const nutDangXuat = document.querySelector('.acc-logout');
    if (!nutDangXuat) return;

    nutDangXuat.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem(KHOA_LUU_NGUOI_DUNG);
        localStorage.removeItem(KHOA_LUU_ID_NGUOI_DUNG);
        localStorage.removeItem('token');
        location.href = '../dang-ky-dang-nhap/dang-nhap.html';
    });
}
//
document.addEventListener("DOMContentLoaded", () => {
    // Gọi các hàm khởi tạo khi trang vừa load xong
    khoiTaoHienThiTaiKhoan();   // ===== THÊM MỚI =====
    khoiTaoDangXuat();          // ===== THÊM MỚI =====
    khoiTaoChuyenTab();
    khoiTaoAnHienMatKhau();
    khoiTaoModalDiaChi();
    xuLySubmitCacForm();
    khoiTaoBoLocDonHang();
    setTimeout(() => {
        khoiTaoTabTuLocalStorage();
    }, 0);
});
// ==========================================
// 1. HÀM XỬ LÝ CHUYỂN TAB MENU BÊN TRÁI
// ==========================================
function khoiTaoChuyenTab() {
    const navLinks = document.querySelectorAll('.acc-nav-link[data-tab]');
    const tabContents = document.querySelectorAll('.acc-tab-content');
    const breadcrumbText = document.getElementById('breadcrumb-text');

    if (navLinks.length === 0) return; // Thoát nếu không có menu

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); 
            
            // Xóa bôi đậm tab cũ, bôi đậm tab mới
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Ẩn tất cả tab nội dung, hiện tab đích
            tabContents.forEach(tab => tab.style.display = 'none');
            const targetTabId = this.getAttribute('data-tab');
            const targetTab = document.getElementById(targetTabId);
            if (targetTab) targetTab.style.display = 'block';

            // Đổi text breadcrumb
            if (breadcrumbText) breadcrumbText.innerText = this.innerText;
        });
    });
}

// ==========================================
// 2. HÀM XỬ LÝ ẨN/HIỆN MẬT KHẨU (ICON CON MẮT)
// ==========================================
function khoiTaoAnHienMatKhau() {
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');

    if (togglePasswordIcons.length === 0) return;

    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (!input) return;

            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            }
        });
    });
}

// ==========================================
// 3. HÀM QUẢN LÝ ĐÓNG/MỞ MODAL THÊM ĐỊA CHỈ
// ==========================================
function khoiTaoModalDiaChi() {
    const btnOpenModal = document.getElementById("btnOpenAddressModal");
    const modalOverlay = document.getElementById("addressModalOverlay");
    const btnCancel = document.getElementById("btnCancelAddress");

    if (!modalOverlay) return;

    // Mở modal
    if (btnOpenModal) {
        btnOpenModal.addEventListener("click", () => modalOverlay.classList.add("open"));
    }

    // Đóng bằng nút Hủy
    if (btnCancel) {
        btnCancel.addEventListener("click", () => modalOverlay.classList.remove("open"));
    }

    // Đóng khi click ra vùng đen bên ngoài
    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) modalOverlay.classList.remove("open");
    });
}

// ==========================================
// 4. HÀM XỬ LÝ SỰ KIỆN SUBMIT CỦA CÁC FORM
// ==========================================
function xuLySubmitCacForm() {
    // 4.1. Form thông tin cá nhân
    // 4.1. Form thông tin cá nhân
    const accForm = document.getElementById("accForm");
    if (accForm) {
        accForm.addEventListener("submit", (e) => {
            e.preventDefault();

            // ===== THÊM MỚI: lưu lại thông tin đã sửa =====
            const nguoiDungHienTai = layThongTinNguoiDungDaLuu() || {};
            const oHoTen = accForm.querySelector('input[type="text"]');
            const oSdt = accForm.querySelector('input[type="tel"]');
            const oEmail = accForm.querySelector('input[type="email"]');

            const duLieuMoi = {
                ...nguoiDungHienTai,
                name: oHoTen ? oHoTen.value.trim() : nguoiDungHienTai.name,
                phone: oSdt ? oSdt.value.trim() : nguoiDungHienTai.phone,
                email: oEmail ? oEmail.value.trim() : nguoiDungHienTai.email,
            };

            // TODO: khi có API PUT /nguoi-dung/:id, gọi ở đây trước khi lưu localStorage
            const duLieuAnToan = layThongTinAnToan(duLieuMoi);
            localStorage.setItem(KHOA_LUU_NGUOI_DUNG, JSON.stringify(duLieuAnToan));
            hienThiThongTinNguoiDung(duLieuAnToan);
            // ===== HẾT PHẦN THÊM MỚI =====

            alert("Đã lưu thông tin tài khoản thành công!");
        });
    }

    // 4.2. Form đổi mật khẩu
    const changePasswordForm = document.getElementById("changePasswordForm");
    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Đã cập nhật mật khẩu mới thành công!");
            changePasswordForm.reset(); // Xóa trắng ô nhập sau khi lưu
        });
    }

    // 4.3. Form thêm địa chỉ (trong Modal)
    const addressForm = document.getElementById("addressForm");
    const modalOverlay = document.getElementById("addressModalOverlay");
    if (addressForm && modalOverlay) {
        addressForm.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Đã thêm địa chỉ thành công!");
            modalOverlay.classList.remove("open"); // Đóng modal
            addressForm.reset(); // Xóa form địa chỉ
        });
    }
}

// ==========================================
// 5. HÀM XỬ LÝ BỘ LỌC ĐƠN HÀNG CỦA TÔI
// ==========================================
function khoiTaoBoLocDonHang() {
    const filterBtns = document.querySelectorAll('.order-filter-btn');
    const emptyState = document.querySelector('.order-empty-state');
    const filledState = document.querySelector('.order-filled-state');
    
    // Lấy toàn bộ các dòng tr (chứa đơn hàng) trong tbody của bảng
    const orderRows = document.querySelectorAll('.order-table tbody tr'); 

    if (filterBtns.length === 0) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 1. Gỡ bỏ bôi đậm tab cũ, bôi đậm tab mới
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // 2. Lấy tên trạng thái vừa bấm (VD: "Đã giao", "Đang giao", "Tất cả")
            const selectedStatus = this.innerText.trim();
            
            // Biến đếm xem có bao nhiêu đơn hàng thỏa mãn điều kiện
            let matchCount = 0; 

            // 3. Chạy vòng lặp qua từng dòng đơn hàng trong bảng
            orderRows.forEach(row => {
                // Tìm cái nhãn trạng thái bên trong dòng hiện tại
                const statusBadge = row.querySelector('.order-status');
                if (!statusBadge) return; // Bỏ qua nếu dòng bị lỗi không có nhãn

                const rowStatus = statusBadge.innerText.trim();

                // Lọc logic: Nếu chọn "Tất cả" HOẶC trạng thái của dòng giống với nút bấm
                if (selectedStatus === 'Tất cả' || selectedStatus === rowStatus) {
                    row.style.display = ''; // Hiện dòng này lên
                    matchCount++; // Tăng biến đếm lên 1
                } else {
                    row.style.display = 'none'; // Ẩn dòng này đi
                }
            });

            // 4. Xử lý hiển thị Bảng hoặc Hộp rỗng dựa trên kết quả lọc
            if (matchCount > 0) {
                // Nếu có ít nhất 1 đơn hàng khớp -> Hiện bảng, ẩn hộp rỗng
                emptyState.style.display = 'none';
                filledState.style.display = 'block';
            } else {
                // Nếu không có đơn nào khớp -> Ẩn bảng, hiện hộp rỗng màu hồng
                emptyState.style.display = 'flex'; 
                filledState.style.display = 'none';
            }
        });
    });
}

function khoiTaoTabTuLocalStorage() {
    // Kiểm tra xem có lệnh yêu cầu mở tab nào không
    const tabCanMo = localStorage.getItem('activeTab');
    
    if (tabCanMo) {
        // Tìm nút có data-tab tương ứng
        const link = document.querySelector(`.acc-nav-link[data-tab="${tabCanMo}"]`);
        
        if (link) {
            // Giả lập cú click vào tab đó
            link.click();
        }
        
        // Xóa lệnh sau khi đã thực hiện để lần sau vào trang không bị "dính" tab cũ
        localStorage.removeItem('activeTab');
    }
}
