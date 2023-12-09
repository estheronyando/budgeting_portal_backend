const User = require("../models/userSchema");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { createUser, generateAuthToken, pool } = require("../models/userSchema");



const signup = async (req, res) => {
  const { fname, lname, password, phone, gender, email } = req.body;

  try {
    const userId = await createUser(fname, lname, password, phone, gender, email);
    const token = await generateAuthToken(userId);

    res.cookie("auth_token", token, {
      maxAge: 2629800000,
      httpOnly: true,
    });

    const response = {
      header: {
        requestRefId: "{{$guid}}",
        responseCode: 201,
        responseMessage: "User registration successful",
        customerMessage: "1",
        timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
      },
      body: [
        {
          success: true,
          message: "User registration successful",
          userId: userId,
          token:token
          // Add other user-related properties if needed
        },
      ],
    };

    res.status(201).json(response);
  } catch (error) {
    console.error(error);

    let responseCode = 500;
    let responseMessage = "Internal Server Error";
    let customerMessage = "0";

    if (error.name === 'ValidationError') {
      responseCode = 400;
      responseMessage = "Invalid data or invalid syntax";
      customerMessage = "0";
    } else if (error.name === 'UniqueConstraintViolationError') {
      responseCode = 409;
      responseMessage = "Phone number already exists";
      customerMessage = "0";
    }

    const response = {
      header: {
        requestRefId: "{{$guid}}",
        responseCode,
        responseMessage,
        customerMessage,
        timestamp: new Date().toISOString(),
      },
      body: [
        {
          success: false,
          message: error.message || "Internal Server Error",
        },
      ],
    };

    res.status(responseCode).json(response);
  }
};