const express = require("express");
const { checkPaymentStatus } = require("../controllers/paymentController");

const router = express.Router();

// Payment status route
router.post("/status", checkPaymentStatus);

module.exports = router;
