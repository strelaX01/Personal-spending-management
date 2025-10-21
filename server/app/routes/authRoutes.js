const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const authMiddleware = require("../middlewares/authMiddleware");

// 🧩 Đăng ký tài khoản
router.post("/register", (req, res, next) =>
  AuthController.register(req, res, next)
);

// 🧩 Xác minh tài khoản
router.post("/verify", (req, res, next) =>
  AuthController.verify(req, res, next)
);

// 🧩 Gửi lại mã xác minh
router.post("/resend", (req, res, next) =>
  AuthController.resend(req, res, next)
);

// 🧩 Đăng nhập
router.post("/login", (req, res, next) => AuthController.login(req, res, next));

// 🧩 Quên mật khẩu (gửi mail reset)
router.post("/forgot-password", (req, res, next) =>
  AuthController.forgot(req, res, next)
);

router.post("/forgot-password/verify", (req, res, next) =>
  AuthController.forgotVerify(req, res, next)
);

// 🧩 Đặt lại mật khẩu (sau khi nhập mã từ email)
router.post("/reset", (req, res, next) => AuthController.reset(req, res, next));

// 🧩 Đổi mật khẩu (khi đã đăng nhập)
router.put("/change-password", authMiddleware, (req, res, next) =>
  AuthController.changePassword(req, res, next)
);

router.put("/change-userName", authMiddleware, (req, res, next) =>
  AuthController.changeUserName(req, res, next)
);

module.exports = router;
