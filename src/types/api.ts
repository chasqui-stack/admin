// --- Auth ---
export interface AdminLoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  last_login_at: string | null
}

// --- Pagination (reusable for future list endpoints) ---
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface PaginationParams {
  page?: number
  page_size?: number
  search?: string
  is_active?: boolean
  sort_by?: string
  sort_order?: "asc" | "desc"
}
