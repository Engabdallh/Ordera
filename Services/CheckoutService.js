const db = require('../Database/db');

class CheckoutService {
    async createOrder({ customerId, phone, address, cart }) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Never trust prices stored in the session. Re-read products from DB.
            const productIds = [...new Set(
                cart.map(item => Number(item.productId)).filter(Number.isInteger)
            )];

            if (productIds.length === 0) {
                throw new Error('السلة غير صالحة');
            }

            const placeholders = productIds.map(() => '?').join(',');
            const [products] = await connection.query(
                `SELECT id, name, price, image
                 FROM products
                 WHERE id IN (${placeholders})`,
                productIds
            );

            const productMap = new Map(products.map(product => [Number(product.id), product]));
            let totalPrice = 0;
            const normalizedItems = [];

            for (const item of cart) {
                const productId = Number(item.productId);
                const quantity = Number(item.quantity);
                const product = productMap.get(productId);

                if (!product) {
                    throw new Error(`المنتج رقم ${productId} غير موجود`);
                }

                if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
                    throw new Error('كمية المنتج غير صحيحة');
                }

                const price = Number(product.price);
                if (!Number.isFinite(price) || price < 0) {
                    throw new Error('سعر المنتج غير صالح');
                }

                totalPrice += price * quantity;
                normalizedItems.push({ productId, quantity, price });
            }

            await connection.query(
                `UPDATE customers
                 SET phone = ?, address = ?
                 WHERE id = ?`,
                [phone, address, customerId]
            );

            const [orderResult] = await connection.query(
                `INSERT INTO orders
                    (customer_id, total_price, status, order_type, delivery_phone, delivery_address)
                 VALUES (?, ?, 'قيد الانتظار', 'الموقع', ?, ?)`,
                [customerId, totalPrice.toFixed(2), phone, address]
            );

            const orderId = orderResult.insertId;

            for (const item of normalizedItems) {
                await connection.query(
                    `INSERT INTO order_items
                        (order_id, product_id, quantity, price)
                     VALUES (?, ?, ?, ?)`,
                    [orderId, item.productId, item.quantity, item.price]
                );
            }

            await connection.commit();

            return { orderId, totalPrice };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = CheckoutService;
