import express from "express";
import { PaypalService } from "../controllers/paypalController";
// import { authMiddleware } from "../middleware/authMiddleware";
import paypal from "paypal-rest-sdk";

const router = express.Router();
// Create a payment
router.post("/", PaypalService);

export default router;