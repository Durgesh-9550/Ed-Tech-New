const express = require("express");
const { checkPaymentStatus } = require("../controllers/paymentController");

const router = express.Router();

// Payment status route
router.get("/status", checkPaymentStatus);

module.exports = router;
