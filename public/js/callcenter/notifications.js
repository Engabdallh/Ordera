const notificationsUnreadCount = document.getElementById(
  "notificationsUnreadCount",
);

// =====================================================
// جلب عدد الإشعارات غير المقروءة
// =====================================================

async function loadNotificationsUnreadCount() {
  if (!notificationsUnreadCount) {
    return;
  }

  try {
    const response = await fetch(
      "/notifications/unread-count",
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      return;
    }

    notificationsUnreadCount.textContent = data.count;

    if (data.count > 0) {
      notificationsUnreadCount.style.display = "inline-flex";
    } else {
      notificationsUnreadCount.style.display = "none";
    }
  } catch (error) {
    console.error(
      "LOAD NOTIFICATIONS COUNT ERROR:",
      error,
    );
  }
}

// =====================================================
// التشغيل الأول
// =====================================================

loadNotificationsUnreadCount();

// =====================================================
// تحديث العدد تلقائيًا
// =====================================================

setInterval(
  loadNotificationsUnreadCount,
  5000,
);