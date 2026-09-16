document.addEventListener("DOMContentLoaded", () => {
  /* ==============================
     رسالة النجاح
  =============================== */

  const successMessage = document.getElementById("successMessage");

  if (successMessage) {
    setTimeout(() => {
      successMessage.style.opacity = "0";
      successMessage.style.transform = "translateY(-10px)";

      setTimeout(() => {
        successMessage.remove();
      }, 300);
    }, 7000);
  }

  /* ==============================
     نافذة الحذف
  =============================== */

  const modal = document.getElementById("confirmModal");
  const confirmButton = document.getElementById("confirmButton");

  function confirmDelete(id) {
    modal.style.display = "flex";

    confirmButton.onclick = function () {
      const form = document.createElement("form");

      form.method = "POST";
      form.action = "/admin/products/delete/" + id;

      document.body.appendChild(form);

      form.submit();
    };
  }

  function closeModal() {
    modal.style.display = "none";
  }

  window.confirmDelete = confirmDelete;
  window.closeModal = closeModal;

  /* إغلاق عند الضغط خارج النافذة */

  window.onclick = function (event) {
    if (event.target === modal) {
      closeModal();
    }
  };

  /* إغلاق زر ESC */

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
    }
  });
});


/* ==============================
   فلتر التصنيفات
============================== */

function filterProducts(category, button) {
  const products = document.querySelectorAll(".product");

  const noResults = document.getElementById("noFilterResults");

  const countElement = document.getElementById("productsCount");

  let visibleCount = 0;

  /* إزالة active من جميع الأزرار */

  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  /* إضافة active للزر الحالي */

  button.classList.add("active");

  /* فلترة المنتجات */

  products.forEach(product => {
    const productCategory = product.dataset.category;

    if (
      category === "all" ||
      productCategory === category
    ) {
      product.style.display = "flex";

      visibleCount++;
    } else {
      product.style.display = "none";
    }
  });

  /* تحديث العدد */

  if (countElement) {
    countElement.textContent = visibleCount + " منتج";
  }

  /* إظهار رسالة إذا لا يوجد نتائج */

  if (noResults) {
    if (visibleCount === 0) {
      noResults.style.display = "block";
    } else {
      noResults.style.display = "none";
    }
  }
}