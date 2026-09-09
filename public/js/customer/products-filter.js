document.addEventListener("DOMContentLoaded", function () {
  const categoryButtons = document.querySelectorAll(".category-btn");

  const productCards = document.querySelectorAll(".product-card");

  categoryButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const selectedCategory = this.dataset.category;

      // إزالة active من جميع الأزرار
      categoryButtons.forEach((btn) => {
        btn.classList.remove("active");
      });

      // تفعيل الزر المضغوط
      this.classList.add("active");

      // فلترة المنتجات
      productCards.forEach((product) => {
        const productCategory = product.dataset.category || "";

        if (
          selectedCategory === "all" ||
          productCategory === selectedCategory
        ) {
          product.style.display = "flex";
        } else {
          product.style.display = "none";
        }
      });
    });
  });
});
