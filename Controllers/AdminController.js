const OrderService = require("../Services/OrderService");
const RestaurantService = require("../Services/RestaurantService");
const CallCenterAgentService = require("../Services/CallCenterAgentService");

const orderService = new OrderService();
const restaurantService = new RestaurantService();
const callCenterAgentService = new CallCenterAgentService();

// =====================================================
// لوحة تحكم الأدمن
// =====================================================

const showDashboard = async (req, res) => {
  try {
    const stats = await orderService.getDashboardStats();

    const restaurant = await restaurantService.getRestaurantStatus();

    res.render("admin/index", {
      stats: stats,
      restaurant: restaurant,
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error);

    res.status(500).send("حدث خطأ أثناء تحميل لوحة التحكم");
  }
};

// =====================================================
// فتح / إغلاق المطعم
// =====================================================

const toggleRestaurantStatus = async (req, res) => {
  try {
    await restaurantService.toggleRestaurantStatus();

    res.redirect("/admin");
  } catch (error) {
    console.error("TOGGLE RESTAURANT STATUS ERROR:", error);

    res.status(500).send("حدث خطأ أثناء تغيير حالة المطعم");
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
      month,
      cycle,
    } = req.query;

    let result;

    // =========================
    // إذا تم اختيار دورة
    // =========================

    if (cycle) {
      result = await orderService.getOrdersByCycle(Number(cycle));
    } else {
      // =========================
      // الطلبات العادية
      // =========================

      result = await orderService.filterOrders({
        status,
        date,
        fromTime,
        toTime,
        month,
      });
    }

    // =========================
    // جلب جميع الدورات
    // =========================

    const cycles = await restaurantService.getCycles();

    // =========================
    // الدورة المختارة
    // =========================

    const selectedCycle = cycle
      ? cycles.find((item) => item.id === Number(cycle))
      : null;

    const success = req.query.success;

    res.render("admin/orders", {
      orders: result.orders,

      totalOrders: result.totalOrders,

      totalSales: result.totalSales,

      success,

      cycles,

      selectedCycle,

      selectedCycleId: cycle || "",

      filters: {
        status: status || "",
        date: date || "",
        fromTime: fromTime || "",
        toTime: toTime || "",
        month: month || "",
      },
    });
  } catch (error) {
    console.error("SHOW ORDERS ERROR:", error);

    res.status(500).send("حدث خطأ أثناء تحميل الطلبات");
  }
};

// =====================================================
// تفاصيل طلب معين
// =====================================================

const showOrderDetails = async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    if (!orderId) {
      return res.status(400).send("رقم الطلب غير صحيح");
    }

    const order = await orderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).send("الطلب غير موجود");
    }

    const items = await orderService.getOrderItems(orderId);

    res.render("admin/order-details", {
      order: order,
      items: items,
    });
  } catch (error) {
    console.error("ADMIN ORDER DETAILS ERROR:", error);

    res.status(500).send("حدث خطأ أثناء تحميل تفاصيل الطلب");
  }
};

// =====================================================
// فلترة الطلبات
// =====================================================

const filterOrders = async (req, res) => {
  try {
    const { status, date, fromTime, toTime, month } = req.query;

    const result = await orderService.filterOrders({
      status,
      date,
      fromTime,
      toTime,
      month,
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
        month: month || "",
      },
    });
  } catch (error) {
    console.error("FILTER ORDERS ERROR:", error);

    res.status(500).send("حدث خطأ أثناء فلترة الطلبات");
  }
};

// =====================================================
// موظفو الكول سنتر
// =====================================================

const showCallCenterAgents = async (req, res) => {
  try {
    const agents = await callCenterAgentService.getAllAgents();

    const success = req.query.success;
    const errorMessage = req.query.error;

    res.render("admin/call-center-agents", {
      agents: agents,
      success: success,
       errorMessage: errorMessage,
    });
  } catch (error) {
    console.error("SHOW CALL CENTER AGENTS ERROR:", error);

    res.status(500).send("حدث خطأ أثناء تحميل موظفي الكول سنتر");
  }
};

// =====================================================
// إضافة موظف كول سنتر
// =====================================================

