document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch("../header/header.html");

        if (!response.ok) {
            throw new Error("Không tải được header.html");
        }

        const html = await response.text();

        document.getElementById("header-placeholder").innerHTML = html;

        // Header đã được chèn vào trang
        await initHeader();

    } catch (err) {
        console.error(err);
    }
});