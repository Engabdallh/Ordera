const db = require("../Database/db");

class CallCenterService {
  // =====================================================
  // طلبات اليوم للكول سنتر
  // =====================================================

  async getTodayOrdersForCallCenter({
    search = "",
    status = "",
    page = 1,
    limit = 20,
  } = {}) {
    const offset = (page - 1) * limit;

    let sql = `
    SELECT
      o.id,
      o.customer_id,
      o.total_price,
      o.status,
      o.order_type,
      o.delivery_phone,
      o.delivery_address,
      o.created_at,
      o.updated_at,
      o.status_changed_at,
      o.preparation_completed_at,

      c.name AS customer_name

    FROM orders o

    JOIN customers c
      ON o.customer_id = c.id

    WHERE 1
  `;

    const params = [];

    // البحث برقم الطلب أو رقم الهاتف
    if (search) {
      sql += `
    AND (
      CAST(o.id AS CHAR) = ?
      OR o.delivery_phone = ?
    )
  `;

      params.push(search, search);
    }

    // فلترة الحالة
    if (status) {
      sql += `
      AND o.status = ?
    `;

      params.push(status);
    }

    sql += `
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `;

    params.push(limit, offset);

    const [orders] = await db.query(sql, params);

    return orders;
  }
  // =====================================================
  // منتجات طلب معين للكول سنتر
  // =====================================================

  async getOrderItemsForCallCenter(orderId) {
    const [items] = await db.query(
      `SELECT
                oi.id,
                oi.product_id,
                oi.quantity,
                oi.price,
                p.name,
                p.image

             FROM order_items oi

             JOIN products p
                ON oi.product_id = p.id

             WHERE oi.order_id = ?`,
      [orderId],
    );

    return items;
  }

  // =====================================================
  // تغيير حالة الطلب
  // =====================================================

  async updateOrderStatus(orderId, newStatus) {
    const allowedStatuses = [
      "قيد الانتظار",
      "تم التأكيد",
      "قيد التحضير",
      "جاهز",
      "تم التوصيل",
      "ملغي",
    ];

    // التحقق من الحالة الجديدة
    if (!allowedStatuses.includes(newStatus)) {
      throw new Error("حالة الطلب غير صحيحة");
    }

    // جلب الحالة الحالية للطلب
    const [orders] = await db.query(
      `SELECT id, status
         FROM orders
         WHERE id = ?`,
      [orderId],
    );

    if (orders.length === 0) {
      throw new Error("الطلب غير موجود");
    }

    const currentStatus = orders[0].status;

    // إذا كانت نفس الحالة
    if (currentStatus === newStatus) {
      throw new Error("الطلب موجود بالفعل بهذه الحالة");
    }

    // =================================================
    // الحالات المسموحة للانتقال
    // =================================================

    const allowedTransitions = {
      "قيد الانتظار": ["تم التأكيد", "ملغي"],
      "تم التأكيد": ["قيد التحضير", "ملغي"],
      "قيد التحضير": ["جاهز", "ملغي"],
      جاهز: ["تم التوصيل"],
      "تم التوصيل": [],
      ملغي: [],
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(
        `His situation cannot be changed."${currentStatus}" to "${newStatus}"`,
      );
    }

    // =================================================
    // تم التأكيد
    // يبدأ وقت التحضير
    // =================================================

    if (newStatus === "تم التأكيد") {
      const [result] = await db.query(
        `UPDATE orders
             SET
                status = ?,
                status_changed_at = NOW(),
                preparation_completed_at = NULL,
                updated_at = NOW()
             WHERE id = ?`,
        [newStatus, orderId],
      );

      return result;
    }

    // =================================================
    // قيد التحضير
    // =================================================

    if (newStatus === "قيد التحضير") {
      const [result] = await db.query(
        `UPDATE orders
             SET
                status = ?,
                updated_at = NOW()
             WHERE id = ?`,
        [newStatus, orderId],
      );

      return result;
    }

    // =================================================
    // جاهز
    // يسجل وقت انتهاء التحضير
    // =================================================

    if (newStatus === "جاهز") {
      const [result] = await db.query(
        `UPDATE orders
             SET
                status = ?,
                preparation_completed_at = NOW(),
                updated_at = NOW()
             WHERE id = ?`,
        [newStatus, orderId],
      );

      return result;
    }

    // =================================================
    // تم التوصيل
    // =================================================

    if (newStatus === "تم التوصيل") {
      const [result] = await db.query(
        `UPDATE orders
             SET
                status = ?,
                updated_at = NOW()
             WHERE id = ?`,
        [newStatus, orderId],
      );

      return result;
    }

    // =================================================
    // ملغي
    // =================================================

    if (newStatus === "ملغي") {
      const [result] = await db.query(
        `UPDATE orders
             SET
                status = ?,
                updated_at = NOW()
             WHERE id = ?`,
        [newStatus, orderId],
      );

      return result;
    }
  }

  async getOrdersCountForCallCenter({ search = "", status = "" } = {}) {
    let sql = `
    SELECT COUNT(*) AS total
    FROM orders o
    JOIN customers c
      ON o.customer_id = c.id
    WHERE 1
  `;

    const params = [];

    if (search) {
      sql += `
      AND (
        CAST(o.id AS CHAR) = ?
        OR o.delivery_phone = ?
      )
    `;

      params.push(search, search);
    }

    if (status) {
      sql += `
      AND o.status = ?
    `;

      params.push(status);
    }

    const [rows] = await db.query(sql, params);

    return rows[0].total;
  }

  async getNewOrdersCount() {
  const [rows] = await db.query(`
    SELECT id
    FROM orders
    WHERE status = 'قيد الانتظار'
    ORDER BY created_at DESC
  `);

  return {
    count: rows.length,
    orderIds: rows.map((order) => order.id),
    latestOrderId: rows.length > 0 ? rows[0].id : null,
  };
}
}

// =====================================================
// Export
// =====================================================

module.exports = CallCenterService;
