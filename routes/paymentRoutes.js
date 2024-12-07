const express = require("express");
const { createOrder, checkPaymentStatus } = require("../controllers/paymentController");

const router = express.Router();

// Order creation route
router.post("/order", createOrder);

// Payment status route
router.get("/status", checkPaymentStatus);

module.exports = router;
