export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          plan_tier: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          plan_tier?: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          plan_tier?: string
          status?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string | null
          full_name: string
          role: 'admin' | 'employee' | 'super_admin'
        }
        Insert: {
          id: string
          tenant_id?: string | null
          full_name: string
          role: 'admin' | 'employee' | 'super_admin'
        }
        Update: {
          id?: string
          tenant_id?: string | null
          full_name?: string
          role?: 'admin' | 'employee' | 'super_admin'
        }
      }
      employees: {
        Row: {
          id: string
          user_id: string
          tenant_id: string
          full_name: string
          dni: string | null
          is_active: boolean
          email: string | null
          device_id: string | null
          department_id: string | null
          needs_password_change: boolean
        }
        Insert: {
          id?: string
          user_id: string
          tenant_id: string
          full_name: string
          dni?: string | null
          is_active?: boolean
          email?: string | null
          device_id?: string | null
          department_id?: string | null
          needs_password_change?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          tenant_id?: string
          full_name?: string
          dni?: string | null
          is_active?: boolean
          email?: string | null
          device_id?: string | null
          department_id?: string | null
          needs_password_change?: boolean
        }
      }
      worksites: {
        Row: {
          id: string
          tenant_id: string
          name: string
          lat: number
          long: number
          radius_meters: number
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          lat: number
          long: number
          radius_meters: number
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          lat?: number
          long?: number
          radius_meters?: number
        }
      }
      attendance: {
        Row: {
          id: string
          tenant_id: string
          employee_id: string
          worksite_id: string
          check_in: string
          check_out: string | null
          lat: number
          long: number
          photo_url: string | null
          device_id: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          employee_id: string
          worksite_id: string
          check_in?: string
          check_out?: string | null
          lat: number
          long: number
          photo_url?: string | null
          device_id?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          employee_id?: string
          worksite_id?: string
          check_in?: string
          check_out?: string | null
          lat?: number
          long?: number
          photo_url?: string | null
          device_id?: string | null
        }
      }
    }
  }
}
