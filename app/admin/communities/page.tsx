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
import { Switch } from "@/components/ui/switch";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Pencil, Trash2, Users } from "lucide-react";
import {
  getCommunities,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  getCommunityCustomers,
  type Community,
  type Customer,
} from "@/lib/api";
import { toast } from "sonner";

export default function CommunitiesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCustomers, setShowCustomers] = useState<string | null>(null);
  const [customersPage, setCustomersPage] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    commission_rate: 10,
    is_active: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading } = useSWR(
    ["communities", page, search, statusFilter],
    async () => {
      const res = await getCommunities(
        search || undefined,
        statusFilter === "active",
        page,
        10
      );
      return res.data;
    }
  );

  const { data: customersData, isLoading: customersLoading } = useSWR(
    showCustomers
      ? ["community-customers", showCustomers, customersPage]
      : null,
    async () => {
      if (!showCustomers) return null;
      const res = await getCommunityCustomers(showCustomers, customersPage, 10);
      return res.data;
    }
  );

  const handleOpenForm = (community?: Community) => {
    if (community) {
      setEditingCommunity(community);
      setFormData({
        name: community.name,
        description: community.description,
        commission_rate: community.commission_rate,
        is_active: community.is_active,
      });
    } else {
      setEditingCommunity(null);
      setFormData({
        name: "",
        description: "",
        commission_rate: 10,
        is_active: true,
      });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingCommunity) {
        await updateCommunity(editingCommunity.id, formData);
        toast("Community updated successfully");
      } else {
        await createCommunity(formData);
        toast("Community created successfully");
      }
      setShowForm(false);
      mutate(["communities", page, search, statusFilter]);
    } catch (error) {
      toast("Failed to save community");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCommunity(deleteId);
      toast("Community deleted successfully");
      setDeleteId(null);
      mutate(["communities", page, search, statusFilter]);
    } catch (error) {
      toast("Failed to delete community");
    }
  };

  const columns = [
    { key: "name", header: "Name" },
    { key: "description", header: "Description" },
    {
      key: "commission_rate",
      header: "Commission Rate",
      render: (item: Community) => `${item.commission_rate}%`,
    },
    { key: "member_count", header: "Members" },
    {
      key: "is_active",
      header: "Status",
      render: (item: Community) => (
        <StatusBadge
          status={item.is_active ? "Active" : "Inactive"}
          variant={item.is_active ? "success" : "error"}
        />
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (item: Community) =>
        new Date(item.created_at).toLocaleDateString("id-ID"),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: Community) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCustomers(item.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Users className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenForm(item)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(item.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const customerColumns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { key: "total_orders", header: "Orders" },
    {
      key: "total_spent",
      header: "Total Spent",
      render: (item: Customer) =>
        new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(item.total_spent),
    },
  ];

  return (
    <div className="flex flex-col">
      <AdminHeader
        title="Communities"
        description="Manage affiliate communities and groups"
      />

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search communities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary border-border text-foreground"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 bg-secondary border-border text-foreground">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => handleOpenForm()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Community
          </Button>
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

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingCommunity ? "Edit Community" : "Create Community"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Community name"
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Community description"
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Commission Rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.commission_rate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    commission_rate: Number(e.target.value),
                  })
                }
                className="bg-secondary border-border text-foreground"
              />
            </div>
            {editingCommunity && (
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="border-border text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.name}
              className="bg-primary text-primary-foreground"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete Community
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this community? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Community Customers Dialog */}
      <Dialog
        open={!!showCustomers}
        onOpenChange={() => setShowCustomers(null)}
      >
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Community Customers
            </DialogTitle>
          </DialogHeader>
          <DataTable
            data={customersData?.items || []}
            columns={customerColumns}
            page={customersPage}
            totalPages={customersData?.total_pages || 1}
            onPageChange={setCustomersPage}
            isLoading={customersLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
