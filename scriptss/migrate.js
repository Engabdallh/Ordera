require("dotenv").config();

const db = require("../Database/db");

// =====================================================
// تشغيل Migration لنظام المحادثة والإشعارات
// =====================================================

async function runMigration() {
  try {
    console.log("Starting database migration...");

    // ==========================================
    // جدول رسائل المحادثة
    // ==========================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS order_messages (
        id INT NOT NULL AUTO_INCREMENT,
        order_id INT NOT NULL,
        sender_id INT NOT NULL,
        sender_role ENUM('customer', 'call_center') NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        PRIMARY KEY (id),

        CONSTRAINT fk_order_messages_order
          FOREIGN KEY (order_id)
          REFERENCES orders(id)
          ON DELETE CASCADE
      )
    `);

    console.log("✓ order_messages ready");

    // ==========================================
    // جدول الإشعارات
    // ==========================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT NOT NULL AUTO_INCREMENT,
        recipient_id INT NOT NULL,
        recipient_role ENUM('customer', 'call_center') NOT NULL,
        order_id INT NOT NULL,
        message_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message_preview VARCHAR(500) NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP NULL,

        PRIMARY KEY (id),

        CONSTRAINT fk_notifications_order
          FOREIGN KEY (order_id)
          REFERENCES orders(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_notifications_message
          FOREIGN KEY (message_id)
          REFERENCES order_messages(id)
          ON DELETE CASCADE
      )
    `);

    console.log("✓ notifications ready");

    console.log("Database migration completed successfully.");

    process.exit(0);
  } catch (error) {
    console.error("DATABASE MIGRATION ERROR:", error);

    process.exit(1);
  }
}

runMigration();