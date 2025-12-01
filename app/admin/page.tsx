"use client"

import { AdminHeader } from "@/components/admin-header"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Link2, Wallet, TrendingUp, ArrowUpRight } from "lucide-react"
import useSWR from "swr"
import { getCommissionSummary, getAffiliateLinks, getWithdrawals, type CommissionSummary } from "@/lib/api"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function AdminDashboard() {
  const { data: summaryData } = useSWR("commission-summary", async () => {
    const res = await getCommissionSummary()
    return res.data
  })

  const { data: linksData } = useSWR("affiliate-links", async () => {
    const res = await getAffiliateLinks(1, 5)
    return res.data
  })

  const { data: withdrawalsData } = useSWR("withdrawals-pending", async () => {
    const res = await getWithdrawals("pending", 1, 5)
    return res.data
  })

  const summary: CommissionSummary = summaryData || {
    total_commissions: 0,
    pending_commissions: 0,
    approved_commissions: 0,
    paid_commissions: 0,
    total_amount: 0,
    pending_amount: 0,
    approved_amount: 0,
    paid_amount: 0,
  }

  return (
    <div className="flex flex-col">
      <AdminHeader title="Dashboard" description="Overview of your affiliate program performance" />

      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Commissions"
            value={formatCurrency(summary.total_amount)}
            change="+12.5% from last month"
            changeType="positive"
            icon={DollarSign}
            iconColor="text-primary"
          />
          <StatsCard
            title="Pending Commissions"
            value={formatCurrency(summary.pending_amount)}
            change={`${summary.pending_commissions} pending`}
            changeType="neutral"
            icon={TrendingUp}
            iconColor="text-warning"
          />
          <StatsCard
            title="Total Affiliates"
            value={linksData?.total || 0}
            change="+5 new this week"
            changeType="positive"
            icon={Users}
            iconColor="text-info"
          />
          <StatsCard
            title="Pending Withdrawals"
            value={withdrawalsData?.total || 0}
            change="Requires attention"
            changeType="negative"
            icon={Wallet}
            iconColor="text-destructive"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">Recent Affiliate Links</CardTitle>
              <Link2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(linksData?.items || []).slice(0, 5).map((link) => (
                  <div key={link.id} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                    <div>
                      <p className="font-medium text-foreground">{link.user_name}</p>
                      <p className="text-sm text-muted-foreground">{link.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{link.clicks} clicks</p>
                      <p className="text-xs text-muted-foreground">{link.conversions} conversions</p>
                    </div>
                  </div>
                ))}
                {(!linksData?.items || linksData.items.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">No affiliate links yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">Commission Summary</CardTitle>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium text-warning">{formatCurrency(summary.pending_amount)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                  <span className="text-muted-foreground">Approved</span>
                  <span className="font-medium text-success">{formatCurrency(summary.approved_amount)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium text-foreground">{formatCurrency(summary.paid_amount)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="font-bold text-primary">{formatCurrency(summary.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
