const db = require("../Database/db");

class SupportService {
  // =====================================================
  // إنشاء محادثة جديدة
  // أو إرجاع المحادثة المفتوحة للعميل
  // =====================================================

  async getOrCreateConversation(customerId) {
    const [existing] = await db.query(
      `SELECT
          id,
          customer_id,
          status,
          assigned_agent_id,
          rating,
          rating_comment,
          rated_at,
          created_at,
          updated_at
       FROM support_conversations
       WHERE customer_id = ?
         AND status <> 'مغلقة'
       ORDER BY id DESC
       LIMIT 1`,
      [customerId],
    );

    if (existing.length > 0) {
      return existing[0];
    }

    const [result] = await db.query(
      `INSERT INTO support_conversations
       (
         customer_id,
         status
       )
       VALUES (?, 'بانتظار الكول سنتر')`,
      [customerId],
    );

    const [rows] = await db.query(
      `SELECT
          id,
          customer_id,
          status,
          assigned_agent_id,
          rating,
          rating_comment,
          rated_at,
          created_at,
          updated_at
       FROM support_conversations
       WHERE id = ?`,
      [result.insertId],
    );

    return rows[0];
  }

  // =========================================
  // GET CUSTOMER ACTIVE CONVERSATION
  // جلب المحادثة الحالية المفتوحة فقط
  // =========================================
  async getCustomerConversation(customerId) {
    const [rows] = await db.query(
      `SELECT
        sc.id,
        sc.customer_id,
        sc.status,
        sc.assigned_agent_id,
        sc.rating,
        sc.rating_comment,
        sc.rated_at,
        sc.created_at,
        sc.updated_at
     FROM support_conversations sc
     WHERE sc.customer_id = ?
       AND sc.status <> 'مغلقة'
     ORDER BY sc.updated_at DESC, sc.id DESC
     LIMIT 1`,
      [customerId],
    );

    return rows[0] || null;
  }

  // =====================================================
  // التحقق أن المحادثة تخص العميل
  // =====================================================

  async verifyCustomerConversation(conversationId, customerId) {
    const [rows] = await db.query(
      `SELECT
          id,
          customer_id,
          status,
          assigned_agent_id,
          rating,
          rating_comment,
          rated_at,
          created_at,
          updated_at
       FROM support_conversations
       WHERE id = ?
         AND customer_id = ?
       LIMIT 1`,
      [conversationId, customerId],
    );

    return rows[0] || null;
  }

  // =====================================================
  // جلب رسائل محادثة معينة
  // =====================================================

  async getMessages(conversationId) {
    const [messages] = await db.query(
      `SELECT
        sm.id,
        sm.conversation_id,
        sm.sender_id,
        sm.sender_role,
        sm.message,
        sm.created_at,

        CASE
          WHEN sm.sender_role = 'customer'
            THEN c.name

          WHEN sm.sender_role = 'call_center'
            THEN a.name

          ELSE NULL
        END AS sender_name

     FROM support_messages sm

     LEFT JOIN customers c
       ON sm.sender_role = 'customer'
      AND sm.sender_id = c.id

     LEFT JOIN call_center_agents a
       ON sm.sender_role = 'call_center'
      AND sm.sender_id = a.id

     WHERE sm.conversation_id = ?

     ORDER BY sm.created_at ASC, sm.id ASC`,
      [conversationId],
    );

    return messages;
  }

  // =====================================================
  // إرسال رسالة من العميل
  // =====================================================

