const Joi = require("joi");

// ============================
// 📊 VALIDATE CATEGORY
// ============================

const addCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(50).required().messages({
    "string.empty": "Tên danh mục là bắt buộc",
    "string.min": "Tên danh mục phải có ít nhất 1 ký tự",
    "string.max": "Tên danh mục không được vượt quá 50 ký tự",
    "any.required": "Thiếu tên danh mục chi tiêu",
  }),
  color: Joi.string()
    .pattern(/^#([0-9A-Fa-f]{3}){1,2}$/)
    .default("#000000")
    .messages({
      "string.pattern.base":
        "Mã màu không hợp lệ (phải ở dạng hex như #FF0000)",
    }),
  icon: Joi.string().allow("").max(100).messages({
    "string.max": "Tên icon không được vượt quá 100 ký tự",
  }),
});

const editCategorySchema = Joi.object({
  category_id: Joi.number().integer().required().messages({
    "any.required": "category_id là bắt buộc",
    "number.base": "category_id phải là số",
  }),
  name: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Tên danh mục không được để trống",
    "any.required": "Tên danh mục là bắt buộc",
  }),
  color: Joi.string()
    .pattern(/^#([0-9A-F]{3}){1,2}$/i)
    .required()
    .messages({
      "string.pattern.base": "Màu không hợp lệ (phải là mã hex, ví dụ #FF5733)",
      "any.required": "Màu là bắt buộc",
    }),
  icon: Joi.string().trim().min(1).required().messages({
    "string.empty": "Biểu tượng không được để trống",
    "any.required": "Biểu tượng là bắt buộc",
  }),
});

const deleteCategorySchema = Joi.object({
  category_id: Joi.number().integer().required().messages({
    "any.required": "category_id là bắt buộc",
    "number.base": "category_id phải là số",
  }),
});

// ============================
// 📊 VALIDATE PLAN
// ============================

const getPlanSchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required().messages({
    "number.base": `"month" phải là số`,
    "number.min": `"month" phải từ 1 đến 12`,
    "number.max": `"month" phải từ 1 đến 12`,
    "any.required": `"month" là bắt buộc`,
  }),

  year: Joi.number().integer().min(2000).max(2100).required().messages({
    "number.base": `"year" phải là số`,
    "number.min": `"year" phải >= 2000"`,
    "number.max": `"year" không được vượt quá 2100"`,
    "any.required": `"year" là bắt buộc"`,
  }),
});

const savePlanSchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required().messages({
    "any.required": "Tháng là bắt buộc",
    "number.base": "Tháng phải là số",
  }),
  year: Joi.number().integer().min(2000).required().messages({
    "any.required": "Năm là bắt buộc",
    "number.base": "Năm phải là số",
  }),
  items: Joi.array()
    .items(
      Joi.object({
        category_id: Joi.number().integer().required().messages({
          "any.required": "category_id là bắt buộc",
          "number.base": "category_id phải là số",
        }),
        amount: Joi.number().required().messages({
          "any.required": "amount là bắt buộc",
          "number.base": "amount phải là số",
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.base": "items phải là một mảng",
      "array.min": "Phải có ít nhất một mục trong danh sách items",
    }),
});

// ============================
// 📊 VALIDATE FINANCE
// ============================

const addFinanceSchema = Joi.object({
  categoryId: Joi.number().integer().required().messages({
    "any.required": "danh mục là bắt buộc",
    "number.base": "danh mục phải là số nguyên",
  }),

  amount: Joi.number().positive().required().messages({
    "any.required": "số tiền là bắt buộc",
    "number.base": "số tiền phải là số",
    "number.positive": "số tiền phải lớn hơn 0",
  }),

  date: Joi.date().iso().required().messages({
    "any.required": "ngày là bắt buộc",
    "date.base": "ngày phải là kiểu ngày hợp lệ",
    "date.format": "ngày phải ở định dạng ISO (YYYY-MM-DD hoặc ISO string)",
  }),

  description: Joi.string().allow(null, "").max(255).messages({
    "string.max": "mô tả không được vượt quá 255 ký tự",
  }),
});

const editFinanceSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "ID phải là số",
    "number.integer": "ID phải là số nguyên",
    "number.positive": "ID phải lớn hơn 0",
    "any.required": "Thiếu ID tài chính cần chỉnh sửa",
  }),
  categoryId: Joi.number().integer().positive().required().messages({
    "number.base": "Category ID phải là số",
    "any.required": "Thiếu danh mục tài chính",
  }),
  amount: Joi.number().min(0).required().messages({
    "number.base": "Số tiền phải là số",
    "number.min": "Số tiền không được âm",
    "any.required": "Thiếu số tiền tài chính",
  }),
  date: Joi.date().required().messages({
    "date.base": "Ngày không hợp lệ",
    "any.required": "Thiếu ngày tài chính",
  }),
  description: Joi.string().allow("").max(255).messages({
    "string.base": "Mô tả phải là chuỗi",
    "string.max": "Mô tả không được vượt quá 255 ký tự",
  }),
});

const deleteFinanceSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "ID phải là số",
    "number.integer": "ID phải là số nguyên",
    "number.positive": "ID phải lớn hơn 0",
    "any.required": "Thiếu ID tài chính cần xóa",
  }),
});

const monthYearSchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required().messages({
    "any.required": "month là bắt buộc",
    "number.base": "month phải là số",
    "number.min": "month không hợp lệ",
    "number.max": "month không hợp lệ",
  }),
  year: Joi.number().integer().min(2000).max(2100).required().messages({
    "any.required": "year là bắt buộc",
    "number.base": "year phải là số",
    "number.min": "year không hợp lệ",
    "number.max": "year không hợp lệ",
  }),
});

const getAnnualPlanSchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).required(),
});

const getTotalAmountSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
});

module.exports = {
  monthYearSchema,
  addCategorySchema,
  editCategorySchema,
  deleteCategorySchema,
  addFinanceSchema,
  editFinanceSchema,
  deleteFinanceSchema,
  getTotalAmountSchema,
  getPlanSchema,
  savePlanSchema,
  getAnnualPlanSchema
};
