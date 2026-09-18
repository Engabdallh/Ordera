const express = require("express");

const router = express.Router();

const notificationController = require("../Controllers/NotificationController");

const { requireAuth } = require("../Middleware/auth");

router.use(requireAuth);

// صفحة الإشعارات
router.get(
  "/notifications",
  notificationController.showNotifications,
);

// تعليم إشعار كمقروء
router.post(
  "/notifications/:id/read",
  notificationController.markNotificationAsRead,
);

// عدد الإشعارات غير المقروءة
router.get(
  "/notifications/unread-count",
  notificationController.getUnreadCount,
);

module.exports = router;