const createCallCenterAgent = async (req, res) => {
  try {
    const { name, phone, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.redirect("/admin/call-center-agents?error=required-fields");
    }

    if (password !== confirmPassword) {
      return res.redirect("/admin/call-center-agents?error=password-mismatch");
    }

    await callCenterAgentService.createAgent({
      name,
      phone,
      email,
      password,
    });

    res.redirect("/admin/call-center-agents?success=agent-added");
  } catch (error) {
    console.error("CREATE CALL CENTER AGENT ERROR:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.redirect("/admin/call-center-agents?error=email-exists");
    }

    res.redirect("/admin/call-center-agents?error=agent-create-failed");
  }
};

// =====================================================
// حذف موظف كول سنتر
// =====================================================

const deleteCallCenterAgent = async (req, res) => {
  try {
    const agentId = Number(req.params.id);

    if (!agentId) {
      return res.status(400).send("رقم الموظف غير صحيح");
    }

    await callCenterAgentService.deleteAgent(agentId);

    res.redirect("/admin/call-center-agents?success=agent-deleted");
  } catch (error) {
    console.error("DELETE CALL CENTER AGENT ERROR:", error);

    res.status(500).send("حدث خطأ أثناء حذف الموظف");
  }
};

// =====================================================
// تفعيل / تعطيل موظف
// =====================================================

const toggleCallCenterAgentStatus = async (req, res) => {
  try {
    const agentId = Number(req.params.id);

    if (!agentId) {
      return res.status(400).send("رقم الموظف غير صحيح");
    }

    const agents = await callCenterAgentService.getAllAgents();

    const agent = agents.find((item) => item.id === agentId);

    if (!agent) {
      return res.status(404).send("الموظف غير موجود");
    }

    await callCenterAgentService.toggleAgentStatus(agentId);

    if (agent.status === "فعال") {
      return res.redirect("/admin/call-center-agents?success=agent-disabled");
    }

    return res.redirect("/admin/call-center-agents?success=agent-enabled");
  } catch (error) {
    console.error("TOGGLE CALL CENTER AGENT STATUS ERROR:", error);

    res.status(500).send("حدث خطأ أثناء تغيير حالة الموظف");
  }
};

// =====================================================
// تحديث بيانات موظف كول سنتر
// =====================================================

const updateCallCenterAgent = async (req, res) => {
  try {
    const agentId = Number(req.params.id);

    const { name, phone, email, password, confirmPassword } = req.body;

    if (!agentId) {
      return res.status(400).send("رقم الموظف غير صحيح");
    }

    if (!name || !email) {
      return res.status(400).send("الاسم والبريد الإلكتروني مطلوبان");
    }

    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        return res.status(400).send("كلمتا المرور غير متطابقتين");
      }
    }

    await callCenterAgentService.updateAgent(agentId, {
      name,
      phone,
      email,
      password,
    });

    res.redirect("/admin/call-center-agents?success=agent-updated");
  } catch (error) {
    console.error("UPDATE CALL CENTER AGENT ERROR:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).send("البريد الإلكتروني مستخدم بالفعل");
    }

    res.status(500).send("حدث خطأ أثناء تحديث بيانات الموظف");
  }
};

const showEditCallCenterAgent = async (req, res) => {
  try {
    const agentId = Number(req.params.id);

    if (!agentId) {
      return res.status(400).send("رقم الموظف غير صحيح");
    }

    const agents = await callCenterAgentService.getAllAgents();

    const agent = agents.find((item) => item.id === agentId);

    if (!agent) {
      return res.status(404).send("الموظف غير موجود");
    }

    res.render("admin/edit-call-center-agent", {
      agent: agent,
    });
  } catch (error) {
    console.error("SHOW EDIT CALL CENTER AGENT ERROR:", error);

    res.status(500).send("حدث خطأ أثناء تحميل صفحة تعديل الموظف");
  }
};

const deleteOrder = async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    if (!orderId) {
      return res.status(400).send("رقم الطلب غير صحيح");
    }

    const deleted = await orderService.deleteOrder(orderId);

    if (!deleted) {
      return res.status(404).send("الطلب غير موجود");
    }

    res.redirect("/admin/orders?success=order-deleted");
  } catch (error) {
    console.error("DELETE ORDER ERROR:", error);

    res.status(500).send("حدث خطأ أثناء حذف الطلب");
  }
};

module.exports = {
  showDashboard,
  toggleRestaurantStatus,
  showOrders,
  showOrderDetails,
  filterOrders,
  showCallCenterAgents,
  createCallCenterAgent,
  deleteCallCenterAgent,
  toggleCallCenterAgentStatus,
  updateCallCenterAgent,
  showEditCallCenterAgent,
  deleteOrder,
};
