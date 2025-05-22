"use client";

import Header from "@/components/Header";
import Loading from "@/components/Loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetPaymentsQuery,
  useGetPropertyQuery,
} from "@/state/api";
import { ArrowDownToLine, ArrowLeft, Check, Download } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

const PropertyTenants = () => {
  const { id } = useParams();
  const propertyId = Number(id);
  
  // Lấy property và payments (leases không cần thiết nữa vì payments đã có lease & tenant)
  const { data: property, isLoading: propertyLoading } =
    useGetPropertyQuery(propertyId);
  const { data: payments, isLoading: paymentsLoading } =
    useGetPaymentsQuery(propertyId);

  if (propertyLoading || paymentsLoading) return <Loading />;

  // Chuẩn format lại payments
  const formattedPayments = payments?.map((payment) => ({
    id: payment.id,
    amountDue: payment.amountDue,
    amountPaid: payment.amountPaid,
    dueDate: payment.dueDate,
    paymentDate: payment.paymentDate,
    paymentStatus: payment.paymentStatus,
    leaseId: payment.leaseId,
    tenant: payment.lease.tenant,
    lease: {
      startDate: payment.lease.startDate,
      endDate: payment.lease.endDate,
    },
  }));

  // Hàm định dạng ngày
  const formatDate = (dateString: string | Date) =>
    new Date(dateString).toLocaleDateString();

  return (
    <div className="dashboard-container">
      {/* Back to properties page */}
      <Link
        href="/managers/properties"
        className="flex items-center mb-4 hover:text-primary-500"
        scroll={false}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        <span>Back to Properties</span>
      </Link>

      <Header
        title={property?.name || "My Property"}
        subtitle="Manage tenants, leases and payments for this property"
      />

      <div className="w-full space-y-6">
        <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Payments Overview</h2>
              <p className="text-sm text-gray-500">
                Manage and view all payments for this property.
              </p>
            </div>
            <div>
              <button
                className={`bg-white border border-gray-300 text-gray-700 py-2
              px-4 rounded-md flex items-center justify-center hover:bg-primary-700 hover:text-primary-50`}
              >
                <Download className="w-5 h-5 mr-2" />
                <span>Download All</span>
              </button>
            </div>
          </div>
          <hr className="mt-4 mb-1" />
          <div className="overflow-x-auto">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment ID</TableHead>
              <TableHead>Amount Due</TableHead>
              <TableHead>Amount Paid</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
<TableBody>
  {formattedPayments?.map((payment) => (
    <TableRow key={payment.id} className="h-24">
      <TableCell>{payment.id}</TableCell>
      <TableCell>${payment.amountDue.toFixed(2)}</TableCell>
      <TableCell>${payment.amountPaid.toFixed(2)}</TableCell>
      <TableCell>{formatDate(payment.dueDate)}</TableCell>
      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
      <TableCell>
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            payment.paymentStatus === "Paid"
              ? "bg-green-100 text-green-800 border-green-300"
              : "bg-red-100 text-red-800 border-red-300"
          }`}
        >
          {payment.paymentStatus === "Paid" && (
            <Check className="w-4 h-4 inline-block mr-1" />
          )}
          {payment.paymentStatus}
        </span>
      </TableCell>
      <TableCell>
        <button
          className={`border border-gray-300 text-gray-700 py-2 px-4 rounded-md flex 
            items-center justify-center font-semibold hover:bg-primary-700 hover:text-primary-50`}
        >
          <ArrowDownToLine className="w-4 h-4 mr-1" />
          Download Agreement
        </button>
      </TableCell>
    </TableRow>
  ))}
</TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyTenants;
