import express from "express";
import { PaypalService, ExecutePayment } from "../controllers/paypalController";
import { RequestHandler } from "express";
// import { authMiddleware } from "../middleware/authMiddleware";
import paypal from "paypal-rest-sdk";

const router = express.Router();
// Create a payment
router.post("/execute-payment", ExecutePayment as RequestHandler); // Thực thi thanh toán
router.post("/", PaypalService); // Tạo payment

export default router;