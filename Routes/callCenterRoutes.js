const express = require("express");

const router = express.Router();

const {
    showTodayOrders,
    updateOrderStatus
} = require("../Controllers/CallCenterController");


// عرض طلبات اليوم
router.get(
    "/",
    showTodayOrders
);


// تغيير حالة الطلب
router.post(
    "/orders/:id/status",
    updateOrderStatus
);


module.exports = router;