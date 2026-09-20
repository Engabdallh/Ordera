const express = require("express");

const router = express.Router();

const {
  showCustomerSupport,
  createCustomerConversation,
  sendCustomerMessage,
  getCustomerMessages,
  showCallCenterSupport,
  getCallCenterConversation,
  assignConversation,
  sendAgentMessage,
  closeConversation,
  rateConversation,
  getCustomerConversation,
  getCallCenterSupportData,
  cancelConversation,
  getAdminSupportRatings,
  showAdminSupportRatings,
} = require("../Controllers/SupportController");

// =====================================================
// Customer Support
// =====================================================

// صفحة تواصل معنا
router.get("/support", showCustomerSupport);

// إنشاء / استرجاع محادثة
router.post("/api/support/conversation", createCustomerConversation);

// جلب الرسائل
router.get(
  "/api/support/conversation/:conversationId/messages",
  getCustomerMessages,
);

// إرسال رسالة
router.post(
  "/api/support/conversation/:conversationId/messages",
  sendCustomerMessage,
);

// تقييم المحادثة
router.post(
  "/api/support/conversation/:conversationId/rating",
  rateConversation,
);

// =====================================================
// Call Center Support
// =====================================================

// صفحة محادثات الدعم
router.get("/call-center/support", showCallCenterSupport);

// تفاصيل محادثة
router.get("/call-center/support/:conversationId", getCallCenterConversation);

// استلام المحادثة
router.post(
  "/api/call-center/support/:conversationId/assign",
  assignConversation,
);

// إرسال رد
router.post(
  "/api/call-center/support/:conversationId/messages",
  sendAgentMessage,
);

// إغلاق المحادثة
router.post(
  "/api/call-center/support/:conversationId/close",
  closeConversation,
);

router.get("/api/support/conversation", getCustomerConversation);

router.get("/api/call-center/support", getCallCenterSupportData);

router.post(
  "/api/support/conversation/:conversationId/cancel",
  cancelConversation,
);

// =====================================================
// Admin Support Ratings
// =====================================================

router.get("/api/admin/support/ratings", getAdminSupportRatings);

// =====================================================
// Admin Support Report
// =====================================================

router.get("/admin/support/ratings", showAdminSupportRatings);

// =====================================================
// FAQ — الأسئلة الشائعة
// =====================================================

router.get("/faq", (req, res) => {
  const isLoggedIn =
    Boolean(req.session?.userId) && req.session?.role === "customer";

  return res.render("Customer/faq", {
    isLoggedIn,
    userName: req.session?.userName || null,
  });
});

module.exports = router;
