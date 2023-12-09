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


const isExistPhone = async (req, res) => {
  const phoneNumber = req.body.phone;

  try {
    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phoneNumber]);
    if (result.rows.length > 0) {
      res.json({ code: 200, isExist: true });
    } else {
      res.send({ code: 200, isExist: false });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ code: 400, message: "Couldn't understand request" });
  }
};

const authentication = async (req, res) => {
  try {
    const token = req.cookies.auth_token;
    if (token) {
      const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1 AND $2 = ANY(tokens)',
        [verifyToken._id, token]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];

        res.status(200).json({
          code: 200,
          isAuthenticate: true,
          user: {
            ...user,
            _id: user.id.toString(),
          },
        });
      } else {
        res.status(401).json({
          code: 401,
          isAuthenticate: false,
          message: "invalid provided token. Test",
        });
      }
    } else {
      res.status(401).json({
        code: 401,
        isAuthenticate: false,
        message: "invalid provided token. Test",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(401).json({
      code: 401,
      isAuthenticate: false,
      message: "invalid provided token.",
    });
  }
};

const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Retrieve user from PostgreSQL
    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    const userLogin = result.rows[0];

    if (!userLogin) {
      return res.status(401).json({
        isLogin: false,
        message: "login/invalid-phone-or-password"
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, userLogin.password);

    if (isMatch) {
      // Generate and save a new token to the database
      const token = await generateAuthToken(userLogin.id);

      // Set the token as an HTTP-only cookie
      res.cookie("auth_token", token, {
        maxAge: 2629800000,
        httpOnly: true,
      });

      res.json({
        isLogin: true,
        message: "User Login Successfully"
      });
    } else {
      res.status(401).json({
        isLogin: false,
        message: "login/invalid-phone-or-password"
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      isLogin: false,
      error: error.message || "Internal Server Error"
    });
  }
};

const loginWithMobileNumber = async (req, res) => {
  try {
    const { phone } = req.body;

    // Retrieve user from PostgreSQL
    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    const userLogin = result.rows[0];

    if (!userLogin) {
      return res.status(401).json({ isLogin: false });
    }

    // Generate and save a new token to the database
    const token = await generateAuthToken(userLogin.id);

    // Set the token as an HTTP-only cookie
    res.cookie("auth_token", token, {
      maxAge: 2629800000,
      httpOnly: true,
    });

    res.json({ isLogin: true, message: "User Login Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isLogin: false, error: error.message || "Internal Server Error" });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.auth_token;
    if (token) {
      const verifyToken = jwt.verify(token, process.env.SECRET_KEY);

      // Update tokens array by filtering out the specified token
     
      await pool.query(
        'UPDATE users SET tokens = tokens - $1 WHERE id = $2',
        [token, verifyToken._id]
      );

      res.clearCookie("auth_token", { path: "/" });

      res.status(200).json({
        code: 200,
        isLogout: true,
      });
    } else {
      res.status(401).json({
        code: 401,
        isLogout: false,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      isLogout: false,
      error: error.message || "Internal Server Error",
    });
  }
};

const updateUserInfo = async (req, res) => {
  const { id, fname, lname, gender } = req.body;
  try {
    // Perform the update in PostgreSQL
    const result = await pool.query(
      'UPDATE users SET fname = $1, lname = $2, gender = $3 WHERE id = $4',
      [fname, lname, gender, id]
    );

    // Check if any rows were affected
    if (result.rowCount > 0) {
      res.status(200).json({
        isUpdated: true,
      });
    } else {
      // If no rows were affected, the user with the given id was not found
      res.status(404).json({
        code: 404,
        isUpdated: false,
        message: "User not found",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      isUpdated: false,
      error: error.message || "Internal Server Error",
    });
  }
};



module.exports = {
  signup,
  isExistPhone,
  authentication,
  login,
  loginWithMobileNumber,
  logout,
  updateUserInfo,
  // Other functions...
};
