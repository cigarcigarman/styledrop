export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string
          name: string
          twitter_handle: string | null
          avatar_url: string | null
          bio: string | null
          replicate_model_version: string
          trigger_word: string
          banned_keywords: string[]
          daily_limit: number
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          twitter_handle?: string | null
          avatar_url?: string | null
          bio?: string | null
          replicate_model_version: string
          trigger_word: string
          banned_keywords?: string[]
          daily_limit?: number
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          twitter_handle?: string | null
          avatar_url?: string | null
          bio?: string | null
          replicate_model_version?: string
          trigger_word?: string
          banned_keywords?: string[]
          daily_limit?: number
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      artist_samples: {
        Row: {
          id: string
          artist_id: string
          image_url: string
          sort_order: number
        }
        Insert: {
          id?: string
          artist_id: string
          image_url: string
          sort_order?: number
        }
        Update: {
          id?: string
          artist_id?: string
          image_url?: string
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          nickname: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          nickname?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nickname?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      credits: {
        Row: {
          id: string
          user_id: string
          amount: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          user_id: string
          payment_key: string | null
          order_id: string | null
          amount: number
          credits_granted: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          payment_key?: string | null
          order_id?: string | null
          amount: number
          credits_granted: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          payment_key?: string | null
          order_id?: string | null
          amount?: number
          credits_granted?: number
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          id: string
          user_id: string
          artist_id: string
          prompt: string
          result_url: string | null
          replicate_prediction_id: string | null
          is_filtered: boolean
          status: string
          credits_used: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          artist_id: string
          prompt: string
          result_url?: string | null
          replicate_prediction_id?: string | null
          is_filtered?: boolean
          status?: string
          credits_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          artist_id?: string
          prompt?: string
          result_url?: string | null
          replicate_prediction_id?: string | null
          is_filtered?: boolean
          status?: string
          credits_used?: number
          created_at?: string
        }
        Relationships: []
      }
      artist_payouts: {
        Row: {
          id: string
          artist_id: string
          generation_count: number
          amount: number
          period_start: string | null
          period_end: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          generation_count: number
          amount: number
          period_start?: string | null
          period_end?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          generation_count?: number
          amount?: number
          period_start?: string | null
          period_end?: string | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      deduct_credit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Artist = Database['public']['Tables']['artists']['Row']
export type ArtistSample = Database['public']['Tables']['artist_samples']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Credits = Database['public']['Tables']['credits']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type Generation = Database['public']['Tables']['generations']['Row']
