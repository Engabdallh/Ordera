/**
 * One-time migration for existing Ordera installations.
 * It hashes only passwords that are not already bcrypt hashes.
 * Run with: node scripts/hashExistingPasswords.js
 */
require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("../Database/db");

const BCRYPT_ROUNDS = 12;
const tables = ["admins", "call_center_agents", "customers"];

const isBcryptHash = (value) =>
  typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);

(async () => {
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    for (const table of tables) {
      const [rows] = await connection.query(
        `SELECT id, password FROM ${table}`,
      );

      for (const row of rows) {
        if (!row.password || isBcryptHash(row.password)) continue;

        const hash = await bcrypt.hash(String(row.password), BCRYPT_ROUNDS);
        await connection.query(
          `UPDATE ${table} SET password = ? WHERE id = ?`,
          [hash, row.id],
        );
      }
    }

    await connection.commit();
    console.log("Password migration completed successfully.");
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Password migration failed:", error);
    process.exitCode = 1;
  } finally {
    if (connection) connection.release();
    await db.end();
  }
})();
