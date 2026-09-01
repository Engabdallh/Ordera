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
         AND DATE(created_at) = CURDATE()
         ORDER BY created_at DESC`,
        [customerId]
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
            [orderId]
        );

        return items;
    }


    // =====================================================
    // طلبات اليوم للكول سنتر
    // =====================================================

    async getTodayOrdersForCallCenter() {

        const [orders] = await db.query(
            `SELECT
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

             WHERE DATE(o.created_at) = CURDATE()

             ORDER BY o.created_at DESC`
        );

        return orders;
    }


    // =====================================================
    // منتجات طلب للكول سنتر
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
            [orderId]
        );

        return items;
    }


    // =====================================================
    // تغيير حالة الطلب
    //
    // تم التأكيد:
    // يبدأ العداد ويسجل وقت البداية
    //
    // قيد التحضير:
    // يبقى نفس وقت البداية
    //
    // جاهز:
    // يتوقف العداد لأن الصفحة لن تعرضه
    // =====================================================

    async updateOrderStatus(orderId, newStatus) {

        const allowedStatuses = [
            "قيد الانتظار",
            "تم التأكيد",
            "قيد التحضير",
            "جاهز",
            "تم التوصيل",
            "ملغي"
        ];


        // التحقق من الحالة
        if (!allowedStatuses.includes(newStatus)) {
            throw new Error("حالة الطلب غير صحيحة");
        }


        // =================================================
        // إذا أصبحت الحالة تم التأكيد
        // نبدأ المؤقت من الآن
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
        [
            newStatus,
            orderId
        ]
    );

    return result;
}


        // =================================================
        // قيد التحضير
        //
        // لا نغير status_changed_at
        // حتى يستمر العداد من وقت التأكيد
        // =================================================

        if (newStatus === "قيد التحضير") {

            const [result] = await db.query(
                `UPDATE orders
                 SET
                    status = ?,
                    updated_at = NOW()
                 WHERE id = ?`,
                [
                    newStatus,
                    orderId
                ]
            );

            return result;
        }


        // =================================================
        // جاهز
        //
        // لا نغير status_changed_at
        // حتى يبقى وقت البداية محفوظاً
        // =================================================

        if (newStatus === "جاهز") {

    const [result] = await db.query(
        `UPDATE orders
         SET
            status = ?,
            preparation_completed_at = NOW(),
            updated_at = NOW()
         WHERE id = ?`,
        [
            newStatus,
            orderId
        ]
    );

    return result;
}

        // =================================================
        // باقي الحالات
        // =================================================

        const [result] = await db.query(
            `UPDATE orders
             SET
                status = ?,
                updated_at = NOW()
             WHERE id = ?`,
            [
                newStatus,
                orderId
            ]
        );

        return result;
    }

}


module.exports = OrderService;