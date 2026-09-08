const db = require("../Database/db");

class ProductService {

    async getAllProducts() {
        const [products] = await db.query(
            "SELECT * FROM products"
        );

        return products;
    }

    async getAvailableProducts() {
    const [products] = await db.query(
        `SELECT *
         FROM products
         WHERE is_available = 1
         ORDER BY id DESC`
    );

    return products;
}


    async createProduct(name, description, price, category, image) {

        const [result] = await db.query(
            `INSERT INTO products
            (name, description, price, category, image)
            VALUES (?, ?, ?, ?, ?)`,
            [name, description, price, category, image]
        );

        return result;
    }


    async getProductById(id) {

        const [products] = await db.query(
            "SELECT * FROM products WHERE id = ?",
            [id]
        );

        return products[0];
    }


    async updateProduct(
    id,
    name,
    description,
    price,
    category,
    image
) {

    const [result] = await db.query(

        `UPDATE products
         SET name = ?,
             description = ?,
             price = ?,
             category = ?,
             image = ?
         WHERE id = ?`,

        [
            name,
            description,
            price,
            category,
            image,
            id
        ]

    );

    return result;

}


    async deleteProduct(id) {

        const [result] = await db.query(
            "DELETE FROM products WHERE id = ?",
            [id]
        );

        return result;
    }

    async toggleProductAvailability(id) {
    const [result] = await db.query(
        `UPDATE products
         SET is_available = NOT is_available
         WHERE id = ?`,
        [id]
    );

    return result;
}

}

module.exports = ProductService;