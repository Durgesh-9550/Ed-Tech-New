const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactUs");

router.post("/receive-contact", contactController.receiveContactMail);
router.post("/send-response", contactController.sendContactMailResponse);

module.exports = router;
