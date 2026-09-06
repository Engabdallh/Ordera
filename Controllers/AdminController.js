const OrderService = require("../Services/OrderService");

const orderService = new OrderService();

const showDashboard = async (req, res) => {

    try {

        const stats =
            await orderService.getDashboardStats();

        res.render("admin/index", {
            stats: stats
        });

    } catch (error) {

        console.error(
            "ADMIN DASHBOARD ERROR:",
            error
        );

        res.status(500).send(
            "حدث خطأ أثناء تحميل لوحة التحكم"
        );
    }
};


// =====================================================
// صفحة طلبات الأدمن
// =====================================================

const showOrders = async (req, res) => {

    try {

        const {
            status,
            date,
            fromTime,
            toTime,
            month
        } = req.query;

        const result = await orderService.filterOrders({
            status,
            date,
            fromTime,
            toTime,
            month
        });

        res.render("admin/orders", {

            orders: result.orders,

            totalOrders: result.totalOrders,

            totalSales: result.totalSales,

            filters: {
                status: status || "",
                date: date || "",
                fromTime: fromTime || "",
                toTime: toTime || "",
                month: month || ""
            }

        });

    } catch (error) {

        console.error(
            "SHOW ORDERS ERROR:",
            error
        );

        res.status(500).send(
            "حدث خطأ أثناء تحميل الطلبات"
        );
    }
};


// =====================================================
// تفاصيل طلب معين
// =====================================================

const showOrderDetails = async (req, res) => {

    try {

        const orderId = Number(req.params.id);

        if (!orderId) {
            return res.status(400).send(
                "رقم الطلب غير صحيح"
            );
        }

        const order =
            await orderService.getOrderById(orderId);

        if (!order) {
            return res.status(404).send(
                "الطلب غير موجود"
            );
        }

        const items =
            await orderService.getOrderItems(orderId);

        res.render("admin/order-details", {
            order: order,
            items: items
        });

    } catch (error) {

        console.error(
            "ADMIN ORDER DETAILS ERROR:",
            error
        );

        res.status(500).send(
            "حدث خطأ أثناء تحميل تفاصيل الطلب"
        );
    }
};

const filterOrders = async (req, res) => {

    try {

        const {
            status,
            date,
            fromTime,
            toTime,
            month
        } = req.query;

        const result =
            await orderService.filterOrders({
                status,
                date,
                fromTime,
                toTime,
                month
            });

        res.render("admin/orders", {
            orders: result.orders,
            totalOrders: result.totalOrders,
            totalSales: result.totalSales,

            filters: {
                status: status || "",
                date: date || "",
                fromTime: fromTime || "",
                toTime: toTime || "",
                month: month || ""
            }
        });

    } catch (error) {

        console.error(
            "FILTER ORDERS ERROR:",
            error
        );

        res.status(500).send(
            "حدث خطأ أثناء فلترة الطلبات"
        );
    }
};

module.exports = {
    showDashboard,
    showOrders,
    showOrderDetails,
    filterOrders
};