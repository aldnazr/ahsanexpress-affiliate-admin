const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

export interface ApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface AffiliateLink {
  id: string
  user_id: string
  user_name: string
  user_email: string
  code: string
  url: string
  clicks: number
  conversions: number
  created_at: string
}

export interface LinkPerformance {
  id: string
  total_clicks: number
  unique_clicks: number
  conversions: number
  conversion_rate: number
  total_revenue: number
  commission_earned: number
  daily_stats: {
    date: string
    clicks: number
    conversions: number
    revenue: number
  }[]
}

export interface CommissionSummary {
  total_commissions: number
  pending_commissions: number
  approved_commissions: number
  paid_commissions: number
  total_amount: number
  pending_amount: number
  approved_amount: number
  paid_amount: number
}

export interface Commission {
  id: string
  user_id: string
  user_name: string
  user_email: string
  order_id: string
  amount: number
  rate: number
  status: "pending" | "approved" | "paid" | "rejected"
  created_at: string
  approved_at?: string
  notes?: string
}

export interface Community {
  id: string
  name: string
  description: string
  commission_rate: number
  is_active: boolean
  member_count: number
  created_at: string
}

export interface AffiliateUser {
  id: string
  name: string
  email: string
  phone: string
  community_id?: string
  community_name?: string
  has_affiliate: boolean
  level: string
  is_active: boolean
  total_earnings: number
  pending_balance: number
  created_at: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  community_id?: string
  joined_at: string
  total_orders: number
  total_spent: number
}

export interface Withdrawal {
  id: string
  user_id: string
  user_name: string
  user_email: string
  amount: number
  bank_name: string
  account_number: string
  account_name: string
  status: "pending" | "approved" | "rejected" | "completed"
  transfer_proof_url?: string
  rejection_reason?: string
  created_at: string
  processed_at?: string
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "API request failed")
  }

  return response.json()
}

// Affiliate Links
export async function getAffiliateLinks(page = 1, limit = 10) {
  return fetchApi<PaginatedResponse<AffiliateLink>>(`/admin/affiliate-links?page=${page}&limit=${limit}`)
}

export async function getAffiliateLinkPerformance(id: string) {
  return fetchApi<LinkPerformance>(`/admin/affiliate-links/${id}/performance`)
}

// Commissions
export async function getCommissionSummary() {
  return fetchApi<CommissionSummary>("/admin/affiliate/commissions/summary")
}

export async function getCommissions(status?: string, page = 1, limit = 10) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) params.set("status", status)
  return fetchApi<PaginatedResponse<Commission>>(`/admin/commissions?${params}`)
}

export async function approveCommissions(commissionIds: string[], notes?: string) {
  return fetchApi<null>("/admin/commissions/approve", {
    method: "POST",
    body: JSON.stringify({ commission_ids: commissionIds, notes }),
  })
}

// Communities
export async function getCommunities(search?: string, isActive?: boolean, page = 1, limit = 10) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) params.set("search", search)
  if (isActive !== undefined) params.set("is_active", String(isActive))
  return fetchApi<PaginatedResponse<Community>>(`/admin/communities?${params}`)
}

export async function getCommunity(id: string) {
  return fetchApi<Community>(`/admin/affiliate/communities/${id}`)
}

export async function createCommunity(data: { name: string; description: string; commission_rate: number }) {
  return fetchApi<Community>("/admin/communities", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateCommunity(
  id: string,
  data: { name: string; description: string; commission_rate: number; is_active: boolean },
) {
  return fetchApi<Community>(`/admin/communities/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deleteCommunity(id: string) {
  return fetchApi<null>(`/admin/communities/${id}`, {
    method: "DELETE",
  })
}

export async function getCommunityCustomers(id: string, page = 1, limit = 10) {
  return fetchApi<PaginatedResponse<Customer>>(`/admin/communities/${id}/customers?page=${page}&limit=${limit}`)
}

// Users
export async function getAffiliateUsers(params: {
  search?: string
  community_id?: string
  has_affiliate?: boolean
  level?: string
  is_active?: boolean
  page?: number
  limit?: number
}) {
  const searchParams = new URLSearchParams()
  if (params.search) searchParams.set("search", params.search)
  if (params.community_id) searchParams.set("community_id", params.community_id)
  if (params.has_affiliate !== undefined) searchParams.set("has_affiliate", String(params.has_affiliate))
  if (params.level) searchParams.set("level", params.level)
  if (params.is_active !== undefined) searchParams.set("is_active", String(params.is_active))
  searchParams.set("page", String(params.page || 1))
  searchParams.set("limit", String(params.limit || 10))
  return fetchApi<PaginatedResponse<AffiliateUser>>(`/admin/affiliate/users?${searchParams}`)
}

// Customer Management
export async function assignCustomerToCommunity(customerId: string, communityId: string) {
  return fetchApi<null>("/admin/customers/assign-community", {
    method: "POST",
    body: JSON.stringify({ customer_id: customerId, community_id: communityId }),
  })
}

export async function removeCustomerFromCommunity(customerId: string) {
  return fetchApi<null>("/admin/customers/remove-community", {
    method: "POST",
    body: JSON.stringify({ customer_id: customerId }),
  })
}

// Withdrawals
export async function getWithdrawals(status?: string, page = 1, limit = 10) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) params.set("status", status)
  return fetchApi<PaginatedResponse<Withdrawal>>(`/admin/withdrawals?${params}`)
}

export async function processWithdrawal(
  id: string,
  data: {
    status: "approved" | "rejected" | "completed"
    transfer_proof_url?: string
    rejection_reason?: string
  },
) {
  return fetchApi<null>(`/admin/withdrawals/${id}/process`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}
