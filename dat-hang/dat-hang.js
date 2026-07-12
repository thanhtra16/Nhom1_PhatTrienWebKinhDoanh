/* ==========================================================
   DAT-HANG.JS — Logic cho trang Thanh toán & Đặt lịch hẹn
   SweetCake Artisanal Bakery
   ========================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ----------------------------------------------------------
     0. TIẾP NHẬN DỮ LIỆU TỪ NÚT "MUA NGAY" TRANG CHI TIẾT
     ---------------------------------------------------------- */
  let GIO_HANG = [];

  // Trang chi tiết sản phẩm (chi-tiet-san-pham.html) lưu dữ liệu với field khác
  // (tenSanPham, hinhAnh, donGiaGoc, soLuong, tongTien, kichThuoc, cotBanh, nhanBanh,
  // mauKem, doNgot, trangTri, phuKienKemTheo, loiNhan...). Hàm dưới đây chuẩn hoá lại
  // thành đúng format mà renderGioHang()/tinhTamTinh() của trang đặt hàng cần
  // (ten_banh, hinh_anh, thong_so, don_gia, so_luong), đồng thời gộp toàn bộ tuỳ chọn
  // đã chọn (size, cốt bánh, nhân, màu kem, độ ngọt, trang trí, phụ kiện, lời nhắn)
  // thành 1 dòng mô tả để hiển thị trong tóm tắt đơn hàng.
  function chuanHoaSanPhamMuaNgay(spGoc) {
    const moTaChiTiet = [];
    if (spGoc.kichThuoc) moTaChiTiet.push(`Size ${spGoc.kichThuoc}`);
    if (spGoc.cotBanh) moTaChiTiet.push(`Cốt: ${spGoc.cotBanh}`);
    if (spGoc.nhanBanh) moTaChiTiet.push(`Nhân: ${spGoc.nhanBanh}`);
    if (spGoc.mauKem) moTaChiTiet.push(`Kem: ${spGoc.mauKem}`);
    if (spGoc.doNgot) moTaChiTiet.push(`Ngọt: ${spGoc.doNgot}`);
    if (spGoc.trangTri) moTaChiTiet.push(`Trang trí: ${spGoc.trangTri}`);
    if (Array.isArray(spGoc.phuKienKemTheo) && spGoc.phuKienKemTheo.length) {
      moTaChiTiet.push(`Phụ kiện: ${spGoc.phuKienKemTheo.join(', ')}`);
    }
    if (spGoc.loiNhan) moTaChiTiet.push(`Lời nhắn: "${spGoc.loiNhan}"`);

    const soLuong = spGoc.soLuong || 1;
    // tongTien (nếu có) đã bao gồm phụ phí size + phụ kiện, dùng để suy ra đơn giá/1 sản phẩm
    const donGia = typeof spGoc.tongTien === 'number'
      ? Math.round(spGoc.tongTien / soLuong)
      : (spGoc.donGiaGoc || 0);

    return {
      ten_banh: spGoc.tenSanPham || 'Sản phẩm',
      hinh_anh: spGoc.hinhAnh || '../assets/placeholder-cake.jpg',
      thong_so: moTaChiTiet.join(' • ') || 'Theo cấu hình mặc định',
      don_gia: donGia,
      so_luong: soLuong
    };
  }

  // Kiểm tra xem khách hàng đi từ luồng "Mua Ngay" của trang chi tiết qua hay không
  const luongThanhToan = localStorage.getItem('luong_thanh_toan');

  if (luongThanhToan === 'mua_ngay_truc_tiep') {
      const dataBanh = localStorage.getItem('san_pham_mua_ngay');
      if (dataBanh) {
          try {
            // Nạp dữ liệu chiếc bánh mua ngay, chuẩn hoá field rồi đưa vào mảng
            // để các hàm render, tính toán tự chạy tiếp
            GIO_HANG = [chuanHoaSanPhamMuaNgay(JSON.parse(dataBanh))];
          } catch (err) {
            console.error('Không đọc được dữ liệu sản phẩm mua ngay:', err);
            GIO_HANG = [];
          }
      }
  } else {
      // Luồng phụ: Lấy dữ liệu từ giỏ hàng chung (nếu có)
      const dataGioHangChung = localStorage.getItem('gio_hang_main');
      try {
        GIO_HANG = dataGioHangChung ? JSON.parse(dataGioHangChung) : [];
      } catch (err) {
        console.error('Không đọc được dữ liệu giỏ hàng chung:', err);
        GIO_HANG = [];
      }
  }

  // Chặn nếu truy cập trang đặt hàng mà không có sản phẩm nào
  if (GIO_HANG.length === 0) {
      alert("Vui lòng chọn sản phẩm từ trang chi tiết trước khi thanh toán!");
      window.location.href = '../menu/menu.html';
      return;
  }

  // Người dùng đang đăng nhập & sổ địa chỉ đã lưu (Giữ nguyên giả lập hoặc map API sau)
  const NGUOI_DUNG_DA_DANG_NHAP = true;
  const SO_DIA_CHI_DA_LUU = [
    {
      id: 'dc1',
      ho_ten: 'Nguyễn Văn A',
      so_dien_thoai: '0901 234 567',
      tinh_thanh: 'TP. Hồ Chí Minh',
      quan_huyen: 'Thủ Đức',
      dia_chi_chi_tiet: '268 Lý Thường Kiệt'
    },
    {
      id: 'dc2',
      ho_ten: 'Nguyễn Văn A',
      so_dien_thoai: '0901 234 567',
      tinh_thanh: 'TP. Hồ Chí Minh',
      quan_huyen: 'Quận 1',
      dia_chi_chi_tiet: '12 Nguyễn Huệ'
    }
  ];

  // Danh sách mã giảm giá hợp lệ (mô phỏng bảng "vouchers" trong DB)
  const MA_GIAM_GIA = {
    'SWEET10':  { loai: 'percent', gia_tri: 10, don_toi_thieu: 0 },
    'FREESHIP': { loai: 'fixed_ship', gia_tri: 30000, don_toi_thieu: 0 },
    'CAKE50K':  { loai: 'fixed', gia_tri: 50000, don_toi_thieu: 300000 }
  };

  // Khung giờ nhận bánh (mô phỏng bảng "time_slots")
  const KHUNG_GIO = [
    { id: 'ca1', nhan: '08:00 - 10:00', gio_bat_dau: 8,  so_don_da_dat: 2, so_don_toi_da: 5 },
    { id: 'ca2', nhan: '10:00 - 12:00', gio_bat_dau: 10, so_don_da_dat: 5, so_don_toi_da: 5 }, 
    { id: 'ca3', nhan: '13:00 - 15:00', gio_bat_dau: 13, so_don_da_dat: 1, so_don_toi_da: 5 },
    { id: 'ca4', nhan: '15:00 - 17:00', gio_bat_dau: 15, so_don_da_dat: 4, so_don_toi_da: 5 },
    { id: 'ca5', nhan: '17:00 - 19:00', gio_bat_dau: 17, so_don_da_dat: 0, so_don_toi_da: 5 }
  ];

  const PHI_VAN_CHUYEN_MAC_DINH = 30000;

  /* ----------------------------------------------------------
      STATE
      ---------------------------------------------------------- */
  const trangThai = {
    hinhThucNhan: 'giao-hang',   // 'giao-hang' | 'tai-cua-hang'
    khungGioDaChon: null,
    ngayDaChon: null,
    phuongThucThanhToan: 'vietqr',
    giamGia: 0,                  // số tiền được giảm hiện tại
    maGiamGiaDangApDung: null
  };

  /* ----------------------------------------------------------
      1. RENDER GIỎ HÀNG / TÓM TẮT ĐƠN HÀNG
      ---------------------------------------------------------- */
  function dinhDangTien(so) {
    return so.toLocaleString('vi-VN') + 'đ';
  }

  function renderGioHang() {
    const el = document.getElementById('danh-sach-san-pham');
    el.innerHTML = GIO_HANG.map(sp => `
      <div class="dong-san-pham">
        <img class="anh-san-pham-nho" src="${sp.hinh_anh}" alt="${sp.ten_banh}" onerror="this.onerror=null;this.src='https://placehold.co/64x64/EFE6DC/7D562D?text=%F0%9F%8E%82';">
        <div class="chi-tiet-san-pham">
          <p class="ten-sp">${sp.ten_banh}</p>
          <p class="thong-so-sp">${sp.thong_so}</p>
          <div class="dong-gia-sl">
            <span class="gia">${dinhDangTien(sp.don_gia)}</span>
            <span class="so-luong">x ${sp.so_luong}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  function tinhTamTinh() {
    return GIO_HANG.reduce((tong, sp) => tong + sp.don_gia * sp.so_luong, 0);
  }

  function tinhPhiVanChuyen() {
    return trangThai.hinhThucNhan === 'tai-cua-hang' ? 0 : PHI_VAN_CHUYEN_MAC_DINH;
  }

  function capNhatTomTat() {
    const tamTinh = tinhTamTinh();
    const phiVanChuyen = tinhPhiVanChuyen();

    let giamGia = 0;
    if (trangThai.maGiamGiaDangApDung) {
      const ma = MA_GIAM_GIA[trangThai.maGiamGiaDangApDung];
      if (ma.loai === 'percent') giamGia = Math.round(tamTinh * ma.gia_tri / 100);
      else if (ma.loai === 'fixed') giamGia = ma.gia_tri;
      else if (ma.loai === 'fixed_ship') giamGia = Math.min(ma.gia_tri, phiVanChuyen);
    }
    trangThai.giamGia = giamGia;

    const tongCong = Math.max(tamTinh + phiVanChuyen - giamGia, 0);

    document.getElementById('tt-tam-tinh').textContent = dinhDangTien(tamTinh);
    document.getElementById('tt-phi-van-chuyen').textContent = dinhDangTien(phiVanChuyen);
    document.getElementById('tt-giam-gia').textContent = '-' + dinhDangTien(giamGia);
    document.getElementById('tt-tong-cong').textContent = dinhDangTien(tongCong);

    return { tamTinh, phiVanChuyen, giamGia, tongCong };
  }

  /* ----------------------------------------------------------
      2. SỔ ĐỊA CHỈ ĐÃ LƯU
      ---------------------------------------------------------- */
  const nutSoDiaChi = document.getElementById('nut-so-dia-chi');
  const danhSachDiaChi = document.getElementById('danh-sach-dia-chi');

  if (NGUOI_DUNG_DA_DANG_NHAP) {
    danhSachDiaChi.innerHTML = SO_DIA_CHI_DA_LUU.map(dc => `
      <div class="muc-dia-chi" data-id="${dc.id}">
        <strong>${dc.ho_ten} — ${dc.so_dien_thoai}</strong>
        <span>${dc.dia_chi_chi_tiet}, ${dc.quan_huyen}, ${dc.tinh_thanh}</span>
      </div>
    `).join('');
  } else {
    nutSoDiaChi.style.display = 'none';
  }

  nutSoDiaChi.addEventListener('click', function (e) {
    e.stopPropagation();
    danhSachDiaChi.classList.toggle('mo');
  });
  document.addEventListener('click', function () {
    danhSachDiaChi.classList.remove('mo');
  });

  danhSachDiaChi.addEventListener('click', function (e) {
    const muc = e.target.closest('.muc-dia-chi');
    if (!muc) return;
    const dc = SO_DIA_CHI_DA_LUU.find(d => d.id === muc.dataset.id);
    if (!dc) return;

    document.getElementById('input-ho-ten').value = dc.ho_ten;
    document.getElementById('input-sdt').value = dc.so_dien_thoai;

    chuyenHinhThucNhan('giao-hang');
    document.getElementById('select-tinh-thanh').value = dc.tinh_thanh;
    document.getElementById('select-quan-huyen').value = dc.quan_huyen;
    document.getElementById('input-dia-chi-chi-tiet').value = dc.dia_chi_chi_tiet;

    danhSachDiaChi.classList.remove('mo');
  });

  /* ----------------------------------------------------------
      3. TAB CHUYỂN ĐỔI: GIAO HÀNG TẬN NƠI / NHẬN TẠI CỬA HÀNG
      ---------------------------------------------------------- */
  const tabHinhThuc = document.querySelectorAll('.tab-hinh-thuc');
  const khoiGiaoHang = document.getElementById('khoi-giao-hang');
  const khoiTaiCuaHang = document.getElementById('khoi-tai-cua-hang');

  function chuyenHinhThucNhan(hinhThuc) {
    trangThai.hinhThucNhan = hinhThuc;
    tabHinhThuc.forEach(t => t.classList.toggle('dang-chon', t.dataset.hinhThuc === hinhThuc));
    khoiGiaoHang.classList.toggle('hien', hinhThuc === 'giao-hang');
    khoiTaiCuaHang.classList.toggle('hien', hinhThuc === 'tai-cua-hang');
    capNhatTomTat();
  }

  tabHinhThuc.forEach(tab => {
    tab.addEventListener('click', () => chuyenHinhThucNhan(tab.dataset.hinhThuc));
  });

  /* ----------------------------------------------------------
      4. ĐẶT LỊCH HẸN — NGÀY + KHUNG GIỜ
      ---------------------------------------------------------- */
  const inputNgayNhan = document.getElementById('input-ngay-nhan');
  const ghiChuNgay = document.getElementById('ghi-chu-ngay');
  const luoiKhungGio = document.getElementById('luoi-khung-gio');

  const BAY_GIO = new Date();
  const NGUONG_24H = new Date(BAY_GIO.getTime() + 24 * 60 * 60 * 1000);

  function ngayThanhChuoiYMD(d) {
    return d.toISOString().split('T')[0];
  }

  const ngaySomNhat = ngayThanhChuoiYMD(NGUONG_24H);
  inputNgayNhan.min = ngaySomNhat;
  inputNgayNhan.value = ngaySomNhat;
  trangThai.ngayDaChon = ngaySomNhat;

  function renderKhungGio() {
    const ngayChon = new Date(trangThai.ngayDaChon + 'T00:00:00');
    const laNgayNguong = ngayThanhChuoiYMD(ngayChon) === ngayThanhChuoiYMD(NGUONG_24H);

    luoiKhungGio.innerHTML = KHUNG_GIO.map(ca => {
      const daDayCa = ca.so_don_da_dat >= ca.so_don_toi_da;
      const truocMocGio = laNgayNguong && ca.gio_bat_dau < NGUONG_24H.getHours();
      const bịKhoa = daDayCa || truocMocGio;

      return `
        <button type="button" class="nut-khung-gio" data-id="${ca.id}" ${bịKhoa ? 'disabled' : ''}>
          <span class="noi-dung-gio"><span class="cham-tron"></span>${ca.nhan}</span>
          ${daDayCa ? '<span class="nhan-day-ca">Đầy ca</span>' : ''}
        </button>
      `;
    }).join('');
  }

  inputNgayNhan.addEventListener('change', function () {
    if (this.value < ngaySomNhat) {
      this.value = ngaySomNhat;
    }
    trangThai.ngayDaChon = this.value;
    trangThai.khungGioDaChon = null;
    renderKhungGio();
  });

  luoiKhungGio.addEventListener('click', function (e) {
    const nut = e.target.closest('.nut-khung-gio');
    if (!nut || nut.disabled) return;
    luoiKhungGio.querySelectorAll('.nut-khung-gio').forEach(n => n.classList.remove('dang-chon'));
    nut.classList.add('dang-chon');
    trangThai.khungGioDaChon = nut.dataset.id;
  });

  renderKhungGio();

  /* ----------------------------------------------------------
      5. PHƯƠNG THỨC THANH TOÁN
      ---------------------------------------------------------- */
  const theThanhToan = document.querySelectorAll('.the-thanh-toan');
  theThanhToan.forEach(the => {
    the.addEventListener('click', function () {
      theThanhToan.forEach(t => t.classList.remove('dang-chon'));
      this.classList.add('dang-chon');
      this.querySelector('input[type=radio]').checked = true;
      trangThai.phuongThucThanhToan = this.dataset.pttt;
    });
  });

  /* ----------------------------------------------------------
      6. Ô NHẬP MÃ GIẢM GIÁ
      ---------------------------------------------------------- */
  const inputMaGiamGia = document.getElementById('input-ma-giam-gia');
  const nutApDungMa = document.getElementById('nut-ap-dung-ma');
  const thongBaoMa = document.getElementById('thong-bao-ma');

  nutApDungMa.addEventListener('click', function () {
    const ma = inputMaGiamGia.value.trim().toUpperCase();
    const tamTinh = tinhTamTinh();
    const thongTinMa = MA_GIAM_GIA[ma];

    if (!ma) return;

    if (!thongTinMa || tamTinh < thongTinMa.don_toi_thieu) {
      inputMaGiamGia.classList.remove('dong-nhap-lieu');
      inputMaGiamGia.classList.add('dong-nhap-lieu-loi');
      thongBaoMa.textContent = '❌ Mã giảm giá không tồn tại hoặc đã hết hạn sử dụng.';
      thongBaoMa.className = 'thong-bao-ma loi';
      trangThai.maGiamGiaDangApDung = null;
      capNhatTomTat();
      return;
    }

    inputMaGiamGia.classList.remove('dong-nhap-lieu-loi');
    inputMaGiamGia.classList.add('dong-nhap-lieu');
    inputMaGiamGia.style.borderColor = '#2E7D32';
    trangThai.maGiamGiaDangApDung = ma;

    const { giamGia } = capNhatTomTat();
    const phanTramHoacTien = thongTinMa.loai === 'percent'
      ? `${thongTinMa.gia_tri}%`
      : dinhDangTien(giamGia);
    thongBaoMa.textContent = `✓ Áp dụng thành công! Đã giảm ${phanTramHoacTien}.`;
    thongBaoMa.className = 'thong-bao-ma thanh-cong';
  });

  /* ----------------------------------------------------------
      7. VẼ MÃ VIETQR
      ---------------------------------------------------------- */
  function veMaQrGiaLap(seed) {
    const canvas = document.getElementById('qr-canvas');
    const ctx = canvas.getContext('2d');
    const kichThuocO = 9;
    const soO = 20;
    let s = seed;
    function random() { s = (s * 9301 + 49297) % 233280; return s / 233280; }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#29170D';
    for (let y = 0; y < soO; y++) {
      for (let x = 0; x < soO; x++) {
        const goDinhVi = (x < 4 && y < 4) || (x > soO - 5 && y < 4) || (x < 4 && y > soO - 5);
        if (goDinhVi || random() > 0.55) {
          ctx.fillRect(x * kichThuocO, y * kichThuocO, kichThuocO - 1, kichThuocO - 1);
        }
      }
    }
  }

  /* ----------------------------------------------------------
      8. QUẢN LÝ LỚP PHỦ (MODAL) + BỘ ĐẾM NGƯỢC
      ---------------------------------------------------------- */
  const noiDungChinh = document.getElementById('noi-dung-chinh');
  let bienDemDemNguoc = null;

  function moLopPhu(idLopPhu) {
    document.getElementById(idLopPhu).classList.add('hien');
    noiDungChinh.classList.add('mo-lop-phu');
  }
  function dongLopPhu(idLopPhu) {
    document.getElementById(idLopPhu).classList.remove('hien');
    const conLopPhuNaoMo = document.querySelectorAll('.lop-phu.hien').length > 0;
    if (!conLopPhuNaoMo) noiDungChinh.classList.remove('mo-lop-phu');
  }

  document.querySelectorAll('[data-close]').forEach(nut => {
    nut.addEventListener('click', () => dongLopPhu(nut.dataset.close));
  });

  function taoMaDonHang() {
    return 'SWCAKE-' + Math.floor(10000 + Math.random() * 90000);
  }

  function batDauDemNguoc(giay) {
    clearInterval(bienDemDemNguoc);
    let conLai = giay;
    const nhan = document.getElementById('dem-nguoc-phut');
    function capNhat() {
      const phut = Math.floor(conLai / 60);
      const giayLe = conLai % 60;
      nhan.textContent = `${phut}:${String(giayLe).padStart(2, '0')}`;
      if (conLai <= 0) {
        clearInterval(bienDemDemNguoc);
        moThatBai();
        return;
      }
      conLai--;
    }
    capNhat();
    bienDemDemNguoc = setInterval(capNhat, 1000);
  }

  function moThanhToanQr(maDonHang, tongTien) {
    document.getElementById('ma-don-hang-qr').textContent = maDonHang;
    document.getElementById('so-tien-qr').textContent = dinhDangTien(tongTien);
    veMaQrGiaLap(maDonHang.length * 97 + tongTien);
    batDauDemNguoc(600);
    moLopPhu('lop-phu-qr');
  }

  function moThanhCong() {
    clearInterval(bienDemDemNguoc);
    dongLopPhu('lop-phu-qr');
    document.getElementById('ma-don-hang-thanh-cong').textContent =
      document.getElementById('ma-don-hang-qr').textContent;
    document.getElementById('tong-tien-thanh-cong').textContent =
      document.getElementById('so-tien-qr').textContent;
    moLopPhu('lop-phu-thanh-cong');

    // DỌN DẸP BỘ NHỚ TẠM SAU KHI ĐẶT HÀNG THÀNH CÔNG
    localStorage.removeItem('san_pham_mua_ngay');
    localStorage.removeItem('luong_thanh_toan');
  }

  function moThatBai() {
    dongLopPhu('lop-phu-qr');
    moLopPhu('lop-phu-that-bai');
  }

  document.getElementById('demo-thanh-cong').addEventListener('click', moThanhCong);
  document.getElementById('demo-that-bai').addEventListener('click', moThatBai);
  document.getElementById('nut-thu-lai-qr').addEventListener('click', function () {
    dongLopPhu('lop-phu-that-bai');
    const maMoi = taoMaDonHang();
    const tongTien = capNhatTomTat().tongCong;
    moThanhToanQr(maMoi, tongTien);
  });
  document.getElementById("nut-theo-doi-don").addEventListener("click", function () {
    dongLopPhu("lop-phu-thanh-cong");
    const maDonHangHienTai = document.getElementById('ma-don-hang-thanh-cong').textContent;
    window.location.href = `../trang-lich-su-mua-hang/chi-tiet-don-hang.html?id=${encodeURIComponent(maDonHangHienTai)}`;
});
  document.querySelectorAll('.nut-sao-chep').forEach(nut => {
    nut.addEventListener('click', function () {
      const gtri = document.getElementById(this.dataset.copyTarget).textContent;
      navigator.clipboard?.writeText(gtri);
      const cu = this.textContent;
      this.textContent = '✓';
      setTimeout(() => { this.textContent = cu; }, 1200);
    });
  });

  /* ----------------------------------------------------------
      9. VALIDATE & GỬI FORM ĐẶT HÀNG LÊN BACKEND (MONGODB ATLAS)
      ---------------------------------------------------------- */
  const formThanhToan = document.getElementById('form-thanh-toan');

  function baoLoiTruong(input) {
    input.classList.remove('dong-nhap-lieu');
    input.classList.add('dong-nhap-lieu-loi');
    input.addEventListener('input', function xoaLoi() {
      input.classList.remove('dong-nhap-lieu-loi');
      input.classList.add('dong-nhap-lieu');
      input.removeEventListener('input', xoaLoi);
    });
  }

  formThanhToan.addEventListener('submit', function (e) {
    e.preventDefault();

    let hopLe = true;
    const hoTen = document.getElementById('input-ho-ten');
    const sdt = document.getElementById('input-sdt');

    if (!hoTen.value.trim()) { baoLoiTruong(hoTen); hopLe = false; }
    if (!sdt.value.trim()) { baoLoiTruong(sdt); hopLe = false; }

    if (trangThai.hinhThucNhan === 'tai-cua-hang') {
      const chiNhanh = document.getElementById('select-chi-nhanh');
      if (!chiNhanh.value) { baoLoiTruong(chiNhanh); hopLe = false; }
    } else {
      const diaChi = document.getElementById('input-dia-chi-chi-tiet');
      if (!diaChi.value.trim()) { baoLoiTruong(diaChi); hopLe = false; }
    }

    if (!trangThai.khungGioDaChon) {
      luoiKhungGio.scrollIntoView({ behavior: 'smooth', block: 'center' });
      hopLe = false;
    }

    if (!hopLe) return;

    const { tamTinh, phiVanChuyen, giamGia, tongCong } = capNhatTomTat();

const maDon = '#SC-' + new Date().toISOString().slice(5,10).replace('-','') + '-' + String(Math.floor(1000 + Math.random()*9000));

const donHang = {
    id: maDon,                                  
    date: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }),
    status: 'received',
    customer_name: hoTen.value.trim(),
    phone: sdt.value.trim(),
    email: document.getElementById('input-email').value.trim(),
    receiving_method: trangThai.hinhThucNhan,
    receiving_date: trangThai.ngayDaChon,
    time_slot_id: trangThai.khungGioDaChon,
    payment_method: trangThai.phuongThucThanhToan,
    address: trangThai.hinhThucNhan === 'giao-hang'
        ? `${document.getElementById('input-dia-chi-chi-tiet').value.trim()}, ${document.getElementById('select-quan-huyen').value}, ${document.getElementById('select-tinh-thanh').value}`
        : 'Nhận tại cửa hàng',
    items: GIO_HANG.map(sp => ({
        product_name: sp.ten_banh,
        quantity: sp.so_luong,                    // ===== SỬA: số thô, không padStart =====
        image: sp.hinh_anh,
        unit_price: sp.don_gia,                   // ===== THÊM: đơn giá thô =====
        size: sp.thong_so
    })),
    subtotal: tamTinh,                            // ===== SỬA: số thô, bỏ dinhDangTien =====
    shipping_fee: phiVanChuyen,                   // ===== SỬA =====
    discount: giamGia,                            // ===== SỬA =====
    discount_code: trangThai.maGiamGiaDangApDung,
    total_price: tongCong                         // ===== SỬA: số thô, không có "đ" =====
};
   

    // KẾT NỐI API BACKEND THỰC TẾ ĐỂ LƯU VÀO MONGODB
    const token = localStorage.getItem('token');

const headers = { 'Content-Type': 'application/json' };
if (token) {
    headers['Authorization'] = `Bearer ${token}`;
}

fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(donHang)
})
    .then(res => {
        if (!res.ok) throw new Error('Lỗi từ phía server hệ thống');
        return res.json();
    })
    .then(data => {
    console.log('🟢 Đã lưu vào MongoDB:', data);

    if (trangThai.phuongThucThanhToan === 'vietqr') {
      moThanhToanQr(donHang.id, tongCong);
    } else {
      moThanhCong();
      document.getElementById('ma-don-hang-thanh-cong').textContent = donHang.id;
      document.getElementById('tong-tien-thanh-cong').textContent = donHang.total_price;
    }
})
    .catch(err => {
        alert('❌ Có lỗi xảy ra trong quá trình lưu dữ liệu đơn hàng!');
        console.error(err);
    });
  });

  /* ----------------------------------------------------------
      KHỞI TẠO
      ---------------------------------------------------------- */
  renderGioHang();
  capNhatTomTat();
});