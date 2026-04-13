export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type GenerationStatus = 'pending' | 'processing' | 'succeeded' | 'failed'
export type TransactionType = 'purchase' | 'usage' | 'bonus' | 'refund'
export type StylePreset = 'casual' | 'formal' | 'streetwear' | 'vintage' | 'minimal'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          credits: number
          total_generated: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          credits?: number
          total_generated?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          credits?: number
          total_generated?: number
          updated_at?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          id: string
          user_id: string
          prompt: string
          negative_prompt: string | null
          style_preset: StylePreset | null
          model_id: string
          replicate_prediction_id: string | null
          status: GenerationStatus
          image_url: string | null
          replicate_url: string | null
          width: number
          height: number
          credits_used: number
          error_message: string | null
          metadata: Json | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          prompt: string
          negative_prompt?: string | null
          style_preset?: StylePreset | null
          model_id?: string
          replicate_prediction_id?: string | null
          status?: GenerationStatus
          image_url?: string | null
          replicate_url?: string | null
          width?: number
          height?: number
          credits_used?: number
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          replicate_prediction_id?: string | null
          status?: GenerationStatus
          image_url?: string | null
          replicate_url?: string | null
          error_message?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          type: TransactionType
          amount: number
          balance_after: number
          description: string | null
          stripe_payment_intent_id: string | null
          generation_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: TransactionType
          amount: number
          balance_after: number
          description?: string | null
          stripe_payment_intent_id?: string | null
          generation_id?: string | null
          created_at?: string
        }
        Update: {
          description?: string | null
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          id: string
          name: string
          credits: number
          price_usd: number
          stripe_price_id: string | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          credits: number
          price_usd: number
          stripe_price_id?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          credits?: number
          price_usd?: number
          stripe_price_id?: string | null
          is_active?: boolean
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      deduct_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_generation_id: string
          p_description?: string
        }
        Returns: boolean
      }
      add_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_type: TransactionType
          p_description: string
          p_stripe_payment_intent_id?: string | null
        }
        Returns: number
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
