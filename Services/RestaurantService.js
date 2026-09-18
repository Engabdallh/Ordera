const db = require("../Database/db");

class RestaurantService {
  async getRestaurantStatus() {
    const [rows] = await db.query(
      `SELECT is_open
       FROM restaurant_settings
       WHERE id = 1`,
    );

    return rows[0];
  }

  // =====================================================
  // فتح وإغلاق المطعم وإدارة الدورات
  // =====================================================

  async toggleRestaurantStatus() {
    const [currentRows] = await db.query(
      `SELECT is_open, cycle_started_at
     FROM restaurant_settings
     WHERE id = 1`,
    );

    if (currentRows.length === 0) {
      throw new Error("إعدادات المطعم غير موجودة");
    }

    const isOpen = Boolean(currentRows[0].is_open);

    // ==========================================
    // إغلاق المطعم
    // ==========================================

    if (isOpen) {
      // جلب آخر دورة مفتوحة
      const [cycleRows] = await db.query(
        `SELECT id, started_at
       FROM restaurant_cycles
       WHERE ended_at IS NULL
       ORDER BY id DESC
       LIMIT 1`,
      );

      if (cycleRows.length > 0) {
        const activeCycle = cycleRows[0];

        // حساب عدد الطلبات داخل الدورة
        const [countRows] = await db.query(
          `SELECT COUNT(*) AS orders_count
         FROM orders
         WHERE created_at >= ?`,
          [activeCycle.started_at],
        );

        const ordersCount = Number(countRows[0].orders_count);

        // إغلاق الدورة
        await db.query(
          `UPDATE restaurant_cycles
         SET ended_at = NOW(),
             orders_count = ?
         WHERE id = ?`,
          [ordersCount, activeCycle.id],
        );
      }

      // إغلاق المطعم
      const [result] = await db.query(
        `UPDATE restaurant_settings
       SET is_open = 0
       WHERE id = 1`,
      );

      return result;
    }

    // ==========================================
    // فتح المطعم - دورة جديدة
    // ==========================================

    const [cycleResult] = await db.query(
      `INSERT INTO restaurant_cycles
     (started_at, orders_count)
     VALUES (NOW(), 0)`,
    );

    const [result] = await db.query(
      `UPDATE restaurant_settings
     SET is_open = 1,
         cycle_started_at = NOW()
     WHERE id = 1`,
    );

    return {
      result,
      cycleId: cycleResult.insertId,
    };
  }
  async getCycles() {
    const [cycles] = await db.query(
      `SELECT
          id,
          started_at,
          ended_at,
          orders_count
       FROM restaurant_cycles
       ORDER BY id DESC`,
    );

    return cycles;
  }

  // =====================================================
  // حذف دورة
  // =====================================================

  async deleteCycle(cycleId) {
    const [rows] = await db.query(
      `SELECT id, ended_at
       FROM restaurant_cycles
       WHERE id = ?`,
      [cycleId],
    );

    if (rows.length === 0) {
      return {
        success: false,
        reason: "not-found",
      };
    }

    // لا يمكن حذف الدورة المفتوحة
    if (!rows[0].ended_at) {
      return {
        success: false,
        reason: "active",
      };
    }

    const [result] = await db.query(
      `DELETE FROM restaurant_cycles
       WHERE id = ?`,
      [cycleId],
    );

    return {
      success: result.affectedRows > 0,
      reason: result.affectedRows > 0 ? null : "not-found",
    };
  }
}

module.exports = RestaurantService;
