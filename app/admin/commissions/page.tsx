"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { AdminHeader } from "@/components/admin-header";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, CheckCircle } from "lucide-react";
import { getCommissions, approveCommissions, type Commission } from "@/lib/api";
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
    case "paid":
      return "success";
    case "rejected":
      return "error";
    default:
      return "default";
  }
};

export default function CommissionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  const { data, isLoading } = useSWR(
    ["commissions", page, status],
    async () => {
      const res = await getCommissions(
        status === "all" ? undefined : status,
        page,
        10
      );
      return res.data;
    }
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingIds = (data?.items || [])
        .filter((c) => c.status === "pending")
        .map((c) => c.id);
      setSelectedIds(pendingIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    }
  };

  const handleApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsApproving(true);
    try {
      await approveCommissions(selectedIds, approveNotes || undefined);
      toast(`${selectedIds.length} commission(s) approved successfully`);
      setSelectedIds([]);
      setApproveNotes("");
      setShowApproveDialog(false);
      mutate(["commissions", page, status]);
    } catch (error) {
      toast("Failed to approve commissions");
    } finally {
      setIsApproving(false);
    }
  };

  const columns = [
    {
      key: "select",
      header: (
        <Checkbox
          checked={
            selectedIds.length > 0 &&
            selectedIds.length ===
              (data?.items || []).filter((c) => c.status === "pending").length
          }
          onCheckedChange={handleSelectAll}
        />
      ) as unknown as string,
      render: (item: Commission) =>
        item.status === "pending" ? (
          <Checkbox
            checked={selectedIds.includes(item.id)}
            onCheckedChange={(checked) =>
              handleSelectOne(item.id, checked as boolean)
            }
          />
        ) : null,
    },
    { key: "user_name", header: "User" },
    { key: "user_email", header: "Email" },
    { key: "order_id", header: "Order ID" },
    {
      key: "amount",
      header: "Amount",
      render: (item: Commission) => formatCurrency(item.amount),
    },
    {
      key: "rate",
      header: "Rate",
      render: (item: Commission) => `${item.rate}%`,
    },
    {
      key: "status",
      header: "Status",
      render: (item: Commission) => (
        <StatusBadge
          status={item.status}
          variant={statusVariant(item.status)}
        />
      ),
    },
    {
      key: "created_at",
      header: "Date",
      render: (item: Commission) =>
        new Date(item.created_at).toLocaleDateString("id-ID"),
    },
  ];

  return (
    <div className="flex flex-col">
      <AdminHeader
        title="Commissions"
        description="Review and approve affiliate commissions"
      />

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
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
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedIds.length > 0 && (
            <Button
              onClick={() => setShowApproveDialog(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve ({selectedIds.length})
            </Button>
          )}
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

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Approve Commissions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              You are about to approve {selectedIds.length} commission(s).
            </p>
            <div className="space-y-2">
              <label className="text-sm text-foreground">
                Notes (optional)
              </label>
              <Textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="Add any notes for this approval..."
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              className="border-border text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-primary text-primary-foreground"
            >
              {isApproving ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
