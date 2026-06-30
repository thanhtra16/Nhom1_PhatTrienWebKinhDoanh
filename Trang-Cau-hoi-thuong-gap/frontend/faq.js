document.addEventListener("DOMContentLoaded", () => {
    // 1. LẤY CÁC THÀNH PHẦN DOM DOM
    const faqContainer = document.getElementById('faq-container');
    const searchInput = document.querySelector('.search-input');
    const searchContainer = document.querySelector('.search-container');

    // Tạo ul chứa Dropdown tìm kiếm
    const dropdown = document.createElement('ul');
    dropdown.className = 'search-dropdown';
    searchContainer.appendChild(dropdown);

    // 2. GỌI DỮ LIỆU TỪ FILE faq.json
    fetch('/SweetCake/Trang-Cau-hoi-thuong-gap/dtb/faq.json')
        .then(response => response.json())
        .then(data => {
            renderFAQs(data);
            setupSearch(data);
        })
        .catch(error => console.error('Lỗi khi tải file JSON:', error));

    // 3. HÀM TỰ ĐỘNG TẠO GIAO DIỆN HTML TỪ DỮ LIỆU
    function renderFAQs(data) {
        // Chia dữ liệu làm 2 nửa để đổ vào 2 cột (Cột trái / Cột phải)
        const midIndex = Math.ceil(data.length / 2);
        const column1Data = data.slice(0, midIndex);
        const column2Data = data.slice(midIndex);

        const col1HTML = buildColumnHTML(column1Data);
        const col2HTML = buildColumnHTML(column2Data);

        // Đổ mã HTML vào khung chính
        faqContainer.innerHTML = `
            <div class="faq-column">${col1HTML}</div>
            <div class="faq-column">${col2HTML}</div>
        `;

        // Gọi hàm gắn sự kiện đóng/mở sau khi HTML đã được tạo ra
        attachAccordionEvents();
    }

    // Hàm phụ: Sinh mã HTML cho từng cột
    function buildColumnHTML(columnCategories) {
        return columnCategories.map((category, catIndex) => {
            // Thêm margin-top 40px cho các chủ đề bên dưới (từ chủ đề thứ 2 trở đi)
            const marginTop = catIndex > 0 ? 'style="margin-top: 40px;"' : '';

            const cardsHTML = category.faqs.map(faq => {
                const badge = faq.isSpecialty ? `<span class="badge-specialty">Specialty</span>` : '';
                return `
                    <div class="faq-card">
                        <div class="faq-question-header">
                            <h3 class="tieu-de-nho">${faq.question} ${badge}</h3>
                            <i class="fa-solid fa-chevron-down faq-icon-arrow"></i>
                        </div>
                        <div class="faq-answer chu-thuong">${faq.answer}</div>
                    </div>
                `;
            }).join('');

            return `
                <div class="faq-category" ${marginTop}>
                    <h2 class="tieu-de-vua faq-category-title">${category.category}</h2>
                    ${cardsHTML}
                </div>
            `;
        }).join('');
    }

    // 4. HÀM GẮN HIỆU ỨNG ACCORDION (ĐÓNG/MỞ MƯỢT MÀ)
    function attachAccordionEvents() {
        const faqCards = document.querySelectorAll('.faq-card');
        faqCards.forEach(card => {
            const header = card.querySelector('.faq-question-header');
            const answer = card.querySelector('.faq-answer');
            const icon = card.querySelector('.faq-icon-arrow');

            header.addEventListener('click', () => {
                toggleAccordion(answer, icon);
            });
        });
    }

    function toggleAccordion(answerElement, iconElement, forceOpen = false) {
        const isOpen = answerElement.classList.contains('open');

        if (isOpen && !forceOpen) {
            answerElement.style.maxHeight = '0px';
            answerElement.classList.remove('open');
            iconElement.classList.replace('fa-chevron-up', 'fa-chevron-down');
        } else if (!isOpen) {
            answerElement.classList.add('open');
            answerElement.style.maxHeight = answerElement.scrollHeight + "px";
            iconElement.classList.replace('fa-chevron-down', 'fa-chevron-up');
        }
    }

    // 5. HÀM TÌM KIẾM
    function setupSearch(data) {
        // Làm phẳng dữ liệu JSON để dễ dàng tìm kiếm
        const flatFaqs = [];
        data.forEach(cat => {
            cat.faqs.forEach(faq => {
                flatFaqs.push({
                    category: cat.category,
                    question: faq.question
                });
            });
        });

        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase().trim();
            dropdown.innerHTML = '';

            if (keyword === '') {
                dropdown.style.display = 'none';
                return;
            }

            const results = flatFaqs.filter(item =>
                item.question.toLowerCase().includes(keyword) ||
                item.category.toLowerCase().includes(keyword)
            );

            if (results.length > 0) {
                dropdown.style.display = 'block';

                results.forEach(result => {
                    const li = document.createElement('li');
                    li.className = 'search-dropdown-item';
                    li.innerHTML = `
                        <div class="search-category-label">${result.category}</div>
                        <div class="search-question-text">${result.question}</div>
                    `;

                    // Xử lý khi bấm vào kết quả tìm kiếm
                    li.addEventListener('click', () => {
                        searchInput.value = '';
                        dropdown.style.display = 'none';

                        // Quét trên giao diện HTML để tìm thẻ chứa câu hỏi tương ứng
                        const allHeaders = document.querySelectorAll('.tieu-de-nho');
                        let targetCard = null;
                        allHeaders.forEach(h => {
                            if(h.innerText.includes(result.question)) {
                                targetCard = h.closest('.faq-card');
                            }
                        });

                        // Cuộn trang và mở câu trả lời
                        if(targetCard) {
                            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            const answer = targetCard.querySelector('.faq-answer');
                            const icon = targetCard.querySelector('.faq-icon-arrow');
                            toggleAccordion(answer, icon, true);

                            // Hiệu ứng nhấp nháy highlight
                            targetCard.style.transition = 'box-shadow 0.5s ease, transform 0.3s ease';
                            targetCard.style.boxShadow = '0 0 0 3px #C68958';
                            targetCard.style.transform = 'scale(1.02)';

                            setTimeout(() => {
                                targetCard.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                                targetCard.style.transform = 'scale(1)';
                            }, 1200);
                        }
                    });

                    dropdown.appendChild(li);
                });
            } else {
                dropdown.style.display = 'block';
                dropdown.innerHTML = `<li class="search-dropdown-item"><div class="search-question-text" style="color: #7D757A;">Không tìm thấy câu hỏi phù hợp.</div></li>`;
            }
        });

        // Ẩn bảng kết quả khi click ra ngoài
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }
});