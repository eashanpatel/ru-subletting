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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      amenities: {
        Row: {
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      campuses: {
        Row: {
          id: string
          location: unknown
          name: string
          school_id: string
          slug: string
        }
        Insert: {
          id?: string
          location: unknown
          name: string
          school_id: string
          slug: string
        }
        Update: {
          id?: string
          location?: unknown
          name?: string
          school_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "campuses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_amenities: {
        Row: {
          amenity_slug: string
          listing_id: string
        }
        Insert: {
          amenity_slug: string
          listing_id: string
        }
        Update: {
          amenity_slug?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_amenities_amenity_slug_fkey"
            columns: ["amenity_slug"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "listing_amenities_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_contact_methods: {
        Row: {
          id: string
          kind: Database["public"]["Enums"]["contact_kind"]
          listing_id: string
          position: number
          value: string
        }
        Insert: {
          id?: string
          kind: Database["public"]["Enums"]["contact_kind"]
          listing_id: string
          position?: number
          value: string
        }
        Update: {
          id?: string
          kind?: Database["public"]["Enums"]["contact_kind"]
          listing_id?: string
          position?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_contact_methods_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_locations: {
        Row: {
          address: string
          listing_id: string
          location: unknown
        }
        Insert: {
          address: string
          listing_id: string
          location: unknown
        }
        Update: {
          address?: string
          listing_id?: string
          location?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "listing_locations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_photos: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          position: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          position?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          position?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address_visibility: Database["public"]["Enums"]["address_visibility"]
          baths: number | null
          beds: number | null
          created_at: string
          description: string | null
          ends_on: string
          featured_until: string | null
          id: string
          location_approx: unknown
          neighborhood: string | null
          owner_id: string
          price_monthly: number
          room_type: Database["public"]["Enums"]["room_type"]
          school_id: string
          starts_on: string
          status: Database["public"]["Enums"]["listing_status"]
          street_name: string | null
          title: string
          unit_label: string | null
          updated_at: string
        }
        Insert: {
          address_visibility?: Database["public"]["Enums"]["address_visibility"]
          baths?: number | null
          beds?: number | null
          created_at?: string
          description?: string | null
          ends_on: string
          featured_until?: string | null
          id?: string
          location_approx?: unknown
          neighborhood?: string | null
          owner_id: string
          price_monthly: number
          room_type: Database["public"]["Enums"]["room_type"]
          school_id: string
          starts_on: string
          status?: Database["public"]["Enums"]["listing_status"]
          street_name?: string | null
          title: string
          unit_label?: string | null
          updated_at?: string
        }
        Update: {
          address_visibility?: Database["public"]["Enums"]["address_visibility"]
          baths?: number | null
          beds?: number | null
          created_at?: string
          description?: string | null
          ends_on?: string
          featured_until?: string | null
          id?: string
          location_approx?: unknown
          neighborhood?: string | null
          owner_id?: string
          price_monthly?: number
          room_type?: Database["public"]["Enums"]["room_type"]
          school_id?: string
          starts_on?: string
          status?: Database["public"]["Enums"]["listing_status"]
          street_name?: string | null
          title?: string
          unit_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_contacts: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          school_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          reason: string
          reporter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          reason: string
          reporter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          reason?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          center: unknown
          created_at: string
          email_domain: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          center: unknown
          created_at?: string
          email_domain?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          center?: unknown
          created_at?: string
          email_domain?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      semesters: {
        Row: {
          ends_on: string
          id: string
          label: string
          school_id: string
          slug: string
          starts_on: string
        }
        Insert: {
          ends_on: string
          id?: string
          label: string
          school_id: string
          slug: string
          starts_on: string
        }
        Update: {
          ends_on?: string
          id?: string
          label?: string
          school_id?: string
          slug?: string
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "semesters_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      campus_points: {
        Args: { p_school: string }
        Returns: {
          lat: number
          lng: number
          name: string
          slug: string
        }[]
      }
      get_listing: {
        Args: { p_listing_id: string }
        Returns: {
          address_visibility: Database["public"]["Enums"]["address_visibility"]
          amenities: string[]
          baths: number
          beds: number
          campus_distances: Json
          created_at: string
          description: string
          ends_on: string
          id: string
          lat: number
          lng: number
          neighborhood: string
          owner_id: string
          owner_name: string
          owner_since: string
          photo_paths: string[]
          price_monthly: number
          room_type: Database["public"]["Enums"]["room_type"]
          starts_on: string
          status: Database["public"]["Enums"]["listing_status"]
          street_name: string
          title: string
          unit_label: string
        }[]
      }
      get_listing_contacts: {
        Args: { p_listing_id: string }
        Returns: {
          kind: Database["public"]["Enums"]["contact_kind"]
          value: string
        }[]
      }
      get_listing_for_edit: { Args: { p_listing_id: string }; Returns: Json }
      get_listing_location: {
        Args: { p_listing_id: string }
        Returns: {
          address: string
          lat: number
          lng: number
        }[]
      }
      save_listing: {
        Args: {
          p_address: string
          p_address_visibility?: Database["public"]["Enums"]["address_visibility"]
          p_amenities: string[]
          p_baths: number
          p_beds: number
          p_contacts: Json
          p_description: string
          p_ends_on: string
          p_id: string
          p_lat: number
          p_lng: number
          p_neighborhood: string
          p_photos: string[]
          p_price: number
          p_room_type: Database["public"]["Enums"]["room_type"]
          p_school?: string
          p_starts_on: string
          p_status: Database["public"]["Enums"]["listing_status"]
          p_street_name: string
          p_title: string
          p_unit_label: string
        }
        Returns: string
      }
      search_listings: {
        Args: {
          p_amenities?: string[]
          p_campus?: string
          p_east?: number
          p_end?: string
          p_favorites_only?: boolean
          p_limit?: number
          p_max_price?: number
          p_min_price?: number
          p_mine?: boolean
          p_north?: number
          p_offset?: number
          p_room_type?: Database["public"]["Enums"]["room_type"]
          p_school: string
          p_semester?: string
          p_sort?: string
          p_south?: number
          p_start?: string
          p_west?: number
        }
        Returns: {
          amenities: string[]
          baths: number
          beds: number
          campus_name: string
          campus_slug: string
          cover_path: string
          created_at: string
          distance_m: number
          ends_on: string
          id: string
          lat: number
          lng: number
          neighborhood: string
          photo_count: number
          price_monthly: number
          room_type: Database["public"]["Enums"]["room_type"]
          starts_on: string
          status: Database["public"]["Enums"]["listing_status"]
          street_name: string
          title: string
          unit_label: string
        }[]
      }
    }
    Enums: {
      address_visibility: "private" | "members" | "public"
      contact_kind:
        | "email"
        | "phone"
        | "whatsapp"
        | "instagram"
        | "snapchat"
        | "other"
      listing_status: "draft" | "active" | "paused" | "taken"
      room_type: "private_room" | "shared_room" | "entire_place" | "studio"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      address_visibility: ["private", "members", "public"],
      contact_kind: [
        "email",
        "phone",
        "whatsapp",
        "instagram",
        "snapchat",
        "other",
      ],
      listing_status: ["draft", "active", "paused", "taken"],
      room_type: ["private_room", "shared_room", "entire_place", "studio"],
    },
  },
} as const
