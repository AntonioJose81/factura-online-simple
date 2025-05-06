export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          address: string
          city: string
          country: string
          email: string | null
          id: string
          logo: string | null
          name: string
          phone: string | null
          postal_code: string
          province: string
          tax_id: string
          user_id: string | null
        }
        Insert: {
          address: string
          city: string
          country: string
          email?: string | null
          id: string
          logo?: string | null
          name: string
          phone?: string | null
          postal_code: string
          province: string
          tax_id: string
          user_id?: string | null
        }
        Update: {
          address?: string
          city?: string
          country?: string
          email?: string | null
          id?: string
          logo?: string | null
          name?: string
          phone?: string | null
          postal_code?: string
          province?: string
          tax_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string
          city: string
          country: string
          email: string | null
          id: string
          name: string
          phone: string | null
          postal_code: string
          province: string
          tax_id: string
          user_id: string | null
        }
        Insert: {
          address: string
          city: string
          country: string
          email?: string | null
          id: string
          name: string
          phone?: string | null
          postal_code: string
          province: string
          tax_id: string
          user_id?: string | null
        }
        Update: {
          address?: string
          city?: string
          country?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          postal_code?: string
          province?: string
          tax_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          description: string
          discount: number
          id: string
          invoice_id: string
          price: number
          quantity: number
          tax: number
        }
        Insert: {
          description: string
          discount: number
          id: string
          invoice_id: string
          price: number
          quantity: number
          tax: number
        }
        Update: {
          description?: string
          discount?: number
          id?: string
          invoice_id?: string
          price?: number
          quantity?: number
          tax?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          apply_equivalence_surcharge: boolean | null
          apply_withholding_tax: boolean | null
          company_id: string | null
          customer_id: string | null
          date: string
          due_date: string | null
          global_discount: number | null
          id: string
          notes: string | null
          number: string
          status: string
          user_id: string | null
          withholding_tax_rate: number | null
        }
        Insert: {
          apply_equivalence_surcharge?: boolean | null
          apply_withholding_tax?: boolean | null
          company_id?: string | null
          customer_id?: string | null
          date: string
          due_date?: string | null
          global_discount?: number | null
          id: string
          notes?: string | null
          number: string
          status: string
          user_id?: string | null
          withholding_tax_rate?: number | null
        }
        Update: {
          apply_equivalence_surcharge?: boolean | null
          apply_withholding_tax?: boolean | null
          company_id?: string | null
          customer_id?: string | null
          date?: string
          due_date?: string | null
          global_discount?: number | null
          id?: string
          notes?: string | null
          number?: string
          status?: string
          user_id?: string | null
          withholding_tax_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
