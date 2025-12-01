"use client"

import { useState } from "react"
import useSWR from "swr"
import { AdminHeader } from "@/components/admin-header"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Eye, TrendingUp, MousePointerClick, ShoppingCart, DollarSign } from "lucide-react"
import { getAffiliateLinks, getAffiliateLinkPerformance, type AffiliateLink } from "@/lib/api"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function AffiliateLinksPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedLink, setSelectedLink] = useState<AffiliateLink | null>(null)
  const [showPerformance, setShowPerformance] = useState(false)

  const { data, isLoading } = useSWR(["affiliate-links", page], async () => {
    const res = await getAffiliateLinks(page, 10)
    return res.data
  })

  const { data: performanceData, isLoading: performanceLoading } = useSWR(
    selectedLink ? ["link-performance", selectedLink.id] : null,
    async () => {
      if (!selectedLink) return null
      const res = await getAffiliateLinkPerformance(selectedLink.id)
      return res.data
    },
  )

  const columns = [
    { key: "user_name", header: "User" },
    { key: "user_email", header: "Email" },
    {
      key: "code",
      header: "Affiliate Code",
      render: (item: AffiliateLink) => (
        <code className="rounded bg-secondary px-2 py-1 text-xs text-primary">{item.code}</code>
      ),
    },
    { key: "clicks", header: "Clicks" },
    { key: "conversions", header: "Conversions" },
    {
      key: "created_at",
      header: "Created",
      render: (item: AffiliateLink) => new Date(item.created_at).toLocaleDateString("id-ID"),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: AffiliateLink) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedLink(item)
            setShowPerformance(true)
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col">
      <AdminHeader title="Affiliate Links" description="Manage and monitor all affiliate links" />

      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search affiliates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border text-foreground"
            />
          </div>
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

      <Dialog open={showPerformance} onOpenChange={setShowPerformance}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Link Performance</DialogTitle>
          </DialogHeader>

          {selectedLink && (
            <div className="space-y-6">
              <div className="rounded-lg bg-secondary p-4">
                <p className="text-sm text-muted-foreground">Affiliate</p>
                <p className="font-medium text-foreground">{selectedLink.user_name}</p>
                <p className="text-sm text-muted-foreground">{selectedLink.user_email}</p>
              </div>

              {performanceLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading performance data...</p>
              ) : performanceData ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="bg-secondary border-border">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="rounded-lg bg-primary/20 p-2">
                        <MousePointerClick className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Clicks</p>
                        <p className="text-xl font-bold text-foreground">{performanceData.total_clicks}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-secondary border-border">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="rounded-lg bg-info/20 p-2">
                        <ShoppingCart className="h-5 w-5 text-info" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Conversions</p>
                        <p className="text-xl font-bold text-foreground">{performanceData.conversions}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-secondary border-border">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="rounded-lg bg-success/20 p-2">
                        <TrendingUp className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Conversion Rate</p>
                        <p className="text-xl font-bold text-foreground">{performanceData.conversion_rate}%</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-secondary border-border">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="rounded-lg bg-warning/20 p-2">
                        <DollarSign className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Commission Earned</p>
                        <p className="text-xl font-bold text-foreground">
                          {formatCurrency(performanceData.commission_earned)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No performance data available</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
