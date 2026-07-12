async function initHeader() {

    const nutMenu = document.getElementById("nut-kich-hoat-menu");
    const khungMenu = document.getElementById("o-chua-mega-menu");

    if (nutMenu && khungMenu) {
        nutMenu.addEventListener("click", function (e) {
            e.preventDefault();
            khungMenu.classList.toggle("dang-kich-hoat");
        });

        document.addEventListener("click", function (e) {
            if (!nutMenu.contains(e.target) && !khungMenu.contains(e.target)) {
                khungMenu.classList.remove("dang-kich-hoat");
            }
        });
    }

    try {
        const response = await fetch("http://localhost:3000/data/products");

        if (!response.ok) {
            throw new Error("Network response error");
        }

        const allProducts = await response.json();

        const megaMenuProducts = allProducts.slice(0, 6);

        let htmlMenuProducts = "";

        megaMenuProducts.forEach(m => {
            htmlMenuProducts += `
                <a href="chi-tiet.html?id=${m.id}" class="dong-chi-tiet-mon-an">
                    <img src="${m.thumbnail}" alt="${m.name}">
                    <div class="chu-khoi-mon-an">
                        <h4>${m.name}</h4>
                        <p>${m.description.substring(0,55)}...</p>
                    </div>
                </a>
            `;
        });

        document.getElementById("vung-nap-san-pham-menu").innerHTML = htmlMenuProducts;

    } catch (error) {
        console.error("Lỗi khi kết nối hoặc render dữ liệu:", error);
    }
}