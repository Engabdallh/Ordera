const express = require("express");

const router = express.Router();
const { requireRole } = require("../Middleware/auth");
router.use(requireRole("call_center"));

const {
  showTodayOrders,
  updateOrderStatus,
  showOrderDetails,
  getNewOrdersCount,
  showOrderByTrackingToken,
} = require("../Controllers/CallCenterController");

// عرض طلبات اليوم
router.get("/", showTodayOrders);

// فحص الطلبات الجديدة
router.get("/new-orders", getNewOrdersCount);

// تغيير حالة الطلب
router.post("/orders/:id/status", updateOrderStatus);

//عرض تفاصيل طلب
router.get("/orders/:id", showOrderDetails);

// =====================================================
// البحث عن طلب بواسطة رمز التتبع
// =====================================================

// =====================================================
// البحث عن طلب بواسطة رمز التتبع
// =====================================================

router.get(
  "/tracking",
  showOrderByTrackingToken,
);

module.exports = router;