  async sendCustomerMessage(conversationId, customerId, message) {
    const cleanMessage = String(message || "").trim();

    if (!cleanMessage) {
      throw new Error("الرسالة فارغة");
    }

    if (cleanMessage.length > 1000) {
      throw new Error("الرسالة طويلة جدًا");
    }

    const conversation = await this.verifyCustomerConversation(
      conversationId,
      customerId,
    );

    if (!conversation) {
      throw new Error("المحادثة غير موجودة");
    }

    if (conversation.status === "مغلقة") {
      throw new Error("هذه المحادثة مغلقة");
    }

    const [result] = await db.query(
      `INSERT INTO support_messages
       (
         conversation_id,
         sender_id,
         sender_role,
         message
       )
       VALUES (?, ?, 'customer', ?)`,
      [conversationId, customerId, cleanMessage],
    );

    // عندما يرسل العميل:
    // تصبح المحادثة بانتظار الكول سنتر
    await db.query(
      `UPDATE support_conversations
       SET
         status = 'بانتظار الكول سنتر',
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [conversationId],
    );

    return {
      messageId: result.insertId,
      message: cleanMessage,
    };
  }

  // =====================================================
  // جلب المحادثات للكول سنتر
  // =====================================================

  async getConversationsForCallCenter({
    status = "",
    page = 1,
    limit = 20,
  } = {}) {
    const safePage = Math.max(Number(page) || 1, 1);

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const offset = (safePage - 1) * safeLimit;

    let sql = `
      SELECT
          sc.id,
          sc.customer_id,
          sc.status,
          sc.assigned_agent_id,
          sc.rating,
          sc.rating_comment,
          sc.rated_at,
          sc.created_at,
          sc.updated_at,

          c.name AS customer_name,
          c.email AS customer_email,

          (
            SELECT sm.message
            FROM support_messages sm
            WHERE sm.conversation_id = sc.id
            ORDER BY sm.id DESC
            LIMIT 1
          ) AS last_message,

          (
            SELECT sm.created_at
            FROM support_messages sm
            WHERE sm.conversation_id = sc.id
            ORDER BY sm.id DESC
            LIMIT 1
          ) AS last_message_at

      FROM support_conversations sc

      JOIN customers c
        ON sc.customer_id = c.id

      WHERE 1 = 1
    `;

    const params = [];

    if (status) {
      sql += `
        AND sc.status = ?
      `;

      params.push(status);
    }

    sql += `
      ORDER BY
        CASE
          WHEN sc.status = 'بانتظار الكول سنتر'
          THEN 0
          WHEN sc.status = 'بانتظار العميل'
          THEN 1
          ELSE 2
        END,
        sc.updated_at DESC

      LIMIT ? OFFSET ?
    `;

    params.push(safeLimit, offset);

    const [conversations] = await db.query(sql, params);

    return conversations;
  }

  // =====================================================
  // جلب تفاصيل محادثة للكول سنتر
  // =====================================================

  async getConversationForCallCenter(conversationId) {
    const [rows] = await db.query(
      `SELECT
          sc.id,
          sc.customer_id,
          sc.status,
          sc.assigned_agent_id,
          sc.rating,
          sc.rating_comment,
          sc.rated_at,
          sc.created_at,
          sc.updated_at,

          c.name AS customer_name,
          c.email AS customer_email,
          c.phone AS customer_phone

       FROM support_conversations sc

       JOIN customers c
         ON sc.customer_id = c.id

       WHERE sc.id = ?
       LIMIT 1`,
      [conversationId],
    );

    return rows[0] || null;
  }

  // =====================================================
  // استلام المحادثة من موظف الكول سنتر
  // وإرسال رسالة ترحيبية تلقائيًا
  // =====================================================

  async assignConversation(conversationId, agentId) {
    const [conversations] = await db.query(
      `SELECT
        id,
        status,
        assigned_agent_id
     FROM support_conversations
     WHERE id = ?
     LIMIT 1`,
      [conversationId],
    );

    if (conversations.length === 0) {
      throw new Error("المحادثة غير موجودة");
    }

    const conversation = conversations[0];

    if (conversation.status === "مغلقة") {
      throw new Error("المحادثة مغلقة");
    }

    // إذا كانت مستلمة من موظف آخر
    if (
      conversation.assigned_agent_id &&
      Number(conversation.assigned_agent_id) !== Number(agentId)
    ) {
      throw new Error("هذه المحادثة مستلمة من موظف آخر");
    }

    // إذا كانت مستلمة مسبقًا من نفس الموظف
    // لا نرسل رسالة ترحيبية مرة ثانية
    if (
      conversation.assigned_agent_id &&
      Number(conversation.assigned_agent_id) === Number(agentId)
    ) {
      return true;
    }

    // جلب اسم موظف الكول سنتر
    const [agents] = await db.query(
      `SELECT
        id,
        name
     FROM call_center_agents
     WHERE id = ?
     LIMIT 1`,
      [agentId],
    );

    if (agents.length === 0) {
      throw new Error("موظف الكول سنتر غير موجود");
    }

    const agent = agents[0];

    // استلام المحادثة
    await db.query(
      `UPDATE support_conversations
     SET
       assigned_agent_id = ?,
       status = 'بانتظار العميل',
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
      [agentId, conversationId],
    );

    // إرسال رسالة الترحيب تلقائيًا
    const welcomeMessage =
      `👋 أهلاً وسهلاً بك في 911\n` +
      `معك ${agent.name} من خدمة العملاء.\n` +
      `كيف يمكنني مساعدتك اليوم؟`;

    await db.query(
      `INSERT INTO support_messages (
        conversation_id,
        sender_id,
        sender_role,
        message
     )
     VALUES (?, ?, 'call_center', ?)`,
      [conversationId, agentId, welcomeMessage],
    );

    return true;
  }

