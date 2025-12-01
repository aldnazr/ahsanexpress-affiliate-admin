"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { AdminHeader } from "@/components/admin-header";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, CheckCircle, XCircle, Eye, Upload } from "lucide-react";
import { getWithdrawals, processWithdrawal, type Withdrawal } from "@/lib/api";
import { toast } from "sonner";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

const statusVariant = (status: string) => {
  switch (status) {
    case "pending":
      return "warning";
    case "approved":
      return "info";
    case "completed":
      return "success";
    case "rejected":
      return "error";
    default:
      return "default";
  }
};

export default function WithdrawalsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<Withdrawal | null>(null);
  const [showProcess, setShowProcess] = useState(false);
  const [processAction, setProcessAction] = useState<
    "approve" | "reject" | "complete"
  >("approve");
  const [transferProof, setTransferProof] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data, isLoading } = useSWR(
    ["withdrawals", page, status],
    async () => {
      const res = await getWithdrawals(
        status === "all" ? undefined : status,
        page,
        10
      );
      return res.data;
    }
  );

  const handleProcess = async () => {
    if (!selectedWithdrawal) return;
    setIsProcessing(true);

    try {
      const statusMap = {
        approve: "approved" as const,
        reject: "rejected" as const,
        complete: "completed" as const,
      };

      await processWithdrawal(selectedWithdrawal.id, {
        status: statusMap[processAction],
        transfer_proof_url:
          processAction === "complete" ? transferProof : undefined,
        rejection_reason:
          processAction === "reject" ? rejectionReason : undefined,
      });

      toast(`Withdrawal ${processAction}d successfully`);
      setShowProcess(false);
      setSelectedWithdrawal(null);
      setTransferProof("");
      setRejectionReason("");
      mutate(["withdrawals", page, status]);
    } catch (error) {
      toast("Failed to process withdrawal");
    } finally {
      setIsProcessing(false);
    }
  };

  const columns = [
    { key: "user_name", header: "User" },
    { key: "user_email", header: "Email" },
    {
      key: "amount",
      header: "Amount",
      render: (item: Withdrawal) => (
        <span className="font-medium text-foreground">
          {formatCurrency(item.amount)}
        </span>
      ),
    },
    { key: "bank_name", header: "Bank" },
    { key: "account_number", header: "Account No." },
    {
      key: "status",
      header: "Status",
      render: (item: Withdrawal) => (
        <StatusBadge
          status={item.status}
          variant={statusVariant(item.status)}
        />
      ),
    },
    {
      key: "created_at",
      header: "Date",
      render: (item: Withdrawal) =>
        new Date(item.created_at).toLocaleDateString("id-ID"),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: Withdrawal) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedWithdrawal(item)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {item.status === "pending" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedWithdrawal(item);
                  setProcessAction("approve");
                  setShowProcess(true);
                }}
                className="text-success hover:text-success"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedWithdrawal(item);
                  setProcessAction("reject");
                  setShowProcess(true);
                }}
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          {item.status === "approved" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedWithdrawal(item);
                setProcessAction("complete");
                setShowProcess(true);
              }}
              className="text-primary hover:text-primary"
            >
              <Upload className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col">
      <AdminHeader
        title="Withdrawals"
        description="Process affiliate withdrawal requests"
      />

      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 bg-secondary border-border text-foreground"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40 bg-secondary border-border text-foreground">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          data={data?.items || []}
          columns={columns}
          page={page}
          totalPages={data?.total_pages || 1}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      </div>

      {/* View Details Dialog */}
      <Dialog
        open={!!selectedWithdrawal && !showProcess}
        onOpenChange={() => setSelectedWithdrawal(null)}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Withdrawal Details
            </DialogTitle>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium text-foreground">
                    {selectedWithdrawal.user_name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">
                    {selectedWithdrawal.user_email}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(selectedWithdrawal.amount)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge
                    status={selectedWithdrawal.status}
                    variant={statusVariant(selectedWithdrawal.status)}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-secondary p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Bank Details
                </p>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="text-foreground">
                      {selectedWithdrawal.bank_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Account Number
                    </span>
                    <span className="text-foreground">
                      {selectedWithdrawal.account_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Name</span>
                    <span className="text-foreground">
                      {selectedWithdrawal.account_name}
                    </span>
                  </div>
                </div>
              </div>

              {selectedWithdrawal.transfer_proof_url && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Transfer Proof
                  </p>
                  <a
                    href={selectedWithdrawal.transfer_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View Proof
                  </a>
                </div>
              )}

              {selectedWithdrawal.rejection_reason && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Rejection Reason
                  </p>
                  <p className="text-destructive">
                    {selectedWithdrawal.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Dialog */}
      <Dialog open={showProcess} onOpenChange={setShowProcess}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground capitalize">
              {processAction} Withdrawal
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedWithdrawal && (
              <div className="rounded-lg bg-secondary p-4">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(selectedWithdrawal.amount)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  To: {selectedWithdrawal.bank_name} -{" "}
                  {selectedWithdrawal.account_number}
                </p>
              </div>
            )}

            {processAction === "complete" && (
              <div className="space-y-2">
                <Label className="text-foreground">Transfer Proof URL</Label>
                <Input
                  value={transferProof}
                  onChange={(e) => setTransferProof(e.target.value)}
                  placeholder="https://..."
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            )}

            {processAction === "reject" && (
              <div className="space-y-2">
                <Label className="text-foreground">Rejection Reason</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProcess(false)}
              className="border-border text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcess}
              disabled={
                isProcessing ||
                (processAction === "complete" && !transferProof) ||
                (processAction === "reject" && !rejectionReason)
              }
              className={
                processAction === "reject"
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground"
              }
            >
              {isProcessing ? "Processing..." : `${processAction} Withdrawal`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
