const express = require("express");

const router = express.Router();
const { requireRole } = require("../Middleware/auth");
router.use(requireRole("call_center"));

const {
  showTodayOrders,
  updateOrderStatus,
  showOrderDetails,
} = require("../Controllers/CallCenterController");

// عرض طلبات اليوم
router.get("/", showTodayOrders);

// تغيير حالة الطلب
router.post("/orders/:id/status", updateOrderStatus);

router.get("/orders/:id", showOrderDetails);

module.exports = router;