  // =====================================================
  // إرسال رسالة من الكول سنتر
  // =====================================================

  async sendAgentMessage(conversationId, agentId, message) {
    const cleanMessage = String(message || "").trim();

    if (!cleanMessage) {
      throw new Error("الرسالة فارغة");
    }

    if (cleanMessage.length > 1000) {
      throw new Error("الرسالة طويلة جدًا");
    }

    const conversation =
      await this.getConversationForCallCenter(conversationId);

    if (!conversation) {
      throw new Error("المحادثة غير موجودة");
    }

    if (conversation.status === "مغلقة") {
      throw new Error("المحادثة مغلقة");
    }

    if (
      conversation.assigned_agent_id &&
      Number(conversation.assigned_agent_id) !== Number(agentId)
    ) {
      throw new Error("هذه المحادثة مستلمة من موظف آخر");
    }

    if (!conversation.assigned_agent_id) {
      await this.assignConversation(conversationId, agentId);
    }

    const [result] = await db.query(
      `INSERT INTO support_messages
       (
         conversation_id,
         sender_id,
         sender_role,
         message
       )
       VALUES (?, ?, 'call_center', ?)`,
      [conversationId, agentId, cleanMessage],
    );

    // بعد رد الموظف:
    // ننتظر رد العميل
    await db.query(
      `UPDATE support_conversations
       SET
         assigned_agent_id = ?,
         status = 'بانتظار العميل',
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [agentId, conversationId],
    );

    return {
      messageId: result.insertId,
      message: cleanMessage,
    };
  }

  // =====================================================
  // إغلاق المحادثة
  // =====================================================

  async closeConversation(conversationId, agentId) {
    const conversation =
      await this.getConversationForCallCenter(conversationId);

    if (!conversation) {
      throw new Error("المحادثة غير موجودة");
    }

    if (conversation.status === "مغلقة") {
      throw new Error("المحادثة مغلقة بالفعل");
    }

    if (
      conversation.assigned_agent_id &&
      Number(conversation.assigned_agent_id) !== Number(agentId)
    ) {
      throw new Error("لا يمكنك إغلاق محادثة موظف آخر");
    }

    await db.query(
      `UPDATE support_conversations
       SET
         status = 'مغلقة',
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [conversationId],
    );

    return true;
  }

  // =====================================================
  // تقييم المحادثة
  // =====================================================

