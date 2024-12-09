const crypto = require("crypto");
const axios = require("axios");

// Production
const merchant_id = process.env.MERCHANT_ID;
const salt_key = process.env.SALT_KEY;

// Testing
// const merchant_id = "PGTESTPAYUAT86";
// const salt_key = "96434309-7796-489d-8924-ab56988a6076";

// For Production
const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay";

// For testing:
// const prod_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";

const createOrder = async (req, res) => {
  try {
    const { MUID, transactionId, amount, name, mobile, state } = req.body;

    // Validate input
    if (!transactionId || !amount || !name || !mobile || !state) {
      return res.status(400).json({
        message: "Missing required fields",
        success: false,
      });
    }

    const data = {
      merchantId: merchant_id,
      merchantTransactionId: transactionId,
      merchantUserId: MUID,
      name: name,
      amount: amount * 100,
      state: state,
      redirectUrl: `https://elevatemyskill.onrender.com/status/?id=${transactionId}`,
      // redirectUrl: `http://localhost:8000/status/?id=${transactionId}`,
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
    const merchantId = merchant_id;

    if (!merchantTransactionId) {
      return res.status(400).json({
        message: "Transaction ID is required",
        success: false,
      });
    }

    const keyIndex = 1;
    const stringToHash =
      `/pg/v1/status/${merchantId}/${merchantTransactionId}` + salt_key;
    const sha256 = crypto
      .createHash("sha256")
      .update(stringToHash)
      .digest("hex");
    const checksum = `${sha256}###${keyIndex}`;

    const options = {
      method: "GET",
      // For Production
      url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`,
      // For testing:
      // url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": merchantId,
      },
    };

    const response = await axios.request(options);
    console.log("Status API: ", response);

    if (response.data.success === true) {
      const url = "https://www.elevatemyskill.online/payment/success";
      return res.redirect(url);
    } else {
      const url = "https://www.elevatemyskill.online/payment/failure";
      return res.redirect(url);
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
