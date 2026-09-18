const db = require("../Database/db");

class NotificationService {
  async createNotification({
    recipientId,
    recipientRole,
    orderId,
    messageId,
    title,
    messagePreview,
  }) {
    const [result] = await db.query(
      `INSERT INTO notifications
       (
         recipient_id,
         recipient_role,
         order_id,
         message_id,
         title,
         message_preview
       )
       VALUES (?, ?, ?, ?, ?, ?)`,
      [recipientId, recipientRole, orderId, messageId, title, messagePreview],
    );

    return result.insertId;
  }

  async getUnreadCount(recipientId, recipientRole) {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS unreadCount
       FROM notifications
       WHERE recipient_id = ?
         AND recipient_role = ?
         AND is_read = 0`,
      [recipientId, recipientRole],
    );

    return Number(rows[0].unreadCount);
  }

  async getNotifications(recipientId, recipientRole) {
    const [notifications] = await db.query(
      `SELECT
          id,
          order_id,
          message_id,
          title,
          message_preview,
          is_read,
          created_at,
          read_at
       FROM notifications
       WHERE recipient_id = ?
         AND recipient_role = ?
       ORDER BY created_at DESC`,
      [recipientId, recipientRole],
    );

    return notifications;
  }

  // =====================================================
  // تعليم الإشعار كمقروء
  // =====================================================

  async markAsRead(notificationId, recipientId, recipientRole) {
    const [notifications] = await db.query(
      `SELECT
          message_id,
          recipient_role
       FROM notifications
       WHERE id = ?
         AND recipient_id = ?
         AND recipient_role = ?`,
      [notificationId, recipientId, recipientRole],
    );

    if (notifications.length === 0) {
      return false;
    }

    const notification = notifications[0];

    // =====================================================
    // الكول سنتر:
    // إذا قرأه موظف واحد يصبح مقروءًا عند جميع الموظفين
    // =====================================================

    if (recipientRole === "call_center") {
      const [result] = await db.query(
        `UPDATE notifications
         SET is_read = 1,
             read_at = CURRENT_TIMESTAMP
         WHERE message_id = ?
           AND recipient_role = 'call_center'
           AND is_read = 0`,
        [notification.message_id],
      );

      return result.affectedRows > 0;
    }

    // =====================================================
    // الزبون:
    // إشعاره خاص به فقط
    // =====================================================

    const [result] = await db.query(
      `UPDATE notifications
       SET is_read = 1,
           read_at = CURRENT_TIMESTAMP
       WHERE id = ?
         AND recipient_id = ?
         AND recipient_role = ?
         AND is_read = 0`,
      [notificationId, recipientId, recipientRole],
    );

    return result.affectedRows > 0;
  }
}

module.exports = NotificationService;
