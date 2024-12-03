const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");

const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");

const OTP = require("../models/OTP");
const User = require("../models/User");
const Profile = require("../models/Profile");

require("dotenv").config();

// Signup Controller for Registering Users
exports.signup = async (req, res) => {
  try {
    // Destructure fields from the request body
    const {
      name,
      email,
      password,
      phone,
      confirmPassword,
      accountType,
      contactNumber,
    } = req.body;

    // Check if all required fields are provided
    if (!name || !email || !password || !phone || !confirmPassword) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if password and confirm password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Password and Confirm Password do not match. Please try again.",
      });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please sign in to continue.",
      });
    }

    // // Find the most recent OTP for the email
    // const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
    // if (response.length === 0 || otp !== response[0].otp.toString()) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "The OTP is not valid",
    //   });
    // }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine approval status based on account type
    const approved = accountType === "Instructor" ? false : true;

    // Create additional profile for the user
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });

    const [firstName, lastName] = name?.split(" ") || [];
    // Create the user
    const user = await User.create({
      name,
      email,
      contactNumber,
      password: hashedPassword,
      accountType: accountType,
      approved: approved,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    return res.status(200).json({
      success: true,
      user,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again.",
    });
  }
};

// Login controller for authenticating users
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email or password is missing
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill up all the required fields",
      });
    }

    // Find user with provided email
    const user = await User.findOne({ email }).populate("additionalDetails");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User is not registered. Please sign up to continue.",
      });
    }

    // Validate password and generate JWT token
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        { email: user.email, id: user._id, accountType: user.accountType },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      user.token = token;
      user.password = undefined;

      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };

      return res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "User login success",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

// Send OTP for email verification
exports.sendotp = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user already exists
    const checkUserPresent = await User.findOne({ email });
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User is already registered",
      });
    }

    let otp;
    let result;
    do {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp });
    } while (result);

    const otpPayload = { email, otp };
    await OTP.create(otpPayload);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error sending OTP. Please try again.",
    });
  }
};

// Controller for changing password
exports.changePassword = async (req, res) => {
  try {
    const userDetails = await User.findById(req.user.id);
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    // Check if the old password is correct
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "The old password is incorrect",
      });
    }

    // Check if the new password matches the confirmation password
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    // Encrypt the new password
    const encryptedPassword = await bcrypt.hash(newPassword, 10);

    // Send the email after password update
    try {
      const emailContent = passwordUpdated(
        userDetails.email,
        `Password updated successfully for ${userDetails.firstName} ${userDetails.lastName}`
      );

      console.log("Email Content:", emailContent); // Log email content for debugging

      const emailResponse = await mailSender(userDetails.email, emailContent);
      console.log("Email sent successfully:", emailResponse.response);

      // Update the password in the database
      await User.findByIdAndUpdate(req.user.id, {
        password: encryptedPassword,
      });

      return res.status(200).json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error("Error occurred while sending email:", error);
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
      });
    }
  } catch (error) {
    console.error("Error occurred while updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
    });
  }
};
