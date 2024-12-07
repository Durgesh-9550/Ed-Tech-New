const crypto = require("crypto");
const axios = require("axios");

const merchant_id = process.env.MERCHANT_ID; // Use production value
const salt_key = process.env.SALT_KEY; // Use production value

// Uncomment for testing
// const merchant_id = "PGTESTPAYUAT86";
// const salt_key = "96434309-7796-489d-8924-ab56988a6076";

const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay"; // Production
// For testing: const prod_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";

// Create order
const createOrder = async (req, res) => {
  try {
    const { MUID, trasactionId, amount, name, mobile, state } = req.body;

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
      merchantUserId: MUID,
      name: name,
      amount: amount * 100, // Convert to smallest currency unit
      state: state,
      redirectUrl: `https://elevatemyskill.onrender.com/status/?id=${trasactionId}`, // Production
      redirectMode: "POST",
      mobileNumber: mobile,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const payload = JSON.stringify(data);
    const payloadMain = Buffer.from(payload).toString("base64");
    const keyIndex = 1;
    const string = payloadMain + "/pg/v1/pay" + salt_key;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = `${sha256}###${keyIndex}`;

    const options = {
      method: "POST",
      url: prod_URL,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      data: { request: payloadMain },
    };

    const response = await axios.request(options);
    console.log("Order creation response:", response.data);

    return res.json(response.data);
  } catch (error) {
    console.error(
      "Error creating order:",
      error.response?.data || error.message
    );
    res.status(500).json({
      message: "Failed to create order",
      success: false,
      error: error.response?.data || error.message,
    });
  }
};

// Check payment status
const checkPaymentStatus = async (req, res) => {
  try {
    const merchantTransactionId = req.query.id;

    if (!merchantTransactionId) {
      return res.status(400).json({
        message: "Transaction ID is required",
        success: false,
      });
    }

    const keyIndex = 1;
    const stringToHash =
      `/pg/v1/status/${merchant_id}/${merchantTransactionId}` + salt_key;
    const sha256 = crypto
      .createHash("sha256")
      .update(stringToHash)
      .digest("hex");
    const checksum = `${sha256}###${keyIndex}`;

    const options = {
      method: "GET",
      url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchant_id}/${merchantTransactionId}`, // Production
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": merchant_id,
      },
    };

    const response = await axios.request(options);
    console.log("Payment status response:", response.data);

    if (response.data.success === true) {
      return res.redirect("https://www.elevatemyskill.online/payment/success");
    } else {
      return res.redirect("https://www.elevatemyskill.online/payment/failure");
    }
  } catch (error) {
    console.error(
      "Error checking payment status:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      message: "Failed to check payment status",
      success: false,
      error: error.response?.data || error.message,
    });
  }
};

module.exports = { createOrder, checkPaymentStatus };
