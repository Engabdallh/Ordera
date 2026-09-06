const bcrypt = require('bcrypt');
const db = require('../Database/db');

const BCRYPT_ROUNDS = 12;

class AuthService {
    async login(name, password) {
        if (!name || !password) return null;

        // Search by username first, then compare the stored password hash.
        const [admins] = await db.query(
            'SELECT * FROM admins WHERE name = ? LIMIT 1',
            [name]
        );

        if (admins.length > 0 && await bcrypt.compare(password, admins[0].password)) {
            return { user: admins[0], role: 'admin' };
        }

        const [agents] = await db.query(
            "SELECT * FROM call_center_agents WHERE name = ? AND status = 'فعال' LIMIT 1",
            [name]
        );

        if (agents.length > 0 && await bcrypt.compare(password, agents[0].password)) {
            return { user: agents[0], role: 'call_center' };
        }

        const [customers] = await db.query(
            'SELECT * FROM customers WHERE name = ? LIMIT 1',
            [name]
        );

        if (customers.length > 0 && await bcrypt.compare(password, customers[0].password)) {
            return { user: customers[0], role: 'customer' };
        }

        return null;
    }

    async findCustomerByEmail(email) {
        const [rows] = await db.query(
            'SELECT * FROM customers WHERE email = ? LIMIT 1',
            [email]
        );
        return rows[0] || null;
    }

    async createCustomer(name, phone, address, email, password) {
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        const [result] = await db.query(
            `INSERT INTO customers
                (name, phone, address, email, password)
             VALUES (?, ?, ?, ?, ?)`,
            [name, phone, address, email, hashedPassword]
        );

        return result;
    }
}

module.exports = AuthService;
