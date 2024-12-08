const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const axios = require("axios");

dotenv.config();

// Database Connection
const database = require("./config/database");
database.connect();

// Routes
const userRoutes = require("./routes/User");
const paymentOrderRoutes = require("./routes/paymentRoutes");
const paymentStatusRoute = require("./routes/paymentStatusRoute");

const PORT = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// app.use(cors());

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/payment", paymentOrderRoutes);
app.use("", paymentStatusRoute);

app.get("/", (req, res) => {
  res.send("API is running");
});

// Environment Variables
// const merchant_id = process.env.MERCHANT_ID; // Use production value
// const salt_key = process.env.SALT_KEY; // Use production value

// Uncomment for testing
// const merchant_id = "PGTESTPAYUAT86";
// const salt_key = "96434309-7796-489d-8924-ab56988a6076";

// const base_url = process.env.BASE_URL;

// // API endpoint for order creation
// app.post("/order", async (req, res) => {
//   try {
//     const { MUID, trasactionId, amount, name, mobile, state } = req.body;

//     // Validate input
//     if (!trasactionId || !amount || !name || !mobile) {
//       return res.status(400).json({
//         message: "Missing required fields",
//         success: false,
//       });
//     }

//     const data = {
//       merchantId: merchant_id,
//       merchantTransactionId: trasactionId,
//       merchantUserId: MUID,
//       name: name,
//       amount: amount * 100, // Convert to the smallest currency unit
//       state:state,
//       redirectUrl: `https://elevatemyskill.onrender.com/status/?id=${trasactionId}`, // Production
//       // For testing: `http://localhost:8000/status/?id=${trasactionId}`,
//       redirectMode: "POST",
//       mobileNumber: mobile,
//       paymentInstrument: {
//         type: "PAY_PAGE",
//       },
//     };

//     const payload = JSON.stringify(data);
//     const payloadMain = Buffer.from(payload).toString("base64");
//     const keyIndex = 1;
//     const string = payloadMain + "/pg/v1/pay" + salt_key;
//     const sha256 = crypto.createHash("sha256").update(string).digest("hex");
//     const checksum = sha256 + "###" + keyIndex;

//     const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay"; // Production
//     // For testing: const prod_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";

//     const options = {
//       method: "POST",
//       url: prod_URL,
//       headers: {
//         accept: "application/json",
//         "Content-Type": "application/json",
//         "X-VERIFY": checksum,
//       },
//       data: {
//         request: payloadMain,
//       },
//     };

//     const response = await axios.request(options);
//     console.log("Order creation response:", response.data);

//     return res.json(response.data);
//   } catch (error) {
//     console.error("Error creating order:", error.response?.data || error.message);
//     res.status(500).json({
//       message: "Failed to create order",
//       success: false,
//       error: error.response?.data || error.message,
//     });
//   }
// });

// // API endpoint to check payment status
// app.get("/status", async (req, res) => {
//   try {
//     const merchantTransactionId = req.query.id;
//     const merchantId = merchant_id;

//     // Validate input
//     if (!merchantTransactionId) {
//       return res.status(400).json({
//         message: "Transaction ID is required",
//         success: false,
//       });
//     }

//     const keyIndex = 1;
//     const stringToHash =
//       `/pg/v1/status/${merchantId}/${merchantTransactionId}` + salt_key;
//     const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
//     const checksum = `${sha256}###${keyIndex}`;

//     const options = {
//       method: "GET",
//       url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`, // Production
//       // For testing: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`,
//       headers: {
//         accept: "application/json",
//         "Content-Type": "application/json",
//         "X-VERIFY": checksum,
//         "X-MERCHANT-ID": merchantId,
//       },
//     };

//     const response = await axios.request(options);
//     console.log("Payment status response:", response.data);

//     if (response.data.success === true) {
//       const url = `https://www.elevatemyskill.online/payment/success`; // Production success URL
//       return res.redirect(url);
//     } else {
//       const url = `https://www.elevatemyskill.online/payment/failure`; // Production failure URL
//       return res.redirect(url);
//     }
//   } catch (error) {
//     console.error("Error checking payment status:", error.response?.data || error.message);
//     return res.status(500).json({
//       message: "Failed to check payment status",
//       success: false,
//       error: error.response?.data || error.message,
//     });
//   }
// });

// Start Server
app.listen(PORT, () => {
  console.log(`Server is Running on PORT ${PORT}`);
});
