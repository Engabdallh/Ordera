class Product {

    constructor(id, name, description, price, category, image, isAvailable) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
        this.image = image;
        this.isAvailable = isAvailable;
    }

}

module.exports = Product;