  async rateConversation(conversationId, customerId, rating, comment = "") {
    const cleanRating = Number(rating);

    if (!Number.isInteger(cleanRating) || cleanRating < 1 || cleanRating > 5) {
      throw new Error("التقييم يجب أن يكون من 1 إلى 5");
    }

    const conversation = await this.verifyCustomerConversation(
      conversationId,
      customerId,
    );

    if (!conversation) {
      throw new Error("المحادثة غير موجودة");
    }

    if (conversation.status !== "مغلقة") {
      throw new Error("يمكن التقييم بعد إغلاق المحادثة فقط");
    }

    if (conversation.rated_at) {
      throw new Error("تم تقييم هذه المحادثة مسبقًا");
    }

    const cleanComment = String(comment || "").trim();

    if (cleanComment.length > 500) {
      throw new Error("التعليق طويل جدًا");
    }

    const [result] = await db.query(
      `UPDATE support_conversations
       SET
         rating = ?,
         rating_comment = ?,
         rated_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?
         AND customer_id = ?
         AND status = 'مغلقة'
         AND rated_at IS NULL`,
      [cleanRating, cleanComment || null, conversationId, customerId],
    );

    if (result.affectedRows === 0) {
      throw new Error("تعذر حفظ التقييم");
    }

    return true;
  }

  // =====================================================
  // إحصائيات محادثات الدعم للكول سنتر
  // =====================================================

  async getSupportStats() {
    const [rows] = await db.query(`
      SELECT
        SUM(status = 'بانتظار الكول سنتر') AS waitingCount,
        SUM(status = 'بانتظار العميل') AS activeCount,
        SUM(status = 'مغلقة') AS closedCount
      FROM support_conversations
    `);

    return {
      waitingCount: Number(rows[0].waitingCount || 0),
      activeCount: Number(rows[0].activeCount || 0),
      closedCount: Number(rows[0].closedCount || 0),
    };
  }
  // =========================================
  // CANCEL CONVERSATION — إلغاء المحادثة
  // =========================================
  async cancelConversation(conversationId, customerId) {
    const [rows] = await db.query(
      `SELECT
        id,
        status,
        assigned_agent_id
     FROM support_conversations
     WHERE id = ?
       AND customer_id = ?
     LIMIT 1`,
      [conversationId, customerId],
    );

    const conversation = rows[0];

    if (!conversation) {
      throw new Error("المحادثة غير موجودة");
    }

    // لا يسمح بالإلغاء بعد استلامها من الكول سنتر
    if (conversation.assigned_agent_id) {
      throw new Error("لا يمكن إلغاء المحادثة بعد استلامها من الكول سنتر");
    }

    // الإلغاء مسموح فقط وهي بانتظار الكول سنتر
    if (conversation.status !== "بانتظار الكول سنتر") {
      throw new Error("لا يمكن إلغاء هذه المحادثة حاليًا");
    }

    // حذف المحادثة ورسائلها المرتبطة بها
    // لأن support_messages مربوط بها بـ ON DELETE CASCADE
    await db.query(
      `DELETE FROM support_conversations
     WHERE id = ?
       AND customer_id = ?`,
      [conversationId, customerId],
    );

    return true;
  }

