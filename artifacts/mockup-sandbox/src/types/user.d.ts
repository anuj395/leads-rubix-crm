export type UserRole = 'admin' | 'leadManager' | 'sales' | 'superAdmin' | 'teamLead'

export interface AuthenticatedUser {
  email: string
  id: string
  name: string
  role: UserRole
  industry_id?: string   // added: required for non-superAdmin sidebar fetching
}
