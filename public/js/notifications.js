const notificationCards = document.querySelectorAll(".notification-card");
const markReadButtons = document.querySelectorAll(".mark-read-btn");

// =====================================================
// تعليم الإشعار كمقروء
// =====================================================

async function markNotificationAsRead(notificationId, card) {
  try {
    const response = await fetch(
      `/notifications/${notificationId}/read`,
      {
        method: "POST",
      },
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "حدث خطأ");
    }

    card.classList.remove("unread");
    card.classList.add("read");

    const button = card.querySelector(".mark-read-btn");

    if (button) {
      button.replaceWith(
        createReadLabel(),
      );
    }
  } catch (error) {
    console.error("MARK NOTIFICATION READ ERROR:", error);

    alert("حدث خطأ أثناء تحديث الإشعار");
  }
}

// =====================================================
// إنشاء علامة مقروء
// =====================================================

function createReadLabel() {
  const label = document.createElement("span");

  label.className = "read-label";
  label.textContent = "مقروء ✓";

  return label;
}

// =====================================================
// أحداث أزرار الإشعارات
// =====================================================

markReadButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const notificationId = button.dataset.id;
    const card = button.closest(".notification-card");

    if (!notificationId || !card) {
      return;
    }

    button.disabled = true;

    await markNotificationAsRead(
      notificationId,
      card,
    );
  });
});
// =====================================================
// فتح المحادثة وتعليم الإشعار كمقروء
// =====================================================

const openNotificationButtons = document.querySelectorAll(
  ".open-notification-btn",
);

openNotificationButtons.forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.preventDefault();

    const card = button.closest(".notification-card");
    const notificationId = card?.dataset.notificationId;
    const targetUrl = button.getAttribute("href");

    if (!notificationId || !targetUrl) {
      window.location.href = targetUrl;
      return;
    }

    try {
      await fetch(
        `/notifications/${notificationId}/read`,
        {
          method: "POST",
        },
      );
    } catch (error) {
      console.error(
        "MARK NOTIFICATION AS READ ERROR:",
        error,
      );
    }

    window.location.href = targetUrl;
  });
});
