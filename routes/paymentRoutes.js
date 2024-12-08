const express = require("express");
const { createOrder } = require("../controllers/paymentController");

const router = express.Router();

// Order creation route
router.post("/order", createOrder);

module.exports = router;
