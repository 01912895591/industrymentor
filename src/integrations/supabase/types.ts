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
      career_paths: {
        Row: {
          created_at: string
          description: string
          domain: string
          icon_name: string | null
          id: string
          is_published: boolean
          order_index: number
          practical_scope: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          domain: string
          icon_name?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          practical_scope?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          domain?: string
          icon_name?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          practical_scope?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      career_path_skills: {
        Row: {
          career_path_id: string
          is_core: boolean
          order_index: number
          skill_id: string
          stage_tier: number | null
        }
        Insert: {
          career_path_id: string
          is_core?: boolean
          order_index?: number
          skill_id: string
          stage_tier?: number | null
        }
        Update: {
          career_path_id?: string
          is_core?: boolean
          order_index?: number
          skill_id?: string
          stage_tier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "career_path_skills_career_path_id_fkey"
            columns: ["career_path_id"]
            isOneToOne: false
            referencedRelation: "career_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_path_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
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
      skill_courses: {
        Row: {
          course_id: string
          is_primary: boolean
          order_index: number
          skill_id: string
        }
        Insert: {
          course_id: string
          is_primary?: boolean
          order_index?: number
          skill_id: string
        }
        Update: {
          course_id?: string
          is_primary?: boolean
          order_index?: number
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_courses_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_library_items: {
        Row: {
          library_item_id: string
          order_index: number
          resource_role: string | null
          skill_id: string
        }
        Insert: {
          library_item_id: string
          order_index?: number
          resource_role?: string | null
          skill_id: string
        }
        Update: {
          library_item_id?: string
          order_index?: number
          resource_role?: string | null
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_library_items_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "library_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_library_items_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_mentors: {
        Row: {
          is_lead: boolean
          mentor_id: string
          order_index: number
          skill_id: string
          specialization_note: string | null
        }
        Insert: {
          is_lead?: boolean
          mentor_id: string
          order_index?: number
          skill_id: string
          specialization_note?: string | null
        }
        Update: {
          is_lead?: boolean
          mentor_id?: string
          order_index?: number
          skill_id?: string
          specialization_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_mentors_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_mentors_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string
          description: string
          difficulty: string | null
          domain: string
          id: string
          is_published: boolean
          practical_application: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          difficulty?: string | null
          domain: string
          id?: string
          is_published?: boolean
          practical_application?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          difficulty?: string | null
          domain?: string
          id?: string
          is_published?: boolean
          practical_application?: string | null
          slug?: string
          title?: string
          updated_at?: string
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
      projects: {
        Row: {
          id: string
          slug: string
          title: string
          short_description: string
          detailed_brief: string | null
          domain: string | null
          difficulty: string | null
          estimated_hours: number | null
          learning_objectives: Json | null
          deliverables: Json | null
          evaluation_criteria: Json | null
          instructions: string | null
          resources: Json | null
          mentor_guidance: string | null
          is_published: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          short_description: string
          detailed_brief?: string | null
          domain?: string | null
          difficulty?: string | null
          estimated_hours?: number | null
          learning_objectives?: Json | null
          deliverables?: Json | null
          evaluation_criteria?: Json | null
          instructions?: string | null
          resources?: Json | null
          mentor_guidance?: string | null
          is_published?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          short_description?: string
          detailed_brief?: string | null
          domain?: string | null
          difficulty?: string | null
          estimated_hours?: number | null
          learning_objectives?: Json | null
          deliverables?: Json | null
          evaluation_criteria?: Json | null
          instructions?: string | null
          resources?: Json | null
          mentor_guidance?: string | null
          is_published?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_career_paths: {
        Row: {
          career_path_id: string
          order_index: number
          project_id: string
        }
        Insert: {
          career_path_id: string
          order_index?: number
          project_id: string
        }
        Update: {
          career_path_id?: string
          order_index?: number
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_career_paths_career_path_id_fkey"
            columns: ["career_path_id"]
            isOneToOne: false
            referencedRelation: "career_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_career_paths_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      project_skills: {
        Row: {
          is_primary: boolean
          order_index: number
          project_id: string
          skill_id: string
        }
        Insert: {
          is_primary?: boolean
          order_index?: number
          project_id: string
          skill_id: string
        }
        Update: {
          is_primary?: boolean
          order_index?: number
          project_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_skills_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
      project_submissions: {
        Row: {
          admin_feedback: string | null
          created_at: string
          deliverable_url: string | null
          id: string
          project_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submission_notes: string | null
          submitted_at: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_feedback?: string | null
          created_at?: string
          deliverable_url?: string | null
          id?: string
          project_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submission_notes?: string | null
          submitted_at?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_feedback?: string | null
          created_at?: string
          deliverable_url?: string | null
          id?: string
          project_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submission_notes?: string | null
          submitted_at?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      portfolios: {
        Row: {
          bio: string | null
          career_path_id: string | null
          created_at: string
          headline: string | null
          id: string
          is_public: boolean
          linkedin_url: string | null
          location: string | null
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          career_path_id?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          is_public?: boolean
          linkedin_url?: string | null
          location?: string | null
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          career_path_id?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          is_public?: boolean
          linkedin_url?: string | null
          location?: string | null
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_career_path_id_fkey"
            columns: ["career_path_id"]
            isOneToOne: false
            referencedRelation: "career_paths"
            referencedColumns: ["id"]
          }
        ]
      }
      portfolio_items: {
        Row: {
          certificate_id: string | null
          created_at: string
          id: string
          is_featured: boolean
          order_index: number
          portfolio_id: string
          project_submission_id: string | null
        }
        Insert: {
          certificate_id?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          order_index?: number
          portfolio_id: string
          project_submission_id?: string | null
        }
        Update: {
          certificate_id?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          order_index?: number
          portfolio_id?: string
          project_submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          }
        ]
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
