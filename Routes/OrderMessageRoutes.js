const express = require("express");

const router = express.Router();

const orderMessageController = require("../Controllers/OrderMessageController");

const { requireAuth } = require("../Middleware/auth");

// جميع مسارات الرسائل تحتاج تسجيل دخول
router.use(requireAuth);

// جلب رسائل طلب
router.get(
  "/orders/:orderId/messages",
  orderMessageController.getOrderMessages,
);

// إرسال رسالة
router.post(
  "/orders/:orderId/messages",
  orderMessageController.sendOrderMessage,
);

module.exports = router;