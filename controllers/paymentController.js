const crypto = require("crypto");
const axios = require("axios");

const merchant_id = process.env.MERCHANT_ID;
const salt_key = process.env.SALT_KEY;
const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay";

console.log("MID: ", merchant_id)
console.log("Salt Key: ", salt_key)

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
      amount: amount * 100,
      state: state,
      // Fix: Use template literals with backticks
      redirectUrl: `https://elevatemyskill.onrender.com/status/?id=${trasactionId}`,
      redirectMode: "POST",
      mobileNumber: mobile,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const payload = JSON.stringify(data);
    const payloadMain = Buffer.from(payload).toString("base64");
    const keyIndex = 1;
    const string = payloadMain + "/pg/v1/pay" + salt_key;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    // Fix: Use template literals with backticks
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

    if (!response.data.success) {
      throw new Error(response.data.message || "Payment initialization failed");
    }

    return res.json(response.data);
  } catch (error) {
    console.error("Error creating order:", error);

    // Improved error response
    res.status(500).json({
      message: "Failed to create order",
      success: false,
      error: {
        success: false,
        code: error.response?.status || "500",
        details: error.message,
      },
    });
  }
};

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
    // Fix: Use template literals with backticks
    const stringToHash =
      `/pg/v1/status/${merchant_id}/${merchantTransactionId}` + salt_key;
    const sha256 = crypto
      .createHash("sha256")
      .update(stringToHash)
      .digest("hex");
    const checksum = `${sha256}###${keyIndex}`;

    const options = {
      method: "GET",
      // Fix: Use template literals with backticks
      url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchant_id}/${merchantTransactionId}`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": merchant_id,
      },
    };

    const response = await axios.request(options);

    if (response.data.success === true) {
      return res.redirect("https://www.elevatemyskill.online/payment/success");
    } else {
      return res.redirect("https://www.elevatemyskill.online/payment/failure");
    }
  } catch (error) {
    console.error("Error checking payment status:", error);
    return res.status(500).json({
      message: "Failed to check payment status",
      success: false,
      error: {
        success: false,
        code: error.response?.status || "500",
        details: error.message,
      },
    });
  }
};

module.exports = { createOrder, checkPaymentStatus };
