const SupportService = require("../Services/SupportService");

const supportService = new SupportService();

// =====================================================
// صفحة تواصل معنا للزبون
// =====================================================

const showCustomerSupport = async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.role !== "customer") {
      return res.redirect("/login");
    }

    const conversation = await supportService.getCustomerConversation(
      req.session.userId,
    );

    let messages = [];

    if (conversation) {
      messages = await supportService.getMessages(conversation.id);
    }

    return res.render("Customer/support", {
      conversation,
      messages,
      userName: req.session.userName,
    });
  } catch (error) {
    console.error("SHOW CUSTOMER SUPPORT ERROR:", error);

    return res.status(500).send("حدث خطأ أثناء تحميل المحادثة");
  }
};

// =====================================================
// إنشاء محادثة للزبون
// =====================================================

const createCustomerConversation = async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.role !== "customer") {
      return res.status(401).json({
        success: false,
        message: "يجب تسجيل الدخول",
      });
    }

    const conversation = await supportService.getOrCreateConversation(
      req.session.userId,
    );

    return res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("CREATE CUSTOMER SUPPORT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إنشاء المحادثة",
    });
  }
};

// =====================================================
// إرسال رسالة من الزبون
// =====================================================

const sendCustomerMessage = async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.role !== "customer") {
      return res.status(401).json({
        success: false,
        message: "يجب تسجيل الدخول",
      });
    }

    const conversationId = Number(req.params.conversationId);

    const message = String(req.body.message || "").trim();

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "رقم المحادثة غير صحيح",
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "اكتب رسالة أولًا",
      });
    }

    const result = await supportService.sendCustomerMessage(
      conversationId,
      req.session.userId,
      message,
    );

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("SEND CUSTOMER SUPPORT MESSAGE ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "تعذر إرسال الرسالة",
    });
  }
};

// =====================================================
// جلب رسائل الزبون
// =====================================================

const getCustomerMessages = async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.role !== "customer") {
      return res.status(401).json({
        success: false,
        message: "يجب تسجيل الدخول",
      });
    }

    const conversationId = Number(req.params.conversationId);

    const conversation = await supportService.verifyCustomerConversation(
      conversationId,
      req.session.userId,
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "المحادثة غير موجودة",
      });
    }

    const messages = await supportService.getMessages(conversationId);

    return res.json({
      success: true,
      conversation,
      messages,
    });
  } catch (error) {
    console.error("GET CUSTOMER SUPPORT MESSAGES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحميل الرسائل",
    });
  }
};

// =====================================================
// صفحة الدعم للكول سنتر
// =====================================================

const showCallCenterSupport = async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.role !== "call_center") {
      return res.redirect("/login");
    }

    const conversations = await supportService.getConversationsForCallCenter();

    return res.render("CallCenter/support", {
      conversations,
      userName: req.session.userName,
    });
  } catch (error) {
    console.error("SHOW CALL CENTER SUPPORT ERROR:", error);

    return res.status(500).send("حدث خطأ أثناء تحميل محادثات الدعم");
  }
};

// =====================================================
// تفاصيل محادثة للكول سنتر
// =====================================================

const getCallCenterConversation = async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.role !== "call_center") {
      return res.status(401).json({
        success: false,
        message: "غير مصرح",
      });
    }

    const conversationId = Number(req.params.conversationId);

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "رقم المحادثة غير صحيح",
      });
    }

    const conversation =
      await supportService.getConversationForCallCenter(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "المحادثة غير موجودة",
      });
    }

    const messages = await supportService.getMessages(conversationId);

    return res.json({
      success: true,
      conversation,
      messages,
    });
  } catch (error) {
    console.error("GET CALL CENTER SUPPORT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحميل المحادثة",
    });
  }
};

// =====================================================
// استلام المحادثة من موظف الكول سنتر
// =====================================================

const assignConversation = async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.role !== "call_center") {
      return res.status(401).json({
        success: false,
        message: "غير مصرح",
      });
    }

    const conversationId = Number(req.params.conversationId);

    await supportService.assignConversation(conversationId, req.session.userId);

    return res.json({
      success: true,
      message: "تم استلام المحادثة",
    });
  } catch (error) {
    console.error("ASSIGN SUPPORT CONVERSATION ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "تعذر استلام المحادثة",
    });
  }
};

// =====================================================
// إرسال رسالة من الكول سنتر
// =====================================================

const sendAgentMessage = async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.role !== "call_center") {
      return res.status(401).json({
        success: false,
        message: "غير مصرح",
      });
    }

    const conversationId = Number(req.params.conversationId);

    const message = String(req.body.message || "").trim();

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "رقم المحادثة غير صحيح",
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "اكتب رسالة أولًا",
      });
    }

    const result = await supportService.sendAgentMessage(
      conversationId,
      req.session.userId,
      message,
    );

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("SEND AGENT SUPPORT MESSAGE ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "تعذر إرسال الرسالة",
    });
  }
};

