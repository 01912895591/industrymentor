export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blogs: {
        Row: {
          content: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_path: string | null
          course_id: string
          created_at: string
          id: string
          issued_at: string
          purchase_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          certificate_path?: string | null
          course_id: string
          created_at?: string
          id?: string
          issued_at?: string
          purchase_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          certificate_path?: string | null
          course_id?: string
          created_at?: string
          id?: string
          issued_at?: string
          purchase_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          course_id: string
          created_at: string
          id: string
          purchase_id: string | null
          user_id: string
          completed: boolean
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          purchase_id?: string | null
          user_id: string
          completed?: boolean
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          purchase_id?: string | null
          user_id?: string
          completed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_image_path: string | null
          created_at: string
          description: string | null
          id: string
          price_cents: number
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          price_cents?: number
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          price_cents?: number
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      finance_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          amount_cents: number
          category_id: string | null
          created_at: string
          id: string
          note: string | null
          purchase_id: string | null
          txn_type: Database["public"]["Enums"]["finance_txn_type"]
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          category_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          purchase_id?: string | null
          txn_type: Database["public"]["Enums"]["finance_txn_type"]
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          category_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          purchase_id?: string | null
          txn_type?: Database["public"]["Enums"]["finance_txn_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      library_items: {
        Row: {
          created_at: string
          description: string | null
          file_path: string | null
          id: string
          item_key: string
          item_type: Database["public"]["Enums"]["library_item_type"]
          price_cents: number
          published: boolean
          thumbnail_path: string | null
          title: string
          updated_at: string
          image_url: string | null
          industry: string | null
          category: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          item_key: string
          item_type: Database["public"]["Enums"]["library_item_type"]
          price_cents?: number
          published?: boolean
          thumbnail_path?: string | null
          title: string
          updated_at?: string
          image_url?: string | null
          industry?: string | null
          category?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          item_key?: string
          item_type?: Database["public"]["Enums"]["library_item_type"]
          price_cents?: number
          published?: boolean
          thumbnail_path?: string | null
          title?: string
          updated_at?: string
          image_url?: string | null
          industry?: string | null
          category?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          replied_at: string | null
          replied_by: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_replied_by_fkey"
            columns: ["replied_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          image_path: string | null
          initials: string | null
          linkedin_url: string | null
          name: string
          tags: string[] | null
          title: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          image_path?: string | null
          initials?: string | null
          linkedin_url?: string | null
          name: string
          tags?: string[] | null
          title: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          image_path?: string | null
          initials?: string | null
          linkedin_url?: string | null
          name?: string
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          item_key: string
          item_type: string
          title: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          id?: string
          item_key: string
          item_type: string
          title: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          item_key?: string
          item_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      get_pro_users_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          full_name: string
          email: string
          phone: string
          created_at: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      finance_txn_type: "income" | "expense"
      library_item_type: "ebook" | "sop"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      finance_txn_type: ["income", "expense"],
      library_item_type: ["ebook", "sop"],
    },
  },
} as const
