// Database types for CrushNic
export interface Database {
  public: {
    Tables: {
      [key: string]: any;
    };
  };
}

export type Tables = Database['public']['Tables']

export type Profile = Tables['profiles']['Row']
export type VapeUsage = Tables['vape_usage']['Row']

// Strongly typed schema
export interface DatabaseSchema {
  profiles: {
    Row: {
      id: string
      quit_date: string // ISO timestamp
      has_quit: boolean
      personal_goals: string[]
      quit_reasons: string[]
      quit_reason: string
      currency: string
      financial_goal_description: string
      financial_goal_amount: number
      daily_cost: number
      created_at: string // ISO timestamp
      updated_at: string // ISO timestamp
    }
    Insert: Omit<DatabaseSchema['profiles']['Row'], 'created_at' | 'updated_at'>
    Update: Partial<DatabaseSchema['profiles']['Insert']>
  }
  vape_usage: {
    Row: {
      id: string
      profile_id: string
      type: 'disposable' | 'pod' | 'liquid' | 'other'
      other_text: string | null
      quantity: number
      frequency: 'day' | 'week'
      unit_cost: number
      created_at: string // ISO timestamp
      updated_at: string // ISO timestamp
    }
    Insert: Omit<DatabaseSchema['vape_usage']['Row'], 'id' | 'created_at' | 'updated_at'>
    Update: Partial<DatabaseSchema['vape_usage']['Insert']>
  }
}

// Helper type for onboarding data
export interface OnboardingData {
  profile: DatabaseSchema['profiles']['Insert']
  vapeUsage: DatabaseSchema['vape_usage']['Insert'][]
}

// Utility types for API responses
export type ApiResponse<T> = {
  data: T
  error: null
} | {
  data: null
  error: {
    message: string
    code?: string
  }
}

// Constants
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD'] as const
export type Currency = typeof CURRENCIES[number]

export const VAPE_TYPES = ['disposable', 'pod', 'liquid', 'other'] as const
export type VapeType = typeof VAPE_TYPES[number]

export const FREQUENCIES = ['day', 'week'] as const
export type Frequency = typeof FREQUENCIES[number] 