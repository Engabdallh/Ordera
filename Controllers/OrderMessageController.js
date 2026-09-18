const OrderMessageService = require("../Services/OrderMessageService");
const OrderService = require("../Services/OrderService");

const orderMessageService = new OrderMessageService();
const orderService = new OrderService();

// =====================================================
// التحقق من صلاحية المستخدم
// =====================================================

const checkUser = (req, res) => {
  if (!req.session.userId || !req.session.role) {
    res.status(401).json({
      success: false,
      message: "غير مصرح",
    });

    return false;
  }

  if (req.session.role !== "customer" && req.session.role !== "call_center") {
    res.status(403).json({
      success: false,
      message: "غير مصرح",
    });

    return false;
  }

  return true;
};

// =====================================================
// التحقق من صلاحية المستخدم للوصول إلى الطلب
// =====================================================

const checkOrderAccess = async (req, res, orderId) => {
  const order = await orderService.getOrderById(orderId);

  if (!order) {
    res.status(404).json({
      success: false,
      message: "الطلب غير موجود",
    });

    return null;
  }

  if (
    req.session.role === "customer" &&
    Number(order.customer_id) !== Number(req.session.userId)
  ) {
    res.status(403).json({
      success: false,
      message: "غير مصرح لك بمشاهدة هذا الطلب",
    });

    return null;
  }

  return order;
};

// =====================================================
// جلب رسائل طلب معين
// =====================================================

const getOrderMessages = async (req, res) => {
  try {
    if (!checkUser(req, res)) {
      return;
    }

    const orderId = Number(req.params.orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "رقم الطلب غير صحيح",
      });
    }

    const order = await checkOrderAccess(req, res, orderId);

    if (!order) {
      return;
    }

    const messages = await orderMessageService.getMessagesByOrder(orderId);

    const chatOpen = await orderMessageService.isChatOpen(orderId);

    return res.json({
      success: true,
      messages,
      chatOpen,
    });
  } catch (error) {
    console.error("GET ORDER MESSAGES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الرسائل",
    });
  }
};

// =====================================================
// إرسال رسالة
// =====================================================

const sendOrderMessage = async (req, res) => {
  try {
    if (!checkUser(req, res)) {
      return;
    }

    const orderId = Number(req.params.orderId);
    const message = req.body.message?.trim();

    if (!orderId || !message) {
      return res.status(400).json({
        success: false,
        message: "بيانات الرسالة غير صحيحة",
      });
    }

    const order = await checkOrderAccess(req, res, orderId);

    if (!order) {
      return;
    }

    // =====================================================
    // التحقق من أن المحادثة ما زالت مفتوحة
    // =====================================================

    const chatOpen = await orderMessageService.isChatOpen(orderId);

    if (!chatOpen) {
      return res.status(403).json({
        success: false,
        chatClosed: true,
        message: "انتهت مدة المحادثة لهذا الطلب",
      });
    }

    const messageId = await orderMessageService.createMessage({
      orderId,
      senderId: req.session.userId,
      senderRole: req.session.role,
      message,
    });

    return res.json({
      success: true,
      messageId,
    });
  } catch (error) {
    console.error("SEND ORDER MESSAGE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إرسال الرسالة",
    });
  }
};

module.exports = {
  getOrderMessages,
  sendOrderMessage,
};
