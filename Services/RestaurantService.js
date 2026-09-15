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
    `SELECT is_open
     FROM restaurant_settings
     WHERE id = 1`,
  );

  const isOpen = Boolean(currentRows[0].is_open);

  if (isOpen) {
    const [result] = await db.query(
      `UPDATE restaurant_settings
       SET is_open = 0
       WHERE id = 1`,
    );

    return result;
  }

  const [result] = await db.query(
    `UPDATE restaurant_settings
     SET is_open = 1,
         cycle_started_at = NOW()
     WHERE id = 1`,
  );

  return result;
}
}

module.exports = RestaurantService;
