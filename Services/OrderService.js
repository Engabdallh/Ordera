const db = require("../Database/db");

class OrderService {
  // =====================================================
  // طلبات العميل لليوم
  // =====================================================

  async getCustomerOrders(customerId) {
    const [orders] = await db.query(
      `SELECT
          id,
          customer_id,
          guest_name,
          daily_order_number,
          total_price,
          status,
          order_type,
          created_at,
          updated_at,
          status_changed_at,
          preparation_completed_at,
          delivery_phone,
          delivery_address
       FROM orders
       WHERE customer_id = ?
         AND created_at >= NOW() - INTERVAL 24 HOUR
       ORDER BY created_at DESC`,
      [customerId],
    );

    return orders;
  }

  // =====================================================
  // منتجات طلب معين
  // =====================================================

  async getOrderItems(orderId) {
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
  // إحصائيات لوحة التحكم
  // =====================================================

  async getDashboardStats() {
    const [stats] = await db.query(
      `SELECT
          COUNT(*) AS total_orders,
          COALESCE(SUM(total_price), 0) AS total_sales,
          SUM(status = 'قيد الانتظار') AS pending_orders,
          SUM(status = 'تم التأكيد') AS confirmed_orders,
          SUM(status = 'قيد التحضير') AS preparing_orders,
          SUM(status = 'جاهز') AS ready_orders,
          SUM(status = 'تم التوصيل') AS delivered_orders,
          SUM(status = 'ملغي') AS cancelled_orders
       FROM orders
       WHERE created_at >= NOW() - INTERVAL 24 HOUR`,
    );

    return stats[0];
  }

  // =====================================================
  // آخر الطلبات في لوحة التحكم
  // =====================================================

  async getLatestOrders() {
    const [orders] = await db.query(
      `SELECT
          o.id,
          o.daily_order_number,
          o.total_price,
          o.status,
          o.order_type,
          o.created_at,
          o.customer_id,
          o.guest_name,
          COALESCE(c.name, o.guest_name) AS customer_name

       FROM orders o

       LEFT JOIN customers c
          ON o.customer_id = c.id

       ORDER BY o.created_at DESC

       LIMIT 10`,
    );

    return orders;
  }

  // =====================================================
  // جلب تفاصيل طلب معين
  // =====================================================

  async getOrderById(orderId) {
    const [orders] = await db.query(
      `SELECT
          o.id,
          o.daily_order_number,
          o.customer_id,
          o.guest_name,
          o.agent_id,

          o.subtotal,
          o.discount_amount,
          o.coupon_code,
          o.total_price,

          o.status,
          o.order_type,
          o.created_at,
          o.updated_at,
          o.status_changed_at,
          o.preparation_completed_at,
          o.delivery_phone,
          o.delivery_address,

          COALESCE(c.name, o.guest_name) AS customer_name,
          c.email AS customer_email

       FROM orders o

       LEFT JOIN customers c
          ON o.customer_id = c.id

       WHERE o.id = ?`,
      [orderId],
    );

    return orders[0] || null;
  }

  // =====================================================
  // فلترة الطلبات
  // =====================================================

  async filterOrders(filters = {}) {
    let sql = `
      SELECT
          o.id,
          o.daily_order_number,
          o.total_price,
          o.status,
          o.order_type,
          o.created_at,
          o.customer_id,
          o.guest_name,
          COALESCE(c.name, o.guest_name) AS customer_name

      FROM orders o

      LEFT JOIN customers c
          ON o.customer_id = c.id

      WHERE 1 = 1
    `;

    const params = [];

    // =========================
    // الدورة
    // =========================

    if (filters.cycle) {
      sql += `
        AND o.created_at >= (
          SELECT started_at
          FROM restaurant_cycles
          WHERE id = ?
        )
        AND o.created_at <= (
          SELECT COALESCE(ended_at, NOW())
          FROM restaurant_cycles
          WHERE id = ?
        )
      `;

      params.push(filters.cycle, filters.cycle);
    }

    // =========================
    // الحالة
    // =========================

    if (filters.status) {
      sql += ` AND o.status = ?`;

      params.push(filters.status);
    }

    // =========================
    // الشهر أو التاريخ
    // =========================

    if (filters.month) {
      sql += `
        AND DATE_FORMAT(o.created_at, '%Y-%m') = ?
      `;

      params.push(filters.month);
    } else if (filters.date) {
      sql += `
        AND DATE(o.created_at) = ?
      `;

      params.push(filters.date);
    }

    // =========================
    // من الساعة
    // =========================

    if (filters.fromTime) {
      sql += `
        AND TIME(o.created_at) >= ?
      `;

      params.push(filters.fromTime);
    }

    // =========================
    // إلى الساعة
    // =========================

    if (filters.toTime) {
      sql += `
        AND TIME(o.created_at) <= ?
      `;

      params.push(filters.toTime);
    }

    // =========================
    // الترتيب
    // =========================

    sql += `
      ORDER BY o.created_at DESC
    `;

    const [orders] = await db.query(sql, params);

    // =========================
    // الإحصائيات
    // =========================

    const totalOrders = orders.length;

    const totalSales = orders.reduce(
      (sum, order) => sum + Number(order.total_price),
      0,
    );

    return {
      orders,
      totalOrders,
      totalSales,
    };
  }

  // =====================================================
  // طلبات دورة معينة
  // =====================================================

  async getOrdersByCycle(cycleId) {
    const [orders] = await db.query(
      `SELECT
          o.id,
          o.daily_order_number,
          o.total_price,
          o.status,
          o.order_type,
          o.created_at,
          o.customer_id,
          o.guest_name,
          COALESCE(c.name, o.guest_name) AS customer_name

       FROM orders o

       LEFT JOIN customers c
          ON o.customer_id = c.id

       JOIN restaurant_cycles rc
          ON o.created_at >= rc.started_at
         AND o.created_at <= COALESCE(rc.ended_at, NOW())

       WHERE rc.id = ?

       ORDER BY o.created_at DESC`,
      [cycleId],
    );

    const totalOrders = orders.length;

    const totalSales = orders.reduce(
      (sum, order) => sum + Number(order.total_price),
      0,
    );

    return {
      orders,
      totalOrders,
      totalSales,
    };
  }

  // =====================================================
  // حذف طلب
  // =====================================================

  async deleteOrder(orderId) {
    const [result] = await db.query(
      `DELETE FROM orders
       WHERE id = ?`,
      [orderId],
    );

    return result.affectedRows > 0;
  }
}

module.exports = OrderService;