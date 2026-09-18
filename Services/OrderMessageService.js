const db = require("../Database/db");

class OrderMessageService {
  // =====================================================
  // إنشاء رسالة جديدة وإرسال إشعار للطرف الآخر
  // =====================================================

  async createMessage({
    orderId,
    senderId,
    senderRole,
    message,
  }) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // ==========================================
      // التأكد من الطلب ومعرفة الزبون
      // ==========================================

      const [orders] = await connection.query(
        `SELECT customer_id
         FROM orders
         WHERE id = ?`,
        [orderId],
      );

      if (orders.length === 0) {
        throw new Error("الطلب غير موجود");
      }

      const customerId = orders[0].customer_id;

      // ==========================================
      // إضافة الرسالة
      // ==========================================

      const [messageResult] = await connection.query(
        `INSERT INTO order_messages
         (
           order_id,
           sender_id,
           sender_role,
           message
         )
         VALUES (?, ?, ?, ?)`,
        [orderId, senderId, senderRole, message],
      );

      const messageId = messageResult.insertId;

      // ==========================================
      // إشعار الكول سنتر
      // ==========================================

      if (senderRole === "customer") {
        const [agents] = await connection.query(
          `SELECT id
           FROM call_center_agents
           WHERE status = 'فعال'`,
        );

        for (const agent of agents) {
          await connection.query(
            `INSERT INTO notifications
             (
               recipient_id,
               recipient_role,
               order_id,
               message_id,
               title,
               message_preview
             )
             VALUES (?, 'call_center', ?, ?, ?, ?)`,
            [
              agent.id,
              orderId,
              messageId,
              "رسالة جديدة من زبون",
              message,
            ],
          );
        }
      }

      // ==========================================
      // إشعار الزبون
      // ==========================================

      if (senderRole === "call_center") {
        await connection.query(
          `INSERT INTO notifications
           (
             recipient_id,
             recipient_role,
             order_id,
             message_id,
             title,
             message_preview
           )
           VALUES (?, 'customer', ?, ?, ?, ?)`,
          [
            customerId,
            orderId,
            messageId,
            "رسالة جديدة من الكول سنتر",
            message,
          ],
        );
      }

      await connection.commit();

      return messageId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // =====================================================
  // جلب جميع رسائل طلب معين
  // =====================================================

  async getMessagesByOrder(orderId) {
    const [messages] = await db.query(
      `SELECT
          om.id,
          om.order_id,
          om.sender_id,
          om.sender_role,
          om.message,
          om.created_at,
          CASE
            WHEN om.sender_role = 'customer' THEN c.name
            WHEN om.sender_role = 'call_center' THEN a.name
          END AS sender_name
       FROM order_messages om
       LEFT JOIN customers c
          ON om.sender_role = 'customer'
         AND om.sender_id = c.id
       LEFT JOIN call_center_agents a
          ON om.sender_role = 'call_center'
         AND om.sender_id = a.id
       WHERE om.order_id = ?
       ORDER BY om.created_at ASC`,
      [orderId],
    );

    return messages;
  }
    // =====================================================
  // التحقق من أن محادثة الطلب ما زالت مفتوحة
  // =====================================================

  // =====================================================
// التحقق من أن محادثة الطلب ما زالت مفتوحة
// =====================================================

async isChatOpen(orderId) {
  const [rows] = await db.query(
    `SELECT
        status,
        status_changed_at
     FROM orders
     WHERE id = ?`,
    [orderId],
  );

  if (rows.length === 0) {
    return false;
  }

  const order = rows[0];

  // قبل التوصيل: المحادثة مفتوحة
  if (order.status !== "تم التوصيل") {
    return true;
  }

  // بعد التوصيل يجب أن يكون وقت تغيير الحالة موجودًا
  if (!order.status_changed_at) {
    return false;
  }

  const deliveredAt = new Date(order.status_changed_at);
  const now = new Date();

  const oneHour = 60 * 60 * 1000;

  return (
    now.getTime() - deliveredAt.getTime() < oneHour
  );
}
}

module.exports = OrderMessageService;