"use client";

import ApplicationCard from "@/components/ApplicationCard";
import Header from "@/components/Header";
import axios from "axios";
import Loading from "@/components/Loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetApplicationsQuery,
  useGetAuthUserQuery,
  useUpdateApplicationStatusMutation,
} from "@/state/api";
import { CircleCheckBig, Download, File } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const Applications = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const [activeTab, setActiveTab] = useState("all");
  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();

  const {
    data: applications,
    isLoading,
    isError,
    refetch,
  } = useGetApplicationsQuery(
    {
      userId: authUser?.cognitoInfo?.userId,
      userType: "tenant",
    },
    {
      skip: !authUser?.cognitoInfo?.userId,
    }
  );

  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const payerId = searchParams.get("PayerID");
  const applicationIdParam = searchParams.get("applicationId");

  // Khi PayPal redirect về với param thanh toán, gọi backend execute thanh toán và update trạng thái
  useEffect(() => {
    const executePayment = async () => {
      if (paymentId && payerId && applicationIdParam) {
        try {
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/paypal/execute-payment`,
            {
              paymentId,
              payerId,
              applicationId: Number(applicationIdParam),
            }
          );
          await refetch(); // tải lại danh sách ứng dụng
          // Xóa param trên URL để tránh gọi lại
          window.history.replaceState({}, document.title, "/tenants/applications");
        } catch (error) {
          alert("Xác nhận thanh toán thất bại. Vui lòng thử lại.");
        }
      }
    };
    executePayment();
  }, [paymentId, payerId, applicationIdParam, refetch]);

  const handlePayment = async (applicationId: number) => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/paypal`, {
        amount: 1000,
        currency: "USD",
        applicationId,
      });
      const approveUrl = res.data.links.find(
        (link: { rel: string; href: string }) => link.rel === "approval_url"
      )?.href;
      if (approveUrl) {
        window.location.href = approveUrl;
      } else {
        alert("Không tìm thấy link approve");
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra");
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    await updateApplicationStatus({ id, status });
  };

  if (isLoading) return <Loading />;
  if (isError || !applications) return <div>Error fetching applications</div>;

  const filteredApplications = applications.filter((application) => {
    if (activeTab === "all") return true;
    return application.status.toLowerCase() === activeTab;
  });

  return (
    <div className="dashboard-container">
      <Header title="Applications" subtitle="View and manage applications for your properties" />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full my-5">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="denied">Denied</TabsTrigger>
        </TabsList>

        {["all", "pending", "approved", "denied"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-5 w-full">
            {filteredApplications
              .filter((application) => tab === "all" || application.status.toLowerCase() === tab)
              .map((application) => (
                <ApplicationCard key={application.id} application={application} userType="manager">
                  <div className="flex justify-between gap-5 w-full pb-4 px-4">
                    {/* Status Section */}
                    <div
                      className={`p-4 text-green-700 grow ${
                        application.status === "Approved"
                          ? "bg-green-100"
                          : application.status === "Denied"
                          ? "bg-red-100"
                          : "bg-yellow-100"
                      }`}
                    >
                      <div className="flex flex-wrap items-center">
                        <File className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span className="mr-2">
                          Application submitted on{" "}
                          {new Date(application.applicationDate).toLocaleDateString()}.
                        </span>
                        <CircleCheckBig className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span
                          className={`font-semibold ${
                            application.status === "Approved"
                              ? "text-green-800"
                              : application.status === "Denied"
                              ? "text-red-800"
                              : "text-yellow-800"
                          }`}
                        >
                          {application.status === "Approved" &&
                            "This application has been approved."}
                          {application.status === "Denied" && "This application has been denied."}
                          {application.status === "Pending" &&
                            "This application is pending review."}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {application.status === "Approved" && (
                        <button
                          className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md flex items-center justify-center hover:bg-primary-700 hover:text-primary-50"
                        >
                          <Download className="w-5 h-5 mr-2" />
                          Download Agreement
                        </button>
                      )}

                      {application.status === "Pending" && (
                        <>
                          <button
                            className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-500"
                            onClick={() => handlePayment(application.id)}
                          >
                            Approve & Process Payment
                          </button>

                          <button
                            className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-500"
                            onClick={() => handleStatusChange(application.id, "Denied")}
                          >
                            Deny
                          </button>
                        </>
                      )}

                      {application.status === "Denied" && (
                        <button
                          className="bg-gray-800 text-white py-2 px-4 rounded-md flex items-center justify-center hover:bg-secondary-500 hover:text-primary-50"
                        >
                          Contact User
                        </button>
                      )}
                    </div>
                  </div>
                </ApplicationCard>
              ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Applications;
