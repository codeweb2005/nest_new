import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getLeases = async (req: Request, res: Response): Promise<void> => {
  try {
    const leases = await prisma.lease.findMany({
      include: {
        tenant: true,
        property: true,
      },
    });
    res.json(leases);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving leases: ${error.message}` });
  }
};

export const getLeasePayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params; // id ở đây là leaseId

    const payments = await prisma.payment.findMany({
      where: { leaseId: Number(id) },
      include: {
        lease: true, // lấy dữ liệu liên quan từ bảng Lease
        tenant: true, // lấy dữ liệu tenant liên quan qua tenantCognitoId
      },
    });

    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving lease payments: ${error.message}` });
  }
};




