const db = require("../Database/db");
const bcrypt = require("bcrypt");

class CallCenterAgentService {
  // ==========================================
  // جلب جميع موظفي الكول سنتر
  // ==========================================

  async getAllAgents() {
    const [agents] = await db.query(`
      SELECT
        id,
        name,
        phone,
        email,
        status,
        created_at
      FROM call_center_agents
      ORDER BY created_at DESC
    `);

    return agents;
  }

  // ==========================================
  // إضافة موظف جديد
  // ==========================================

  async createAgent({ name, phone, email, password }) {
    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db.query(
      `
      INSERT INTO call_center_agents
        (name, phone, email, password, status)
      VALUES
        (?, ?, ?, ?, 'فعال')
      `,
      [name, phone || null, email, hashedPassword],
    );

    return result.insertId;
  }

  // ==========================================
  // حذف موظف
  // ==========================================

  async deleteAgent(agentId) {
    await db.query(
      `
      DELETE FROM call_center_agents
      WHERE id = ?
      `,
      [agentId],
    );
  }

  // ==========================================
  // تفعيل / تعطيل الموظف
  // ==========================================

  async toggleAgentStatus(agentId) {
    await db.query(
      `
      UPDATE call_center_agents
      SET status =
        CASE
          WHEN status = 'فعال' THEN 'غير فعال'
          ELSE 'فعال'
        END
      WHERE id = ?
      `,
      [agentId],
    );
  }

  // ==========================================
  // تعديل بيانات موظف
  // ==========================================

  async updateAgent(agentId, { name, phone, email, password }) {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);

      await db.query(
        `
      UPDATE call_center_agents
      SET
        name = ?,
        phone = ?,
        email = ?,
        password = ?
      WHERE id = ?
      `,
        [name, phone || null, email, hashedPassword, agentId],
      );
    } else {
      await db.query(
        `
      UPDATE call_center_agents
      SET
        name = ?,
        phone = ?,
        email = ?
      WHERE id = ?
      `,
        [name, phone || null, email, agentId],
      );
    }
  }
}

module.exports = CallCenterAgentService;
