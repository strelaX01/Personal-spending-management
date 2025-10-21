const express = require("express");
const router = express.Router();
const FinanceController = require("../controllers/FinanceController");
const authMiddleware = require("../middlewares/authMiddleware");

// 🧾 ========== TOTAL AMOUNT ==========

router.get("/getTotalAmount", authMiddleware, (req, res, next) => {
  FinanceController.getTotalAmount(req, res, next);
});
// 🧾 ========== INCOME CATEGORIES ==========
router.post("/income/category", authMiddleware, (req, res, next) =>
  FinanceController.addIncomeCategory(req, res, next)
);
router.put("/income/category", authMiddleware, (req, res, next) =>
  FinanceController.editIncomeCategory(req, res, next)
);
router.delete("/income/category", authMiddleware, (req, res, next) =>
  FinanceController.deleteIncomeCategory(req, res, next)
);
router.get("/income/categories", authMiddleware, (req, res, next) =>
  FinanceController.getIncomeCategories(req, res, next)
);


// 💸 ========== EXPENSE CATEGORIES ==========
router.post("/expense/category", authMiddleware, (req, res, next) =>
  FinanceController.addExpenseCategory(req, res, next)
);
router.put("/expense/category", authMiddleware, (req, res, next) =>
  FinanceController.editExpenseCategory(req, res, next)
);
router.delete("/expense/category", authMiddleware, (req, res, next) =>
  FinanceController.deleteExpenseCategory(req, res, next)
);
router.get("/expense/categories", authMiddleware, (req, res, next) =>
  FinanceController.getExpenseCategories(req, res, next)
);

// 💰 ========== INCOME ==========
router.post("/income", authMiddleware, (req, res, next) =>
  FinanceController.addIncome(req, res, next)
);
router.post("/confirmIncome", authMiddleware, (req, res, next) =>
  FinanceController.confirmIncome(req, res, next)
);
router.put("/income/:id", authMiddleware, (req, res, next) =>
  FinanceController.editIncome(req, res, next)
);
router.put("/income/confirmEdit/:id", authMiddleware, (req, res, next) =>
  FinanceController.confirmEditIncome(req, res, next)
);
router.delete("/income/:id", authMiddleware, (req, res, next) =>
  FinanceController.deleteIncome(req, res, next)
);
router.get("/income", authMiddleware, (req, res, next) =>
  FinanceController.getIncomesByMonth(req, res, next)
);

// 🧾 ========== EXPENSE ==========
router.post("/expense", authMiddleware, (req, res, next) =>
  FinanceController.addExpense(req, res, next)
);

router.post("/confirmExpense", authMiddleware, (req, res, next) =>
  FinanceController.confirmExpense(req, res, next)
);

router.put("/expense/:id", authMiddleware, (req, res, next) =>
  FinanceController.editExpense(req, res, next)
);
router.put("/expense/confirmEdit/:id", authMiddleware, (req, res, next) =>
  FinanceController.confirmEditExpense(req, res, next)
);

router.delete("/expense/:id", authMiddleware, (req, res, next) =>
  FinanceController.deleteExpense(req, res, next)
);
router.get("/expense", authMiddleware, (req, res, next) =>
  FinanceController.getExpensesByMonth(req, res, next)
); // ?month=7&year=2025

// 📊 ========== PLANS ==========
router.post("/plan/income", authMiddleware, (req, res, next) =>
  FinanceController.saveIncomePlan(req, res, next)
);
router.get("/plan/income", authMiddleware, (req, res, next) =>
  FinanceController.getIncomePlan(req, res, next)
);
router.get("/plan/income/annual", authMiddleware, (req, res, next) =>
  FinanceController.getAnnualIncomePlan(req, res, next)
);
router.post("/plan/expense", authMiddleware, (req, res, next) =>
  FinanceController.saveExpensePlan(req, res, next)
);
router.get("/plan/expense", authMiddleware, (req, res, next) =>
  FinanceController.getExpensePlan(req, res, next)
);
router.get("/plan/expense/annual", authMiddleware, (req, res, next) =>
  FinanceController.getAnnualIncomePlan(req, res, next)
);

module.exports = router;
