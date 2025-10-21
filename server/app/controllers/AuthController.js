const bcrypt = require("bcrypt");
const UserModel = require("../models/UserModel");
const Mailer = require("../services/Mailer");
const TokenService = require("../services/TokenService");
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifySchema,
  forgotVerifySchema,
  changeUserNameSchema,
} = require("../validators/authValidator");
const {
  generateVerificationCode,
  validatePassword,
  generateRandomPassword,
} = require("../utils/helpers");

class AuthController {
  constructor() {
    this.codes = new Map(); // Lưu email -> code tạm
  }

  setTempCode(email, code, ttl = 15 * 60 * 1000) {
    this.codes.set(email, code);
    setTimeout(() => this.codes.delete(email), ttl);
  }

  // 🧩 Đăng ký
  async register(req, res, next) {
    try {
      const { error } = registerSchema.validate(req.body, {
        abortEarly: false,
      });
      if (error)
        return next({
          status: 400,
          message: "Dữ liệu không hợp lệ",
          details: error.details.map((e) => e.message),
        });

      const { email, password } = req.body;

      const existing = await UserModel.findByEmail(email);
      if (existing) return next({ status: 400, message: "Email đã tồn tại" });

      const firstParts = ["Alex", "Taylor", "Jamie", "Sam", "Chris", "Robin"];
      const lastParts = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Do"];

      const firstname =
        firstParts[Math.floor(Math.random() * firstParts.length)];
      const lastname = lastParts[Math.floor(Math.random() * lastParts.length)];

      const hashed = await bcrypt.hash(password, 10);
      await UserModel.create({ firstname, lastname, email, password: hashed });

      const code = generateVerificationCode();
      this.setTempCode(email, code);

      await Mailer.sendMail({
        to: email,
        subject: "Mã xác minh tài khoản",
        text: `Mã xác minh của bạn là: ${code}`,
      });

      res.json({
        success: true,
        message:
          "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.",
      });
    } catch (err) {
      next(err);
    }
  }

  // 🧩 Xác minh tài khoản
  async verify(req, res, next) {
    try {
      const { error } = verifySchema.validate(req.body, { abortEarly: false });
      if (error)
        return next({
          status: 400,
          message: "Dữ liệu xác minh không hợp lệ",
          details: error.details.map((e) => e.message),
        });

      const { email, code } = req.body;
      const saved = this.codes.get(email);

      if (!saved)
        return next({
          status: 400,
          message: "Mã đã hết hạn hoặc chưa được gửi",
        });

      if (String(code) !== String(saved))
        return next({ status: 401, message: "Mã xác minh không hợp lệ" });

      await UserModel.verify(email);
      this.codes.delete(email);

      res.json({ success: true, message: "Xác minh tài khoản thành công" });
    } catch (err) {
      next(err);
    }
  }

  // 🧩 Gửi lại mã xác minh
  async resend(req, res, next) {
    try {
      const { email } = req.body;
      console.log("email", email);
      const user = await UserModel.findByEmail(email);

      if (!user)
        return next({
          status: 404,
          message: "Không tìm thấy người dùng với email này",
        });

      const code = generateVerificationCode();
      this.setTempCode(email, code);

      await Mailer.sendMail({
        to: email,
        subject: "Mã xác minh (gửi lại)",
        text: `Mã xác minh mới của bạn là: ${code}`,
      });

      res.json({ success: true, message: "Mã xác minh đã được gửi lại" });
    } catch (err) {
      next(err);
    }
  }

