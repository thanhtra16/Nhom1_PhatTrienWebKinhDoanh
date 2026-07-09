document.addEventListener("DOMContentLoaded", () => {
    const cpItemsList = document.getElementById("cpItemsList");
    const grandTotalElement = document.getElementById("cpGrandTotal");
    const selectAllCheckbox = document.getElementById("cpSelectAll");

    if (!cpItemsList || !grandTotalElement) return;

    const CART_STORAGE_KEY = "sweetcake_cart"; 

    async function loadDuLieuGioHang() {
        try {
            const cartItems = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];

            if (cartItems.length === 0) {
                cpItemsList.innerHTML = '<p class="chu-thuong" style="text-align: center; padding: 40px;">Giỏ hàng của bạn đang trống.</p>';
                calculateGrandTotal();
                return;
            }

            const response = await fetch("http://localhost:3000/data/products"); 
            if (!response.ok) throw new Error("Không lấy được dữ liệu sản phẩm");
            const allProducts = await response.json();

            let html = "";

            cartItems.forEach(cartItem => {
                const sp = allProducts.find(p => String(p.id) === String(cartItem.id));
                
                if (sp) {
                    const itemTotal = sp.price * cartItem.qty;
                    const formatPrice = new Intl.NumberFormat("vi-VN").format(sp.price) + "đ";
                    const formatTotal = new Intl.NumberFormat("vi-VN").format(itemTotal) + "đ";

                    html += `
                        <div class="cp-item-row" data-id="${sp.id}" data-price="${sp.price}">
                            <div class="cp-col-check">
                                <input type="checkbox" class="cp-item-checkbox" checked>
                            </div>
                            <div class="cp-col-product-info">
                                <img src="http://localhost:3000/${sp.thumbnail}" alt="${sp.name}">
                                <div class="cp-product-name chu-thuong">${sp.name}</div>
                            </div>
                            <div class="cp-col-price cp-price-text">${formatPrice}</div>
                            <div class="cp-col-qty">
                                <div class="cp-qty-box">
                                    <button class="cp-btn-minus">-</button>
                                    <input type="text" class="cp-input-qty" value="${cartItem.qty}" readonly>
                                    <button class="cp-btn-plus">+</button>
                                </div>
                            </div>
                            <div class="cp-col-total cp-total-text item-total-price">${formatTotal}</div>
                            <div class="cp-col-action">
                                <button class="cp-btn-delete">Xoá</button>
                            </div>
                        </div>
                    `;
                }
            });

            cpItemsList.innerHTML = html;
            calculateGrandTotal();

        } catch (error) {
            console.error("Lỗi:", error);
            cpItemsList.innerHTML = "<p class='chu-thuong' style='text-align: center; padding: 40px; color: #BA1A1A;'>Lỗi kết nối máy chủ. Vui lòng thử lại.</p>";
        }
    }

    function updateCartStorage(productId, action) {
        let cartItems = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
        
        const itemIndex = cartItems.findIndex(item => String(item.id) === String(productId));
        
        if (itemIndex > -1) {
            if (action === 'increase') {
                cartItems[itemIndex].qty += 1;
            } else if (action === 'decrease' && cartItems[itemIndex].qty > 1) {
                cartItems[itemIndex].qty -= 1;
            } else if (action === 'remove') {
                cartItems.splice(itemIndex, 1); 
            }
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        }
    }

    function calculateGrandTotal() {
        let grandTotal = 0;
        const rows = document.querySelectorAll('.cp-item-row');
        let allChecked = true;
        let hasItems = rows.length > 0;

        rows.forEach(row => {
            const isChecked = row.querySelector('.cp-item-checkbox').checked;
            if (isChecked) {
                const price = parseInt(row.dataset.price);
                const qty = parseInt(row.querySelector('.cp-input-qty').value);
                grandTotal += (price * qty);
            } else {
                allChecked = false;
            }
        });

        if (selectAllCheckbox) selectAllCheckbox.checked = hasItems && allChecked;
        grandTotalElement.innerText = new Intl.NumberFormat("vi-VN").format(grandTotal) + "đ";
    }

    cpItemsList.addEventListener('click', (e) => {
        const row = e.target.closest('.cp-item-row');
        if (!row) return;

        const inputQty = row.querySelector('.cp-input-qty');
        const price = parseInt(row.dataset.price);
        const itemTotalEl = row.querySelector('.item-total-price');
        const itemId = row.dataset.id;

        if (e.target.classList.contains('cp-btn-plus')) {
            let newQty = parseInt(inputQty.value) + 1;
            inputQty.value = newQty;
            itemTotalEl.innerText = new Intl.NumberFormat("vi-VN").format(price * newQty) + "đ";
            updateCartStorage(itemId, 'increase');
            calculateGrandTotal();
        }

        if (e.target.classList.contains('cp-btn-minus')) {
            let currentQty = parseInt(inputQty.value);
            if (currentQty > 1) {
                let newQty = currentQty - 1;
                inputQty.value = newQty;
                itemTotalEl.innerText = new Intl.NumberFormat("vi-VN").format(price * newQty) + "đ";
                updateCartStorage(itemId, 'decrease');
                calculateGrandTotal();
            }
        }

        if (e.target.classList.contains('cp-btn-delete')) {
            row.remove(); 
            updateCartStorage(itemId, 'remove');
            calculateGrandTotal();
            
            if (document.querySelectorAll('.cp-item-row').length === 0) {
                cpItemsList.innerHTML = '<p class="chu-thuong" style="text-align: center; padding: 40px;">Giỏ hàng của bạn đang trống.</p>';
            }
        }

        if (e.target.classList.contains('cp-item-checkbox')) {
            calculateGrandTotal();
        }
    });

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('.cp-item-checkbox').forEach(cb => cb.checked = isChecked);
            calculateGrandTotal();
        });
    }

    loadDuLieuGioHang();
});