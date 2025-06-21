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
      cs_items: {
        Row: {
          id: number
          def_index: number
          def_name: string
          paint_index: number | null
          paint_name: string | null
          max_float: number | null
          min_float: number | null
          category: number
          market_hash_name: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: number
          def_index: number
          def_name: string
          paint_index?: number | null
          paint_name?: string | null
          max_float?: number | null
          min_float?: number | null
          category?: number
          market_hash_name?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          def_index?: number
          def_name?: string
          paint_index?: number | null
          paint_name?: string | null
          max_float?: number | null
          min_float?: number | null
          category?: number
          market_hash_name?: string | null
          image_url?: string | null
          created_at?: string
        }
      }
      investments: {
        Row: {
          id: string
          item_id: number
          purchase_date: string
          purchase_price: number
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          item_id: number
          purchase_date: string
          purchase_price: number
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: number
          purchase_date?: string
          purchase_price?: number
          quantity?: number
          created_at?: string
        }
      }
      item_prices: {
        Row: {
          id: string
          item_id: number
          price: number
          price_cents: number
          recorded_at: string
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          item_id: number
          price: number
          price_cents: number
          recorded_at?: string
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: number
          price?: number
          price_cents?: number
          recorded_at?: string
          source?: string
          created_at?: string
        }
      }
    }
    Views: {
      latest_item_prices: {
        Row: {
          item_id: number
          price: number
          price_cents: number
          recorded_at: string
          source: string
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 