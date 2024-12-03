const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const axios = require("axios");

dotenv.config();

const database = require("./config/database");
database.connect();

// Routes
const userRoutes = require("./routes/User");

const PORT = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/v1/auth", userRoutes);

app.get("/", (req, res) => {
  res.send("API is running");
});

// Environment Variables
const merchant_id = process.env.MERCHANT_ID;
const salt_key = process.env.SALT_KEY;
const base_url = process.env.BASE_URL;

// API endpoint for order creation
app.post("/order", async (req, res) => {
  try {
    const { MUID, trasactionId, amount, name, mobile } = req.body;

    // Validate input
    if (!trasactionId || !amount || !name || !mobile) {
      return res.status(400).json({
        message: "Missing required fields",
        success: false,
      });
    }

    const data = {
      merchantId: merchant_id,
      merchantTransactionId: trasactionId,
      name: name,
      amount: amount * 100, // Convert to the smallest currency unit
      redirectUrl: `${base_url}/status/?id=${trasactionId}`,
      redirectMode: "POST",
      mobileNumber: mobile,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const payload = JSON.stringify(data);
    const payloadMain = Buffer.from(payload).toString("base64");
    const keyIndex = 1;
    const string = payloadMain + "/pg/v1/pay" + salt_key;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + keyIndex;

    const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay"; // Update if using sandbox

    const options = {
      method: "POST",
      url: prod_URL,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      data: {
        request: payloadMain,
      },
    };

    const response = await axios.request(options);
    return res.json(response.data);
  } catch (error) {
    console.error("Error during payment processing:", error);
    return res.status(500).json({
      message: "Failed to process payment",
      success: false,
      error: error.message,
    });
  }
});

// API endpoint to check payment status
app.get("/status", async (req, res) => {
  try {
    const merchantTransactionId = req.query.id;
    if (!merchantTransactionId) {
      return res.status(400).json({
        message: "Transaction ID is required",
        success: false,
      });
    }

    const string =
      `/pg/v1/status/${merchant_id}/${merchantTransactionId}` + salt_key;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###1";

    const options = {
      method: "GET",
      url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchant_id}/${merchantTransactionId}`, // Update for production/sandbox
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": merchant_id,
      },
    };

    const response = await axios.request(options);
    if (response.data.success === true) {
      return res.redirect(`${base_url}/success`);
    } else {
      return res.redirect(`${base_url}/failure`);
    }
  } catch (error) {
    console.error("Error checking payment status:", error);
    return res.status(500).json({
      message: "Failed to check payment status",
      success: false,
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is Running on PORT ${PORT}`);
});
