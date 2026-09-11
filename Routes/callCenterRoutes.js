const express = require("express");

const router = express.Router();
const { requireRole } = require("../Middleware/auth");
router.use(requireRole("call_center"));

const {
  showTodayOrders,
  updateOrderStatus,
  showOrderDetails,
  getNewOrdersCount,
} = require("../Controllers/CallCenterController");

// عرض طلبات اليوم
router.get("/", showTodayOrders);

// فحص الطلبات الجديدة
router.get("/new-orders", getNewOrdersCount);

// تغيير حالة الطلب
router.post("/orders/:id/status", updateOrderStatus);

//عرض تفاصيل طلب
router.get("/orders/:id", showOrderDetails);

module.exports = router;
