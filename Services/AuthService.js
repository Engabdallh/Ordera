const db = require("../Database/db");


class AuthService {

    // ==============================
    // تسجيل الدخول
    // ==============================

    async login(name, password) {

        // ==============================
        // 1 - البحث عن Admin
        // ==============================

        const [admins] = await db.query(
            `
            SELECT *
            FROM admins
            WHERE name = ?
            AND password = ?
            `,
            [name, password]
        );

        if (admins.length > 0) {

            return {
                user: admins[0],
                role: "admin"
            };

        }


        // ==============================
        // 2 - البحث عن Call Center
        // ==============================

        const [agents] = await db.query(
            `
            SELECT *
            FROM call_center_agents
            WHERE name = ?
            AND password = ?
            AND status = 'فعال'
            `,
            [name, password]
        );

        if (agents.length > 0) {

            return {
                user: agents[0],
                role: "call_center"
            };

        }


        // ==============================
        // 3 - البحث عن Customer
        // ==============================

        const [customers] = await db.query(
            `
            SELECT *
            FROM customers
            WHERE name = ?
            AND password = ?
            `,
            [name, password]
        );

        if (customers.length > 0) {

            return {
                user: customers[0],
                role: "customer"
            };

        }


        // ==============================
        // الحساب غير موجود
        // ==============================

        return null;

    }


    // ==============================
    // البحث عن Customer بالإيميل
    // ==============================

    async findCustomerByEmail(email) {

        const [rows] = await db.query(
            `
            SELECT *
            FROM customers
            WHERE email = ?
            `,
            [email]
        );

        return rows[0] || null;

    }


    // ==============================
    // إنشاء Customer
    // ==============================

    async createCustomer(
        name,
        phone,
        address,
        email,
        password
    ) {

        const [result] = await db.query(
            `
            INSERT INTO customers
            (
                name,
                phone,
                address,
                email,
                password
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                name,
                phone,
                address,
                email,
                password
            ]
        );

        return result;

    }

}


module.exports = AuthService;