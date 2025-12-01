"use client"

import { useState } from "react"
import useSWR from "swr"
import { AdminHeader } from "@/components/admin-header"
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Eye, UserCheck, UserX } from "lucide-react"
import { getAffiliateUsers, getCommunities, type AffiliateUser } from "@/lib/api"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [communityId, setCommunityId] = useState<string>("all")
  const [hasAffiliate, setHasAffiliate] = useState<string>("all")
  const [isActive, setIsActive] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<AffiliateUser | null>(null)

  const { data: communitiesData } = useSWR("communities-list", async () => {
    const res = await getCommunities(undefined, true, 1, 100)
    return res.data
  })

  const { data, isLoading } = useSWR(["users", page, search, communityId, hasAffiliate, isActive], async () => {
    const res = await getAffiliateUsers({
      search: search || undefined,
      community_id: communityId === "all" ? undefined : communityId,
      has_affiliate: hasAffiliate === "all" ? undefined : hasAffiliate === "true",
      is_active: isActive === "all" ? undefined : isActive === "true",
      page,
      limit: 10,
    })
    return res.data
  })

  const columns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    {
      key: "community_name",
      header: "Community",
      render: (item: AffiliateUser) => item.community_name || <span className="text-muted-foreground">—</span>,
    },
    {
      key: "level",
      header: "Level",
      render: (item: AffiliateUser) => <StatusBadge status={item.level} variant="info" />,
    },
    {
      key: "has_affiliate",
      header: "Affiliate",
      render: (item: AffiliateUser) =>
        item.has_affiliate ? (
          <UserCheck className="h-4 w-4 text-success" />
        ) : (
          <UserX className="h-4 w-4 text-muted-foreground" />
        ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (item: AffiliateUser) => (
        <StatusBadge status={item.is_active ? "Active" : "Inactive"} variant={item.is_active ? "success" : "error"} />
      ),
    },
    {
      key: "total_earnings",
      header: "Earnings",
      render: (item: AffiliateUser) => formatCurrency(item.total_earnings),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: AffiliateUser) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedUser(item)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col">
      <AdminHeader title="Users" description="Manage affiliate users and their information" />

      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border text-foreground"
            />
          </div>

          <Select value={communityId} onValueChange={setCommunityId}>
            <SelectTrigger className="w-40 bg-secondary border-border text-foreground">
              <SelectValue placeholder="Community" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Communities</SelectItem>
              {(communitiesData?.items || []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={hasAffiliate} onValueChange={setHasAffiliate}>
            <SelectTrigger className="w-40 bg-secondary border-border text-foreground">
              <SelectValue placeholder="Affiliate Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Has Affiliate</SelectItem>
              <SelectItem value="false">No Affiliate</SelectItem>
            </SelectContent>
          </Select>

          <Select value={isActive} onValueChange={setIsActive}>
            <SelectTrigger className="w-32 bg-secondary border-border text-foreground">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
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

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">User Details</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground">{selectedUser.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{selectedUser.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{selectedUser.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Community</p>
                  <p className="font-medium text-foreground">{selectedUser.community_name || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Level</p>
                  <StatusBadge status={selectedUser.level} variant="info" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge
                    status={selectedUser.is_active ? "Active" : "Inactive"}
                    variant={selectedUser.is_active ? "success" : "error"}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="font-medium text-success">{formatCurrency(selectedUser.total_earnings)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Pending Balance</p>
                  <p className="font-medium text-warning">{formatCurrency(selectedUser.pending_balance)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
