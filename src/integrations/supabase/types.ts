export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      barbershops: {
        Row: {
          id: string
          name: string
          slug: string
          phone: string | null
          address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          phone?: string | null
          address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          phone?: string | null
          address?: string | null
          created_at?: string
        }
        Relationships: []
      }
      barbers: {
        Row: {
          id: string
          barbershop_id: string
          name: string
          photo_url: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          name: string
          photo_url?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          name?: string
          photo_url?: string | null
          active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbers_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: {
          id: string
          barbershop_id: string
          name: string
          price_cents: number
          duration_minutes: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          name: string
          price_cents: number
          duration_minutes: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          name?: string
          price_cents?: number
          duration_minutes?: number
          active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          id: string
          phone: string
          name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          phone: string
          name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string
          name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          id: string
          barbershop_id: string
          barber_id: string
          service_id: string
          client_id: string
          starts_at: string
          ends_at: string
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          barber_id: string
          service_id: string
          client_id: string
          starts_at: string
          ends_at: string
          status?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          barber_id?: string
          service_id?: string
          client_id?: string
          starts_at?: string
          ends_at?: string
          status?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      working_hours: {
        Row: {
          id: string
          barber_id: string
          day_of_week: number
          start_time: string
          end_time: string
        }
        Insert: {
          id?: string
          barber_id: string
          day_of_week: number
          start_time: string
          end_time: string
        }
        Update: {
          id?: string
          barber_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          }
        ]
      }
      blocked_slots: {
        Row: {
          id: string
          barber_id: string
          date: string
          start_time: string
          end_time: string
          reason: string | null
        }
        Insert: {
          id?: string
          barber_id: string
          date: string
          start_time: string
          end_time: string
          reason?: string | null
        }
        Update: {
          id?: string
          barber_id?: string
          date?: string
          start_time?: string
          end_time?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          }
        ]
      }
      barber_services: {
        Row: {
          barber_id: string
          service_id: string
        }
        Insert: {
          barber_id: string
          service_id: string
        }
        Update: {
          barber_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_services_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_available_slots: {
        Args: {
          p_barber_id: string
          p_date: string
          p_duration: number
        }
        Returns: {
          slot_time: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T]["Row"]

export type TablesInsert
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T]["Insert"]

export type TablesUpdate
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T]["Update"]