// =====================================================
// إغلاق المحادثة
// =====================================================

const closeConversation = async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.role !== "call_center") {
      return res.status(401).json({
        success: false,
        message: "غير مصرح",
      });
    }

    const conversationId = Number(req.params.conversationId);

    await supportService.closeConversation(conversationId, req.session.userId);

    return res.json({
      success: true,
      message: "تم إغلاق المحادثة",
    });
  } catch (error) {
    console.error("CLOSE SUPPORT CONVERSATION ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "تعذر إغلاق المحادثة",
    });
  }
};

// =========================================
// CANCEL CUSTOMER CONVERSATION
// =========================================
const cancelConversation = async (req, res) => {
  try {
    if (!req.session.userId || req.session.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بهذا الإجراء",
      });
    }

    const conversationId = Number(req.params.conversationId);

    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "رقم المحادثة غير صالح",
      });
    }

    await supportService.cancelConversation(conversationId, req.session.userId);

    return res.json({
      success: true,
      message: "تم إلغاء المحادثة بنجاح",
    });
  } catch (error) {
    console.error("CANCEL CUSTOMER SUPPORT ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "تعذر إلغاء المحادثة",
    });
  }
};

// =========================================
// ADMIN SUPPORT REPORT PAGE
// صفحة تقرير أداء موظف الدعم
// =========================================
const showAdminSupportRatings = async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.role !== "admin") {
      return res.redirect("/login");
    }

    return res.render("Admin/support-ratings", {
      userName: req.session.userName,
    });
  } catch (error) {
    console.error("SHOW ADMIN SUPPORT RATINGS ERROR:", error);

    return res.status(500).send("حدث خطأ أثناء تحميل تقرير الدعم");
  }
};
// =========================================
// GET ADMIN SUPPORT EMPLOYEE REPORT
// تقرير أداء موظف الدعم للمدير
// =========================================
const getAdminSupportRatings = async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بهذا الإجراء",
      });
    }

    const employeeName = String(req.query.employeeName || "").trim();

    if (!employeeName) {
      return res.status(400).json({
        success: false,
        message: "يرجى إدخال اسم الموظف",
      });
    }

    const report = await supportService.getAdminSupportRatings(employeeName);

    return res.json({
      success: true,
      ...report,
    });
  } catch (error) {
    console.error("GET ADMIN SUPPORT EMPLOYEE REPORT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "تعذر تحميل تقرير الموظف",
    });
  }
};

// =====================================================
// تقييم المحادثة
// =====================================================

const rateConversation = async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.role !== "customer") {
      return res.status(401).json({
        success: false,
        message: "يجب تسجيل الدخول",
      });
    }

    const conversationId = Number(req.params.conversationId);

    const rating = Number(req.body.rating);

    const comment = String(req.body.comment || "").trim();

    await supportService.rateConversation(
      conversationId,
      req.session.userId,
      rating,
      comment,
    );

    return res.json({
      success: true,
      message: "شكرًا لتقييمك ❤️",
    });
  } catch (error) {
    console.error("RATE SUPPORT CONVERSATION ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "تعذر حفظ التقييم",
    });
  }
};
// =====================================================
// التحقق من وجود محادثة سابقة للزبون بدون إنشاء محادثة
// =====================================================

const getCustomerConversation = async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.role !== "customer") {
      return res.status(401).json({
        success: false,
        message: "يجب تسجيل الدخول",
      });
    }

    const conversation = await supportService.getCustomerConversation(
      req.session.userId,
    );

    return res.json({
      success: true,
      conversation: conversation || null,
    });
  } catch (error) {
    console.error("GET CUSTOMER SUPPORT CONVERSATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحميل المحادثة",
    });
  }
};

// =====================================================
// تحديث محادثات الدعم للكول سنتر
// =====================================================

const getCallCenterSupportData = async (req, res) => {
  try {
    if (!req.session?.userId || req.session?.role !== "call_center") {
      return res.status(401).json({
        success: false,
        message: "غير مصرح",
      });
    }

    const conversations = await supportService.getConversationsForCallCenter({
      page: 1,
      limit: 100,
    });

    const stats = await supportService.getSupportStats();

    return res.json({
      success: true,
      conversations,
      stats,
    });
  } catch (error) {
    console.error("GET CALL CENTER SUPPORT DATA ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحديث محادثات الدعم",
    });
  }
};

module.exports = {
  showCustomerSupport,
  createCustomerConversation,
  sendCustomerMessage,
  getCustomerMessages,
  showCallCenterSupport,
  getCallCenterConversation,
  assignConversation,
  sendAgentMessage,
  closeConversation,
  getCustomerConversation,
  cancelConversation,
  rateConversation,
  getCallCenterSupportData,
  getAdminSupportRatings,
  showAdminSupportRatings,
};