  // =========================================
  // ADMIN EMPLOYEE SUPPORT REPORT
  // تقرير أداء موظف الدعم
  // =========================================
  async getAdminSupportRatings(employeeName) {
    const name = String(employeeName ?? "").trim();

    if (!name) {
      throw new Error("يرجى إدخال اسم الموظف");
    }

    // البحث عن الموظف
    const [agents] = await db.query(
      `SELECT
        id,
        name
     FROM call_center_agents
     WHERE name LIKE ?
     ORDER BY
       CASE
         WHEN name = ? THEN 0
         ELSE 1
       END,
       name ASC
     LIMIT 10`,
      [`%${name}%`, name],
    );

    if (agents.length === 0) {
      return {
        employee: null,

        matchedEmployees: [],

        stats: {
          totalAssignedConversations: 0,
          respondedConversations: 0,
          unansweredConversations: 0,
          totalMessagesSent: 0,
          responseRate: 0,
          totalRatings: 0,
          averageRating: 0,
          fiveStars: 0,
          fourStars: 0,
          threeStars: 0,
          twoStars: 0,
          oneStar: 0,
        },

        ratings: [],
      };
    }

    const exactEmployee = agents.find(
      (agent) => String(agent.name).trim().toLowerCase() === name.toLowerCase(),
    );

    const employee = exactEmployee || agents[0];

    // =========================================
    // المحادثات التي استلمها الموظف
    // =========================================
    const [conversationRows] = await db.query(
      `SELECT
          sc.id,
          sc.status,
          sc.rating,
          sc.rating_comment,
          sc.rated_at,
          sc.created_at,
          sc.updated_at,

          c.name AS customer_name,
          c.email AS customer_email,

          COUNT(sm.id) AS agent_message_count

       FROM support_conversations sc

       LEFT JOIN customers c
         ON sc.customer_id = c.id

       LEFT JOIN support_messages sm
         ON sm.conversation_id = sc.id
        AND sm.sender_role = 'call_center'
        AND sm.sender_id = ?

       WHERE sc.assigned_agent_id = ?

       GROUP BY
         sc.id,
         sc.status,
         sc.rating,
         sc.rating_comment,
         sc.rated_at,
         sc.created_at,
         sc.updated_at,
         c.name,
         c.email

       ORDER BY
         sc.updated_at DESC,
         sc.id DESC`,
      [employee.id, employee.id],
    );

    // =========================================
    // إحصائيات المحادثات
    // =========================================
    const totalAssignedConversations = conversationRows.length;

    const respondedConversations = conversationRows.filter(
      (conversation) => Number(conversation.agent_message_count || 0) > 0,
    ).length;

    const unansweredConversations =
      totalAssignedConversations - respondedConversations;

    const totalMessagesSent = conversationRows.reduce(
      (total, conversation) =>
        total + Number(conversation.agent_message_count || 0),
      0,
    );

    // =========================================
    // التقييمات
    // =========================================
    const ratedConversations = conversationRows.filter(
      (conversation) =>
        conversation.rating !== null && conversation.rating !== undefined,
    );

    const totalRatings = ratedConversations.length;

    const fiveStars = ratedConversations.filter(
      (item) => Number(item.rating) === 5,
    ).length;

    const fourStars = ratedConversations.filter(
      (item) => Number(item.rating) === 4,
    ).length;

    const threeStars = ratedConversations.filter(
      (item) => Number(item.rating) === 3,
    ).length;

    const twoStars = ratedConversations.filter(
      (item) => Number(item.rating) === 2,
    ).length;

    const oneStar = ratedConversations.filter(
      (item) => Number(item.rating) === 1,
    ).length;

    const ratingTotal = ratedConversations.reduce(
      (total, item) => total + Number(item.rating || 0),
      0,
    );

    const averageRating =
      totalRatings > 0 ? Number((ratingTotal / totalRatings).toFixed(2)) : 0;

    const responseRate =
      totalAssignedConversations > 0
        ? Number(
            (
              (respondedConversations / totalAssignedConversations) *
              100
            ).toFixed(1),
          )
        : 0;

    // =========================================
    // تفاصيل التقييمات
    // =========================================
    const ratings = ratedConversations.map((conversation) => ({
      id: conversation.id,

      status: conversation.status,

      customer_name: conversation.customer_name || "عميل",

      customer_email: conversation.customer_email || null,

      rating: Number(conversation.rating),

      rating_comment: conversation.rating_comment || "",

      rated_at: conversation.rated_at,

      created_at: conversation.created_at,

      updated_at: conversation.updated_at,

      agent_message_count: Number(conversation.agent_message_count || 0),
    }));

    return {
      employee: {
        id: employee.id,
        name: employee.name,
      },

      matchedEmployees: agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
      })),

      stats: {
        totalAssignedConversations,
        respondedConversations,
        unansweredConversations,
        totalMessagesSent,
        responseRate,

        totalRatings,
        averageRating,

        fiveStars,
        fourStars,
        threeStars,
        twoStars,
        oneStar,
      },

      ratings,
    };
  }
}

module.exports = SupportService;