  // 🧩 Đăng nhập
  async login(req, res, next) {
    try {
      const { error } = loginSchema.validate(req.body, { abortEarly: false });
      if (error)
        return next({
          status: 400,
          message: "Dữ liệu đăng nhập không hợp lệ",
          details: error.details.map((e) => e.message),
        });

      const { email, password } = req.body;
      const user = await UserModel.findByEmail(email);

      if (!user)
        return next({ status: 401, message: "Email hoặc mật khẩu không đúng" });

      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid)
        return next({ status: 401, message: "Email hoặc mật khẩu không đúng" });

      if (!user.verification) {
        const code = generateVerificationCode();
        this.setTempCode(email, code);

        await Mailer.sendMail({
          to: email,
          subject: "Xác minh tài khoản",
          text: `Mã xác minh của bạn là: ${code}`,
        });

        return next({
          status: 403,
          message:
            "Tài khoản chưa được xác minh. Mã mới đã được gửi qua email.",
        });
      }

      const token = TokenService.generateToken({ userId: user.user_id });

      res.status(200).json({
        success: true,
        message: "Đăng nhập thành công",
        token,
        user: {
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // 🧩 Quên mật khẩu
  async forgot(req, res, next) {
    console.log("sdsd");
    try {
      const { error } = forgotPasswordSchema.validate(req.body, {
        abortEarly: false,
      });
      if (error)
        return next({
          status: 400,
          message: "Dữ liệu không hợp lệ",
          details: error.details.map((e) => e.message),
        });

      const { email } = req.body;
      const user = await UserModel.findByEmail(email);

      if (!user)
        return next({
          status: 404,
          message: "Không tìm thấy người dùng với email này",
        });

      const code = generateVerificationCode();
      this.setTempCode(email, code);

      await Mailer.sendMail({
        to: email,
        subject: "Mã đặt lại mật khẩu",
        text: `Mã đặt lại mật khẩu của bạn là: ${code}`,
      });

      res.json({
        success: true,
        message: "Mã đặt lại mật khẩu đã được gửi qua email",
      });
    } catch (err) {
      next(err);
    }
  }

  async forgotVerify(req, res, next) {
    console.log("da goi toi day");
    try {
      const { error } = forgotVerifySchema.validate(req.body, {
        abortEarly: false,
      });
      if (error)
        return next({
          status: 400,
          message: "Dữ liệu không hợp lệ",
          details: error.details.map((e) => e.message),
        });

      const { email, code } = req.body;
      const savedCode = this.codes.get(email);

      if (!savedCode)
        return next({
          status: 404,
          message: "Mã xác minh đã hết hạn hoặc chưa được yêu cầu",
        });

      if (String(code) !== String(savedCode))
        return next({
          status: 401,
          message: "Mã xác minh không hợp lệ",
        });

      // ✅ Xóa mã sau khi xác minh
      this.codes.delete(email);

      // ✅ Sinh mật khẩu ngẫu nhiên
      const newPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // ✅ Cập nhật vào DB
      await UserModel.updatePassword(email, hashedPassword);

      // ✅ Gửi mail mật khẩu mới
      await Mailer.sendMail({
        to: email,
        subject: "Mật khẩu mới của bạn",
        text: `Mật khẩu mới của bạn là: ${newPassword}`,
      });

      res.json({
        success: true,
        message: "Mật khẩu mới đã được tạo và gửi qua email thành công.",
      });
    } catch (err) {
      next(err);
    }
  }

  // 🧩 Đặt lại mật khẩu
  async reset(req, res, next) {
    try {
      const { error } = resetPasswordSchema.validate(req.body, {
        abortEarly: false,
      });
      if (error)
        return next({
          status: 400,
          message: "Dữ liệu không hợp lệ",
          details: error.details.map((e) => e.message),
        });

      const { email, code, newPassword } = req.body;
      const saved = this.codes.get(email);

      if (!saved || String(code) !== String(saved))
        return next({
          status: 400,
          message: "Mã không hợp lệ hoặc đã hết hạn",
        });

      const hashed = await bcrypt.hash(newPassword, 10);
      await UserModel.updatePasswordByEmail(email, hashed);

      this.codes.delete(email);

      res.json({ success: true, message: "Đặt lại mật khẩu thành công" });
    } catch (err) {
      next(err);
    }
  }

  // 🧩 Đổi mật khẩu
  async changePassword(req, res, next) {
    try {
      const { error } = changePasswordSchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu đổi mật khẩu không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }

      const userId = req.userId;
      const { oldPassword, newPassword, confirmPassword } = req.body;

      if (!userId) {
        return next({ status: 401, message: "Không xác định được người dùng" });
      }


      if (newPassword !== confirmPassword) {
        return next({
          status: 400,
          message: "Mật khẩu mới và xác nhận mật khẩu không khớp",
        });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return next({ status: 404, message: "Người dùng không tồn tại" });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return next({ status: 401, message: "Mật khẩu cũ không đúng" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updated = await UserModel.updatePasswordById(
        userId,
        hashedPassword
      );

      if (!updated) {
        return next({ status: 500, message: "Không thể cập nhật mật khẩu" });
      }

      return res.json({
        success: true,
        message: "Đổi mật khẩu thành công",
      });
    } catch (err) {
      console.error("❌ Lỗi changePassword:", err);
      next(err);
    }
  }

async changeUserName(req, res) {
  try {

    const userId = req.userId;

    const { error, value } = changeUserNameSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      console.warn("⚠️ Lỗi validate dữ liệu:", error.details);
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
        details: error.details.map((d) => d.message),
      });
    }

    const { firstName, lastName } = value;
    console.log("✅ Dữ liệu hợp lệ:", { firstName, lastName });

    const updatedUser = await UserModel.changeUserName(userId, firstName, lastName);

    if (!updatedUser) {
      console.warn("⚠️ Không tìm thấy user hoặc không có thay đổi:", userId);
      return res.status(404).json({
        message: "Không tìm thấy người dùng hoặc không có thay đổi",
      });
    }

    console.log("✅ Cập nhật thành công:", updatedUser);

    return res.status(200).json({
      message: "Cập nhật tên người dùng thành công",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ Lỗi changeUserName:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
}

}

module.exports = new AuthController();
