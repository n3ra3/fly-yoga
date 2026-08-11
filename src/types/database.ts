export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          phone: string | null
          role: 'user' | 'trainer' | 'admin'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          phone?: string | null
          role?: 'user' | 'trainer' | 'admin'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          first_name?: string
          last_name?: string
          phone?: string | null
          role?: 'user' | 'trainer' | 'admin'
          avatar_url?: string | null
          updated_at?: string
        }
      }
      trainers: {
        Row: {
          id: string
          profile_id: string | null
          first_name: string
          last_name: string
          bio: string | null
          specialization: string[] | null
          photo_url: string | null
          instagram_url: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          first_name: string
          last_name: string
          bio?: string | null
          specialization?: string[] | null
          photo_url?: string | null
          instagram_url?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          profile_id?: string | null
          first_name?: string
          last_name?: string
          bio?: string | null
          specialization?: string[] | null
          photo_url?: string | null
          instagram_url?: string | null
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          name_ru: string
          name_ro: string
          name_en: string
          description_ru: string | null
          description_ro: string | null
          description_en: string | null
          duration_min: number
          level: 'beginner' | 'intermediate' | 'advanced' | 'all'
          color: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_ru: string
          name_ro: string
          name_en: string
          description_ru?: string | null
          description_ro?: string | null
          description_en?: string | null
          duration_min: number
          level: 'beginner' | 'intermediate' | 'advanced' | 'all'
          color?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name_ru?: string
          name_ro?: string
          name_en?: string
          description_ru?: string | null
          description_ro?: string | null
          description_en?: string | null
          duration_min?: number
          level?: 'beginner' | 'intermediate' | 'advanced' | 'all'
          color?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      schedule: {
        Row: {
          id: string
          class_id: string
          trainer_id: string
          starts_at: string
          ends_at: string
          total_seats: number
          booked_seats: number
          price_mdl: number
          location: string
          notes: string | null
          is_cancelled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          trainer_id: string
          starts_at: string
          ends_at: string
          total_seats: number
          booked_seats?: number
          price_mdl?: number
          location?: string
          notes?: string | null
          is_cancelled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          trainer_id?: string
          starts_at?: string
          ends_at?: string
          total_seats?: number
          booked_seats?: number
          price_mdl?: number
          location?: string
          notes?: string | null
          is_cancelled?: boolean
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          schedule_id: string
          status: 'confirmed' | 'cancelled' | 'attended' | 'no_show'
          booked_at: string
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          schedule_id: string
          status?: 'confirmed' | 'cancelled' | 'attended' | 'no_show'
          booked_at?: string
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'confirmed' | 'cancelled' | 'attended' | 'no_show'
          cancelled_at?: string | null
          updated_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name_ru: string
          name_ro: string
          name_en: string
          description_ru: string | null
          description_ro: string | null
          description_en: string | null
          price_mdl: number
          classes_count: number | null
          duration_days: number
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_ru: string
          name_ro: string
          name_en: string
          description_ru?: string | null
          description_ro?: string | null
          description_en?: string | null
          price_mdl: number
          classes_count?: number | null
          duration_days: number
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name_ru?: string
          name_ro?: string
          name_en?: string
          description_ru?: string | null
          description_ro?: string | null
          description_en?: string | null
          price_mdl?: number
          classes_count?: number | null
          duration_days?: number
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: 'active' | 'expired' | 'cancelled'
          classes_left: number | null
          started_at: string
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status?: 'active' | 'expired' | 'cancelled'
          classes_left?: number | null
          started_at?: string
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'active' | 'expired' | 'cancelled'
          classes_left?: number | null
          expires_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          booking_id: string
          user_id: string
          schedule_id: string
          attended: boolean
          marked_at: string
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          user_id: string
          schedule_id: string
          attended?: boolean
          marked_at?: string
          created_at?: string
        }
        Update: {
          attended?: boolean
          marked_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string | null
          author_name: string
          rating: number
          body: string
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          author_name: string
          rating: number
          body: string
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          rating?: number
          body?: string
          is_visible?: boolean
          updated_at?: string
        }
      }
      hall_rental_requests: {
        Row: {
          id: string
          hall: string | null
          name: string
          phone: string
          email: string
          event_description: string
          preferred_date: string
          status: 'new' | 'contacted' | 'confirmed' | 'declined'
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hall?: string | null
          name: string
          phone: string
          email: string
          event_description: string
          preferred_date: string
          status?: 'new' | 'contacted' | 'confirmed' | 'declined'
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'new' | 'contacted' | 'confirmed' | 'declined'
          admin_notes?: string | null
          updated_at?: string
        }
      }
      individual_bookings: {
        Row: {
          id: string
          user_id: string
          starts_at: string
          ends_at: string
          status: 'pending' | 'confirmed' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          starts_at: string
          ends_at: string
          status?: 'pending' | 'confirmed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'confirmed' | 'cancelled'
          notes?: string | null
          updated_at?: string
        }
      }
      class_bookings: {
        Row: {
          id: string
          user_id: string
          starts_at: string
          kind: string | null
          status: 'confirmed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          starts_at: string
          kind?: string | null
          status?: 'confirmed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'confirmed' | 'cancelled'
          updated_at?: string
        }
      }
      individual_requests: {
        Row: {
          id: string
          name: string | null
          phone: string
          comment: string | null
          status: 'new' | 'contacted' | 'done' | 'declined'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          phone: string
          comment?: string | null
          status?: 'new' | 'contacted' | 'done' | 'declined'
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string | null
          phone?: string
          comment?: string | null
          status?: 'new' | 'contacted' | 'done' | 'declined'
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
