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
      users: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string | null
        }
      }
      trips: {
        Row: {
          id: string
          owner_id: string
          title: string
          primary_destination: string
          trip_type: string
          start_date: string
          end_date: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          primary_destination: string
          trip_type: string
          start_date: string
          end_date: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          primary_destination?: string
          trip_type?: string
          start_date?: string
          end_date?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      days: {
        Row: {
          id: string
          trip_id: string
          date: string
          day_index: number
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          date: string
          day_index: number
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          date?: string
          day_index?: number
          notes?: string | null
          created_at?: string | null
        }
      }
      activities: {
        Row: {
          id: string
          day_id: string
          title: string
          start_time: string | null
          end_time: string | null
          duration_minutes: number | null
          category: string | null
          notes: string | null
          position: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          day_id: string
          title: string
          start_time?: string | null
          end_time?: string | null
          duration_minutes?: number | null
          category?: string | null
          notes?: string | null
          position?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          day_id?: string
          title?: string
          start_time?: string | null
          end_time?: string | null
          duration_minutes?: number | null
          category?: string | null
          notes?: string | null
          position?: number | null
          created_at?: string | null
        }
      }
    }
  }
}
