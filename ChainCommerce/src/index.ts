import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic, nat64 } from 'azle';
import express from 'express';

/**
 * This type represents a product in the e-commerce platform.
 */
class Product {
    id: string;               // Unique product ID
    name: string;             // Product name
    description: string;      // Product description
    price: number;            // Product price
    owner: string;            // Owner's address
    createdAt: nat64;         // Timestamp when the product was created
    updatedAt: nat64 | null;  // Timestamp when the product was last updated
}

/**
 * This type represents an order placed by a user.
 */
class Order {
    id: string;               // Unique order ID
    productId: string;        // ID of the ordered product
    buyer: string;            // Buyer's address
    quantity: number;         // Quantity of the product ordered
    createdAt: nat64;         // Timestamp when the order was placed
}

/**
 * This type represents a review for a product.
 */
class Review {
    id: string;               // Unique review ID
    productId: string;        // ID of the reviewed product
    reviewer: string;         // Reviewer's address
    rating: number;           // Rating out of 5
    comment: string;          // Review comment
    createdAt: nat64;         // Timestamp when the review was created
}

// Storage for products, orders, and reviews
const productsStorage = new StableBTreeMap<string, Product>(0, 44, 1024);
const ordersStorage = new StableBTreeMap<string, Order>(1, 44, 1024);
const reviewsStorage = new StableBTreeMap<string, Review>(2, 44, 1024);

// Initialize server
const app = express();
app.use(express.json());

// Add a new product
app.post("/products", (req, res) => {
    const { name, description, price, owner } = req.body;
    const product: Product = {
        id: uuidv4(),
        name,
        description,
        price,
        owner,
        createdAt: getCurrentTime(),
        updatedAt: null,
    };
    productsStorage.insert(product.id, product);
    res.json(product);
});

// Get all products
app.get("/products", (req, res) => {
    res.json(productsStorage.values());
});

// Get product by ID
app.get("/products/:id", (req, res) => {
    const productId = req.params.id;
    const productOpt = productsStorage.get(productId);
    if (productOpt === undefined) {
        res.status(404).send(`Product with ID=${productId} not found`);
    } else {
        res.json(productOpt);
    }
});

// Update a product
app.put("/products/:id", (req, res) => {
    const productId = req.params.id;
    const productOpt = productsStorage.get(productId);
    if (productOpt === undefined) {
        res.status(400).send(`Couldn't update product with ID=${productId}. Product not found`);
    } else {
        const product = productOpt;
        const updatedProduct: Product = { ...product, ...req.body, updatedAt: getCurrentTime() };
        productsStorage.insert(productId, updatedProduct);
        res.json(updatedProduct);
    }
});

// Delete a product
app.delete("/products/:id", (req, res) => {
    const productId = req.params.id;
    const deletedProduct = productsStorage.remove(productId);
    if (deletedProduct === undefined) {
        res.status(400).send(`Couldn't delete product with ID=${productId}. Product not found`);
    } else {
        res.json(deletedProduct);
    }
});

// Place an order
app.post("/orders", (req, res) => {
    const { productId, buyer, quantity } = req.body;
    const order: Order = {
        id: uuidv4(),
        productId,
        buyer,
        quantity,
        createdAt: getCurrentTime(),
    };
    ordersStorage.insert(order.id, order);
    res.json(order);
});

// Get all orders
app.get("/orders", (req, res) => {
    res.json(ordersStorage.values());
});

// Add a review for a product
app.post("/reviews", (req, res) => {
    const { productId, reviewer, rating, comment } = req.body;
    const review: Review = {
        id: uuidv4(),
        productId,
        reviewer,
        rating,
        comment,
        createdAt: getCurrentTime(),
    };
    reviewsStorage.insert(review.id, review);
    res.json(review);
});

// Get reviews for a product
app.get("/reviews/:productId", (req, res) => {
    const productId = req.params.productId;
    const productReviews = reviewsStorage.values().filter(review => review.productId === productId);
    res.json(productReviews);
});

// Helper function to get current time
function getCurrentTime(): nat64 {
    return ic.time() as nat64;
}

// Start the server
export default Server(() => {
    return app.listen();
});
