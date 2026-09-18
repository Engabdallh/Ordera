const NotificationService = require("../Services/NotificationService");

const notificationService = new NotificationService();

// =====================================================
// التحقق من المستخدم
// =====================================================

const checkUser = (req, res) => {
  if (!req.session.userId || !req.session.role) {
    res.redirect("/login");
    return false;
  }

  if (
    req.session.role !== "customer" &&
    req.session.role !== "call_center"
  ) {
    res.status(403).send("غير مصرح");
    return false;
  }

  return true;
};

// =====================================================
// عرض صفحة الإشعارات
// =====================================================

const showNotifications = async (req, res) => {
  try {
    if (!checkUser(req, res)) {
      return;
    }

    const notifications =
      await notificationService.getNotifications(
        req.session.userId,
        req.session.role,
      );

    const unreadCount =
      await notificationService.getUnreadCount(
        req.session.userId,
        req.session.role,
      );

    res.render("notifications", {
      notifications,
      unreadCount,
      userName: req.session.userName,
      userRole: req.session.role,
    });
  } catch (error) {
    console.error("SHOW NOTIFICATIONS ERROR:", error);

    res.status(500).send("حدث خطأ أثناء تحميل الإشعارات");
  }
};

// =====================================================
// تعليم إشعار كمقروء
// =====================================================

const markNotificationAsRead = async (req, res) => {
  try {
    if (!req.session.userId || !req.session.role) {
      return res.status(401).json({
        success: false,
        message: "غير مصرح",
      });
    }

    const notificationId = Number(req.params.id);

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "رقم الإشعار غير صحيح",
      });
    }

    const updated = await notificationService.markAsRead(
      notificationId,
      req.session.userId,
      req.session.role,
    );

    return res.json({
      success: true,
      updated,
    });
  } catch (error) {
    console.error("MARK NOTIFICATION READ ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحديث الإشعار",
    });
  }
};

// =====================================================
// عدد الإشعارات غير المقروءة
// =====================================================

const getUnreadCount = async (req, res) => {
  try {
    if (!req.session.userId || !req.session.role) {
      return res.status(401).json({
        success: false,
        count: 0,
      });
    }

    const count = await notificationService.getUnreadCount(
      req.session.userId,
      req.session.role,
    );

    return res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("GET UNREAD NOTIFICATIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      count: 0,
    });
  }
};

module.exports = {
  showNotifications,
  markNotificationAsRead,
  getUnreadCount,
};