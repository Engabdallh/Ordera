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
    const cycleStartedAt = currentRows[0].cycle_started_at;

    // ==========================================
    // إغلاق المطعم
    // ==========================================
    if (isOpen) {
      if (cycleStartedAt) {
        const [countRows] = await db.query(
          `SELECT COUNT(*) AS orders_count
           FROM orders
           WHERE created_at >= ?`,
          [cycleStartedAt],
        );

        const ordersCount = Number(countRows[0].orders_count);

        await db.query(
          `UPDATE restaurant_cycles
           SET ended_at = NOW(),
               orders_count = ?
           WHERE started_at = ?
             AND ended_at IS NULL`,
          [ordersCount, cycleStartedAt],
        );
      }

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

    const newCycleStartedAt = new Date();

    const [result] = await db.query(
      `UPDATE restaurant_settings
       SET is_open = 1,
           cycle_started_at = ?
       WHERE id = 1`,
      [newCycleStartedAt],
    );

    return {
      result,
      cycleId: cycleResult.insertId,
    };
  }
}

module.exports = RestaurantService;