const Joi = require("joi");

// Validate khi đăng ký
const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty": "Email không được để trống",
      "string.email": "Email không hợp lệ",
      "any.required": "Email là bắt buộc",
    }),
  password: Joi.string().min(8).required().messages({
    "string.empty": "Mật khẩu không được để trống",
    "string.min": "Mật khẩu tối thiểu 8 ký tự",
    "any.required": "Mật khẩu là bắt buộc",
  }),
  repassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "string.empty": "Vui lòng nhập lại mật khẩu",
    "any.only": "Mật khẩu nhập lại không khớp",
    "any.required": "Vui lòng nhập lại mật khẩu",
  }),
  firstname: Joi.string().allow(""),
  lastname: Joi.string().allow(""),
});

// Validate khi login
const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } }) // không ép TLD (cho test local)
    .required()
    .messages({
      "string.empty": "Email không được để trống",
      "string.email": "Email không hợp lệ",
      "any.required": "Email là bắt buộc",
    }),

  password: Joi.string().trim().min(8).max(50).required().messages({
    "string.empty": "Mật khẩu không được để trống",
    "string.min": "Mật khẩu phải có ít nhất 8 ký tự",
    "string.max": "Mật khẩu không được quá 50 ký tự",
    "any.required": "Mật khẩu là bắt buộc",
  }),
});

// 🧩 Validate khi xác minh tài khoản
const verifySchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty": "Email không được để trống",
      "string.email": "Email không hợp lệ",
      "any.required": "Email là bắt buộc",
    }),

  code: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({
      "string.empty": "Mã xác minh không được để trống",
      "string.pattern.base": "Mã xác minh phải gồm 6 chữ số",
      "any.required": "Mã xác minh là bắt buộc",
    }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email không được để trống",
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
});

const forgotVerifySchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email không được để trống",
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
  code: Joi.string().required().messages({
    "string.empty": "Mã xác minh không được để trống",
    "any.required": "Mã xác minh là bắt buộc",
  }),
});

//validate quên mật khẩu
const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
  code: Joi.string().required().messages({
    "any.required": "Mã đặt lại là bắt buộc",
  }),
});

// Validate đổi mật khẩu

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    "string.empty": "Mật khẩu cũ không được để trống",
    "any.required": "Vui lòng nhập mật khẩu cũ",
  }),

  newPassword: Joi.string().min(8).required().messages({
    "string.empty": "Mật khẩu mới không được để trống",
    "string.min": "Mật khẩu mới phải có ít nhất 8 ký tự",
    "any.required": "Vui lòng nhập mật khẩu mới",
  }),

  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "string.empty": "Vui lòng nhập lại mật khẩu xác nhận",
      "any.only": "Mật khẩu xác nhận không khớp",
      "any.required": "Vui lòng xác nhận mật khẩu",
    }),
});

const changeUserNameSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-zÀ-ỹ\s'-]+$/)
    .required()
    .messages({
      "string.empty": "Tên không được để trống",
      "string.min": "Tên phải có ít nhất 2 ký tự",
      "string.max": "Tên không được vượt quá 50 ký tự",
      "string.pattern.base":
        "Tên chỉ được chứa chữ cái, khoảng trắng, dấu - và '",
      "any.required": "Thiếu trường firstName",
    }),

  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-zÀ-ỹ\s'-]+$/)
    .required()
    .messages({
      "string.empty": "Họ không được để trống",
      "string.min": "Họ phải có ít nhất 2 ký tự",
      "string.max": "Họ không được vượt quá 50 ký tự",
      "string.pattern.base":
        "Họ chỉ được chứa chữ cái, khoảng trắng, dấu - và '",
      "any.required": "Thiếu trường lastName",
    }),
});
module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  verifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  forgotVerifySchema,
  changeUserNameSchema,
};
