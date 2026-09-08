const db = require("../Database/db");

class RestaurantService {

    async getRestaurantStatus() {
        const [rows] = await db.query(
            `SELECT is_open
             FROM restaurant_settings
             WHERE id = 1`
        );

        return rows[0];
    }

    async toggleRestaurantStatus() {
        const [result] = await db.query(
            `UPDATE restaurant_settings
             SET is_open = NOT is_open
             WHERE id = 1`
        );

        return result;
    }
}

module.exports = RestaurantService;