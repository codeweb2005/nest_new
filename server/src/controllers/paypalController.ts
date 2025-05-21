import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const  baseURL = process.env.PAYPAL_API;

async function getAccessToken() {
    const response = await fetch(`${baseURL}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
                `${clientId}:${clientSecret}`
            ).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
    });

    if (!response.ok) {
        throw new Error("Failed to get access token");
    }

    const data = await response.json();
    return data.access_token;
}

export const PaypalService = async (
  req: Request,
  res: Response
): Promise<void> => {
    async function createPayment(accessToken: string) {
        const response = await fetch(`${baseURL}/v1/payments/payment`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                intent: "sale",
                payer: {
                    payment_method: "paypal",
                },
                transactions: [
                    {
                        amount: {
                            total: req.body.amount, 
                            currency: "USD",
                        },
                        description: "Payment description",
                        invoice_number: req.body.applicationId,
                    },
                ],
                redirect_urls: {
                    return_url: `${process.env.API_RETURN}/tenants/applications?applicationId=${req.body.applicationId}`,
                    cancel_url: `${process.env.API_RETURN}/tenants/applications`,
                },
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to create payment");
        }

        const data = await response.json();
        return data;
    }try {
        const accessToken = await getAccessToken();
        const payment = await createPayment(accessToken);
        res.json(payment);
    }
    catch (error: any) {
        res
            .status(500)
            .json({ message: `Error creating payment: ${error.message}` });
    }
    

}
export const ExecutePayment = async (req: Request, res: Response) => {
  const { paymentId, payerId, applicationId } = req.body;
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `${baseURL}/v1/payments/payment/${paymentId}/execute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ payer_id: payerId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(400).json({ message: "Payment execution failed", error: errorData });
    }

    // Thanh toán thành công, cập nhật trạng thái ứng dụng
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: "Approved" },
    });

    res.status(200).json({ message: "Payment executed and application updated" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
