const IncomeCategoryModel = require("../models/IncomeCategoryModel");
const ExpenseCategoryModel = require("../models/ExpenseCategoryModel");
const IncomeModel = require("../models/IncomeModel");
const ExpenseModel = require("../models/ExpenseModel");
const PlanModel = require("../models/PlanModel");
const TotalModel = require("../models/TotalModel");
const {
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
  getAnnualPlanSchema,
} = require("../validators/financeValidator");
const { date } = require("joi");

class FinanceController {
  // ============================
  // 🧾 INCOME CATEGORY CRUD
  // ============================
  async addIncomeCategory(req, res, next) {
    try {
      const userId = req.userId;

      const { error, value } = addCategorySchema.validate(req.body, {
        abortEarly: false,
        convert: true,
      });

      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu danh mục chi tiêu không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }
      const { name, color, icon } = value;

      await IncomeCategoryModel.add({ userId, name, color, icon });
      res.json({ success: true, message: "Thêm danh mục thu nhập thành công" });
    } catch (err) {
      next(err);
    }
  }

  async editIncomeCategory(req, res, next) {
    try {
      const { error } = editCategorySchema.validate(req.body, {
        abortEarly: false,
      });
      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu cập nhật danh mục không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }
      const userId = req.userId;
      const { category_id, name, color, icon } = req.body;

      const result = await IncomeCategoryModel.update({
        userId,
        category_id,
        name,
        color,
        icon,
      });

      res.json({
        success: true,
        message: "Cập nhật danh mục thu nhập thành công",
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteIncomeCategory(req, res, next) {
    try {
      const { error } = deleteCategorySchema.validate(req.body, {
        abortEarly: false,
      });
      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu cập nhật danh mục không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }

      const userId = req.userId;
      const { category_id } = req.body;

      await IncomeCategoryModel.delete({ userId, category_id });
      res.json({ success: true, message: "Xóa danh mục thu nhập thành công" });
    } catch (err) {
      next(err);
    }
  }

  async getIncomeCategories(req, res, next) {
    try {
      const userId = req.userId;
      const rows = await IncomeCategoryModel.getAll({ userId });
      res.json({ success: true, data: rows });
    } catch (err) {
      next(err);
    }
  }

  // ============================
  // 💸 EXPENSE CATEGORY CRUD
  // ============================
  async addExpenseCategory(req, res, next) {
    try {
      const userId = req.userId;

      const { error, value } = addCategorySchema.validate(req.body, {
        abortEarly: false,
        convert: true,
      });

      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu danh mục chi tiêu không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }
      const { name, color, icon } = value;

      await ExpenseCategoryModel.add({ userId, name, color, icon });
      res.json({ success: true, message: "Thêm danh mục chi tiêu thành công" });
    } catch (err) {
      next(err);
    }
  }

  async editExpenseCategory(req, res, next) {
    try {
      const userId = req.userId;
      const { error, value } = editCategorySchema.validate(req.body, {
        abortEarly: false,
      });
      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu cập nhật danh mục không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }
      const { category_id, name, color, icon } = value;

      const result = await ExpenseCategoryModel.update({
        userId,
        category_id,
        name,
        color,
        icon,
      });

      res.json({
        success: true,
        message: "Cập nhật danh mục thu nhập thành công",
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteExpenseCategory(req, res, next) {
    try {
      const userId = req.userId;

      const { error, value } = deleteCategorySchema.validate(req.body, {
        abortEarly: false,
        convert: true,
      });
      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu cập nhật danh mục không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }

      const { category_id } = value;

      await ExpenseCategoryModel.delete({ userId, category_id });
      res.json({ success: true, message: "Xóa danh mục chi tiêu thành công" });
    } catch (err) {
      next(err);
    }
  }

  async getExpenseCategories(req, res, next) {
    try {
      const userId = req.userId;
      const rows = await ExpenseCategoryModel.getAll({ userId });
      res.json({ success: true, data: rows });
    } catch (err) {
      next(err);
    }
  }

  // ============================
  // 💰 INCOME CRUD
  // ============================
  async addIncome(req, res, next) {
    try {
      const userId = req.userId;

      // Validate dữ liệu
      const { error, value } = addFinanceSchema.validate(req.body, {
        abortEarly: false,
        convert: true,
      });

      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu thêm thu nhập không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }

      const { categoryId, amount, date, description } = value;

      const result = await IncomeModel.add({
        userId,
        categoryId,
        amount,
        date,
        description,
      });

      if (result.requireConfirmation) {
        return res.status(200).json({
          success: false,
          requireConfirmation: true,
          message: result.message,
        });
      }

      res.status(201).json({
        success: true,
        message: "Thu nhập đã được lưu thành công",
        insertId: result.insertId,
      });
    } catch (err) {
      next(err);
    }
  }

  async confirmIncome(req, res, next) {
    try {
      const userId = req.userId;
      const { categoryId, amount, date, description } = req.body;

      // Gọi model để thêm chi tiêu mà không cần kiểm tra hạn mức
      const result = await IncomeModel.addConfirmed({
        userId,
        categoryId,
        amount,
        date,
        description,
      });

      res.status(201).json({
        success: true,
        message: "Thu nhập đã được thêm thành công sau khi xác nhận!",
        insertId: result.insertId,
      });
    } catch (err) {
      console.error("🔥 Error in confirmIncome:", err);
      next(err);
    }
  }

async editIncome(req, res, next) {
  try {
    const userId = req.userId;

    const { error, value } = editFinanceSchema.validate(req.body, {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      return next({
        status: 400,
        message: "Dữ liệu cập nhật thu nhập không hợp lệ",
        details: error.details.map((e) => e.message),
      });
    }

    const { id, categoryId, amount, date, description } = value;

    const result = await IncomeModel.update({
      id,
      userId,
      categoryId,
      amount,
      date,
      description,
    });

    if (result.requireConfirmation) {
      return res.status(200).json({
        success: false,
        requireConfirmation: true,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thu nhập thành công",
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error("🔥 Error in editIncome:", err);
    next(err);
  }
}


  async confirmEditIncome(req, res, next) {
     try {
      console.log("🟢 confirmEditExpense called");

      const userId = req.userId;
      const expenseId = req.params.id;
      const { category_id, amount, date, description } = req.body;

      const result = await IncomeModel.updateConfirmed({
        id: expenseId,
        userId,
        categoryId: category_id,
        amount,
        date,
        description,
      });

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thu nhập hoặc bạn không có quyền sửa.",
        });
      }

      res.status(200).json({
        success: true,
        message: "Thu nhập đã được sửa thành công sau khi xác nhận!",
      });
    } catch (err) {
      console.error("🔥 Error in confirmEditExpense:", err);
      next(err);
    }
  }

  async deleteIncome(req, res, next) {
    try {
      const userId = req.userId;

      const { error, value } = deleteFinanceSchema.validate(req.params, {
        abortEarly: false,
        convert: true,
      });

      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu xóa chi tiêu không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }

      const { id } = value;

      await IncomeModel.delete({ id, userId });
      res.json({ success: true, message: "Xóa thu nhập thành công" });
    } catch (err) {
      next(err);
    }
  }

  async getIncomesByMonth(req, res, next) {
    try {
      const userId = req.userId;

      // --- Validate query params ---
      const { error, value } = monthYearSchema.validate(req.query, {
        abortEarly: false,
      });
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }

      const { month, year } = value;

      // --- Lấy dữ liệu từ model ---
      let rows = await IncomeModel.getByMonth({ userId, month, year });

      // --- Nếu trả về null hoặc object, ép thành array ---
      if (!Array.isArray(rows)) {
        rows = rows ? [rows] : [];
      }

      // --- Trả về JSON ---
      return res.json({
        success: true,
        data: rows,
      });
    } catch (err) {
      console.error("❌ Error in getIncomesByMonth:", err);
      next(err);
    }
  }

  // ============================
  // 📉 EXPENSE CRUD
  // ============================
  async addExpense(req, res, next) {
    try {
      const userId = req.userId;

      // Validate dữ liệu
      const { error, value } = addFinanceSchema.validate(req.body, {
        abortEarly: false,
        convert: true,
      });

      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu thêm chi tiêu không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }

      // Lấy dữ liệu từ value chứ không phải req.value
      const { categoryId, amount, date, description } = value;

      const result = await ExpenseModel.add({
        userId,
        categoryId,
        amount,
        date,
        description,
      });

      if (result.requireConfirmation) {
        // trả về cho frontend hiện modal
        return res.status(200).json({
          success: false,
          requireConfirmation: true,
          message: result.message,
        });
      }

      res.status(201).json({
        success: true,
        message: "Chi tiêu đã được lưu thành công",
        insertId: result.insertId,
      });
    } catch (err) {
      next(err);
    }
  }

  async confirmExpense(req, res, next) {
    try {
      const userId = req.userId;
      const { categoryId, amount, date, description } = req.body;

      // Gọi model để thêm chi tiêu mà không cần kiểm tra hạn mức
      const result = await ExpenseModel.addConfirmed({
        userId,
        categoryId,
        amount,
        date,
        description,
      });

      res.status(201).json({
        success: true,
        message: "Chi tiêu đã được thêm thành công sau khi xác nhận!",
        insertId: result.insertId,
      });
    } catch (err) {
      console.error("🔥 Error in confirmExpense:", err);
      next(err);
    }
  }

  async editExpense(req, res, next) {
    try {
      const userId = req.userId;

      const { error, value } = editFinanceSchema.validate(req.body, {
        abortEarly: false,
        convert: true,
      });

      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu cập nhật chi tiêu không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }

      const { id, categoryId, amount, date, description } = value;

      // 🔹 Gọi model edit để kiểm tra hạn mức + kế hoạch
      const result = await ExpenseModel.update({
        id,
        userId,
        categoryId,
        amount,
        date,
        description,
      });

      // 🔹 Nếu cần xác nhận vượt hạn mức
      if (result.requireConfirmation) {
        return res.status(200).json({
          success: false,
          requireConfirmation: true,
          message: result.message,
        });
      }

      // 🔹 Nếu edit bình thường
      res.status(201).json({
        success: true,
        message: "Cập nhật chi tiêu thành công",
        affectedRows: result.affectedRows,
      });
    } catch (err) {
      next(err);
    }
  }

  async confirmEditExpense(req, res, next) {
    try {
      console.log("🟢 confirmEditExpense called");

      const userId = req.userId;
      const expenseId = req.params.id;
      const { category_id, amount, date, description } = req.body;

      const result = await ExpenseModel.updateConfirmed({
        id: expenseId,
        userId,
        categoryId: category_id,
        amount,
        date,
        description,
      });

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chi tiêu hoặc bạn không có quyền sửa.",
        });
      }

      res.status(200).json({
        success: true,
        message: "Chi tiêu đã được sửa thành công sau khi xác nhận!",
      });
    } catch (err) {
      console.error("🔥 Error in confirmEditExpense:", err);
      next(err);
    }
  }

  async deleteExpense(req, res, next) {
    try {
      const userId = req.userId;

      const { error, value } = deleteFinanceSchema.validate(req.params, {
        abortEarly: false,
        convert: true,
      });

      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu xóa chi tiêu không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }

      const { id } = value;

      await ExpenseModel.delete({ id, userId });
      res.json({ success: true, message: "Xóa chi tiêu thành công" });
    } catch (err) {
      next(err);
    }
  }

  async getExpensesByMonth(req, res, next) {
    try {
      const userId = req.userId;

      const { error, value } = monthYearSchema.validate(req.query, {
        abortEarly: false,
      });
      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }

      const { month, year } = value;

      const rows = await ExpenseModel.getByMonth({ userId, month, year });
      return res.json({ success: true, data: rows });
    } catch (err) {
      next(err);
    }
  }

  // ============================
  // 📊 PLANS
  // ============================
  async saveIncomePlan(req, res, next) {
    try {
      const userId = req.userId;

      const { error, value } = savePlanSchema.validate(req.body, {
        abortEarly: false,
        convert: true,
      });

      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu truy vấn không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }

      const { month, year, items } = value;

      const result = await PlanModel.saveIncomePlan({
        userId,
        month,
        year,
        items,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async saveExpensePlan(req, res, next) {
    try {
      const userId = req.userId;

      const { error, value } = savePlanSchema.validate(req.body, {
        abortEarly: false,
        convert: true,
      });

      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu truy vấn không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }

      const { month, year, items } = value;

      const result = await PlanModel.saveExpensePlan({
        userId,
        month,
        year,
        items,
      });

      res.json(result);
    } catch (err) {
      console.error("🔥 [saveExpensePlan] Lỗi server:", err);
      next(err);
    }
  }

  async getIncomePlan(req, res, next) {
    try {
      const userId = req.userId;

      const { error, value } = getPlanSchema.validate(req.query, {
        abortEarly: false,
        convert: true,
      });

      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu truy vấn không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }

      const { month, year } = value;

      const rows = await PlanModel.getIncomePlan({ userId, month, year });
      res.json({ success: true, data: rows });
    } catch (err) {
      next(err);
    }
  }


   async getAnnualIncomePlan(req, res, next) {
    try {
      const userId = req.userId;

      const { error, value } = getAnnualPlanSchema.validate(req.query, {
        abortEarly: false,
        convert: true,
      });

      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu truy vấn không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }

      const { year } = value;
      const rows = await PlanModel.getAnnualIncomePlan({ userId, year });

      res.json({ success: true, data: rows });
    } catch (err) {
      next(err);
    }
  }

  async getExpensePlan(req, res, next) {
    try {
      const userId = req.userId;

      const { error, value } = getPlanSchema.validate(req.query, {
        abortEarly: false,
        convert: true, // ✅ chuyển "10" -> 10 nếu là string
      });

      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu truy vấn không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }

      const { month, year } = value;
      const rows = await PlanModel.getExpensePlan({ userId, month, year });
      res.json({ success: true, data: rows });
    } catch (err) {
      next(err);
    }
  }

  async getAnnualExpensePlan(req, res, next) {
    try {
      const userId = req.userId;

      const { error, value } = getAnnualPlanSchema.validate(req.query, {
        abortEarly: false,
        convert: true,
      });

      if (error) {
        return next({
          status: 400,
          message: "Dữ liệu truy vấn không hợp lệ",
          details: error.details.map((e) => e.message),
        });
      }

      const { year } = value;
      const rows = await PlanModel.getAnnualExpensePlan({ userId, year });

      res.json({ success: true, data: rows });
    } catch (err) {
      next(err);
    }
  }
  

  async getTotalAmount(req, res, next) {
    try {
      const userId = req.userId;

      const { error } = getTotalAmountSchema.validate({ userId });
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const [rows] = await TotalModel.getTotalAmount({ userId });

      const totalAmount = rows?.totalAmount ?? 0;

      res.json({
        success: true,
        data: { totalAmount },
      });
    } catch (err) {
      next({ status: 500, message: "Lỗi khi lấy tổng số dư" });
    }
  }
}

module.exports = new FinanceController();
