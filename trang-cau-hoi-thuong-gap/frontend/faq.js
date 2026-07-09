document.addEventListener("DOMContentLoaded", () => {

    // FETCH DỮ LIỆU CÂU HỎI & LOGIC TÌM KIẾM FAQ
    const faqContainer = document.getElementById('khung-chua-faq');
    const searchInput = document.querySelector('.o-nhap-tim-kiem');
    const searchContainer = document.querySelector('.khung-tim-kiem');

    const dropdown = document.createElement('ul');
    dropdown.className = 'khung-dropdown-tim-kiem';
    if (searchContainer) searchContainer.appendChild(dropdown);

    fetch('http://localhost:3000/data/faqs')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            renderFAQs(data);
            setupSearch(data);
        })
        .catch(error => {
            console.error('Lỗi khi tải dữ liệu từ MongoDB:', error);
            if (faqContainer) {
                faqContainer.innerHTML = '<p class="chu-thuong" style="color: red;">Không thể tải dữ liệu câu hỏi thường gặp lúc này. Vui lòng thử lại sau.</p>';
            }
        });

    function renderFAQs(data) {
        if (!faqContainer) return;
        const midIndex = Math.ceil(data.length / 2);
        const column1Data = data.slice(0, midIndex);
        const column2Data = data.slice(midIndex);

        faqContainer.innerHTML = `
            <div class="cot-faq">${buildColumnHTML(column1Data)}</div>
            <div class="cot-faq">${buildColumnHTML(column2Data)}</div>
        `;

        attachAccordionEvents();
    }

    function buildColumnHTML(columnCategories) {
        return columnCategories.map((category, catIndex) => {
            const marginTop = catIndex > 0 ? 'style="margin-top: 40px;"' : '';

            const cardsHTML = category.faqs.map(faq => {
                // Tạo badge nếu là Specialty
                const badge = faq.isSpecialty ? `<span class="nhan-dac-biet">Specialty</span>` : '';
                return `
                    <div class="the-cau-hoi">
                        <div class="phan-dau-cau-hoi">
                            <span class="chu-cau-hoi-tieng-viet">${faq.question}</span>
                            <div class="nhom-ben-phai">
                                ${badge}
                                <i class="fa-solid fa-chevron-down mui-ten-cau-hoi"></i>
                            </div>
                        </div>
                        <div class="cau-tra-loi">
                            <p class="chu-thuong-faq">${faq.answer}</p>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="nhom-cau-hoi" ${marginTop}>
                    <h2 class="tieu-de-nhom-cau-hoi">${category.category}</h2>
                    ${cardsHTML}
                </div>
            `;
        }).join('');
    }

    function attachAccordionEvents() {
        const faqCards = document.querySelectorAll('.the-cau-hoi');
        faqCards.forEach(card => {
            const header = card.querySelector('.phan-dau-cau-hoi');
            const answer = card.querySelector('.cau-tra-loi');
            const icon = card.querySelector('.mui-ten-cau-hoi');

            header.addEventListener('click', () => {
                toggleAccordion(answer, icon);
            });
        });
    }

    function toggleAccordion(answerElement, iconElement, forceOpen = false) {
        const isOpen = answerElement.classList.contains('mo');

        if (isOpen && !forceOpen) {
            answerElement.style.maxHeight = '0px';
            answerElement.classList.remove('mo');
            iconElement.classList.replace('fa-chevron-up', 'fa-chevron-down');
        } else if (!isOpen) {
            answerElement.classList.add('mo');
            answerElement.style.maxHeight = answerElement.scrollHeight + "px";
            iconElement.classList.replace('fa-chevron-down', 'fa-chevron-up');
        }
    }

    function setupSearch(data) {
        if (!searchInput) return;
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
                    li.className = 'muc-dropdown-tim-kiem';
                    li.innerHTML = `
                        <div class="nhan-danh-muc-tim-kiem">${result.category}</div>
                        <div class="chu-cau-hoi-tim-kiem">${result.question}</div>
                    `;

                    li.addEventListener('click', () => {
                        searchInput.value = '';
                        dropdown.style.display = 'none';

                        const allHeaders = document.querySelectorAll('.chu-cau-hoi-tieng-viet');
                        let targetCard = null;
                        allHeaders.forEach(h => {
                            if(h.innerText.includes(result.question)) {
                                targetCard = h.closest('.the-cau-hoi');
                            }
                        });

                        if(targetCard) {
                            targetCard.scrollIntoView({ behavior: 'smooth', block: "center" });
                            setTimeout(()=>{
                                const answer = targetCard.querySelector('.cau-tra-loi');
                                const icon = targetCard.querySelector('.mui-ten-cau-hoi');
                                toggleAccordion(answer, icon, true);
                            },50)

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
                dropdown.innerHTML = `<li class="muc-dropdown-tim-kiem"><div class="chu-cau-hoi-tim-kiem" style="color: #7D757A;">Không tìm thấy câu hỏi phù hợp.</div></li>`;
            }
        });

        document.addEventListener('click', (e) => {
            if (searchContainer && !searchContainer.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    const btnToggleAll = document.getElementById('nut-dieu-khien-faq');
    
    if (btnToggleAll) {
        let isAllExpanded = false; 

        btnToggleAll.addEventListener('click', () => {
            const allCards = document.querySelectorAll('.the-cau-hoi');
            isAllExpanded = !isAllExpanded; 

            allCards.forEach(card => {
                const answer = card.querySelector('.cau-tra-loi');
                const icon = card.querySelector('.mui-ten-cau-hoi');
                
                if (!answer || !icon) return;

                if (isAllExpanded) {
                    if (!answer.classList.contains('mo')) {
                        answer.classList.add('mo');
                        answer.style.maxHeight = answer.scrollHeight + "px";
                        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
                    }
                } else {
                    if (answer.classList.contains('mo')) {
                        answer.style.maxHeight = '0px';
                        answer.classList.remove('mo');
                        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
                    }
                }
            });

            if (isAllExpanded) {
                btnToggleAll.innerHTML = `<i class="fa-solid fa-arrows-minimize"></i> Thu gọn tất cả`;
            } else {
                btnToggleAll.innerHTML = `<i class="fa-solid fa-arrows-expand"></i> Mở tất cả câu hỏi`;
            }
        });
    }
});