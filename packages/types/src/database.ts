export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      admin_inventory_preferences: {
        Row: {
          organization_id: string
          updated_at: string
          user_id: string
          view_mode: string
        }
        Insert: {
          organization_id: string
          updated_at?: string
          user_id: string
          view_mode?: string
        }
        Update: {
          organization_id?: string
          updated_at?: string
          user_id?: string
          view_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_inventory_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      allergy_intolerances: {
        Row: {
          category: string
          clinical_status: string
          created_at: string
          criticality: string
          id: string
          manifestation: string
          organization_id: string
          patient_id: string
          recorded_date: string
          recorder_practitioner_id: string | null
          substance: string
          updated_at: string
          verification_status: string
        }
        Insert: {
          category?: string
          clinical_status?: string
          created_at?: string
          criticality?: string
          id?: string
          manifestation: string
          organization_id: string
          patient_id: string
          recorded_date?: string
          recorder_practitioner_id?: string | null
          substance: string
          updated_at?: string
          verification_status?: string
        }
        Update: {
          category?: string
          clinical_status?: string
          created_at?: string
          criticality?: string
          id?: string
          manifestation?: string
          organization_id?: string
          patient_id?: string
          recorded_date?: string
          recorder_practitioner_id?: string | null
          substance?: string
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "allergy_intolerances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allergy_intolerances_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allergy_intolerances_recorder_practitioner_id_fkey"
            columns: ["recorder_practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_slots: {
        Row: {
          appointment_id: string | null
          clinic_service_id: string | null
          created_at: string
          end_at: string
          id: string
          organization_id: string
          practitioner_role_id: string
          service_type: string | null
          start_at: string
          status: Database["public"]["Enums"]["slot_status"]
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_service_id?: string | null
          created_at?: string
          end_at: string
          id?: string
          organization_id: string
          practitioner_role_id: string
          service_type?: string | null
          start_at: string
          status?: Database["public"]["Enums"]["slot_status"]
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          clinic_service_id?: string | null
          created_at?: string
          end_at?: string
          id?: string
          organization_id?: string
          practitioner_role_id?: string
          service_type?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["slot_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_slots_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_slots_clinic_service_id_fkey"
            columns: ["clinic_service_id"]
            isOneToOne: false
            referencedRelation: "clinic_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_slots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_slots_practitioner_role_id_fkey"
            columns: ["practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_type: string | null
          billing_coverage_id: string | null
          billing_mode: Database["public"]["Enums"]["billing_mode"] | null
          billing_mode_source: string | null
          cancellation_reason: string | null
          clinic_service_id: string | null
          created_at: string
          delivery_mode: Database["public"]["Enums"]["appointment_delivery_mode"]
          description: string | null
          end_at: string | null
          id: string
          minutes_duration: number | null
          organization_id: string
          original_assigned_practitioner_role_id: string | null
          patient_id: string
          patient_instruction: string | null
          payment_due_at: string | null
          practitioner_role_id: string | null
          queue_date: string | null
          queue_label: string | null
          queue_number: number | null
          reason_codes: Json
          service_category: string | null
          service_type: string | null
          slot_confirmed_at: string | null
          specialty: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          appointment_type?: string | null
          billing_coverage_id?: string | null
          billing_mode?: Database["public"]["Enums"]["billing_mode"] | null
          billing_mode_source?: string | null
          cancellation_reason?: string | null
          clinic_service_id?: string | null
          created_at?: string
          delivery_mode?: Database["public"]["Enums"]["appointment_delivery_mode"]
          description?: string | null
          end_at?: string | null
          id?: string
          minutes_duration?: number | null
          organization_id: string
          original_assigned_practitioner_role_id?: string | null
          patient_id: string
          patient_instruction?: string | null
          payment_due_at?: string | null
          practitioner_role_id?: string | null
          queue_date?: string | null
          queue_label?: string | null
          queue_number?: number | null
          reason_codes?: Json
          service_category?: string | null
          service_type?: string | null
          slot_confirmed_at?: string | null
          specialty?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          appointment_type?: string | null
          billing_coverage_id?: string | null
          billing_mode?: Database["public"]["Enums"]["billing_mode"] | null
          billing_mode_source?: string | null
          cancellation_reason?: string | null
          clinic_service_id?: string | null
          created_at?: string
          delivery_mode?: Database["public"]["Enums"]["appointment_delivery_mode"]
          description?: string | null
          end_at?: string | null
          id?: string
          minutes_duration?: number | null
          organization_id?: string
          original_assigned_practitioner_role_id?: string | null
          patient_id?: string
          patient_instruction?: string | null
          payment_due_at?: string | null
          practitioner_role_id?: string | null
          queue_date?: string | null
          queue_label?: string | null
          queue_number?: number | null
          reason_codes?: Json
          service_category?: string | null
          service_type?: string | null
          slot_confirmed_at?: string | null
          specialty?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_billing_coverage_id_fkey"
            columns: ["billing_coverage_id"]
            isOneToOne: false
            referencedRelation: "coverages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_clinic_service_id_fkey"
            columns: ["clinic_service_id"]
            isOneToOne: false
            referencedRelation: "clinic_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_original_assigned_practitioner_role_id_fkey"
            columns: ["original_assigned_practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_practitioner_role_id_fkey"
            columns: ["practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          created_at: string
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string | null
          record_id: string
          table_name: string
          updated_at: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string | null
          record_id: string
          table_name: string
          updated_at?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string | null
          record_id?: string
          table_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          appointment_id: string | null
          billing_mode: Database["public"]["Enums"]["billing_mode"]
          billing_mode_source: string | null
          coverage_id: string | null
          created_at: string
          encounter_id: string | null
          finalized_at: string | null
          finalized_by: string | null
          id: string
          notes: string | null
          organization_id: string
          patient_id: string | null
          payor_type: Database["public"]["Enums"]["payor_type"]
          status: Database["public"]["Enums"]["billing_event_status"]
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          billing_mode: Database["public"]["Enums"]["billing_mode"]
          billing_mode_source?: string | null
          coverage_id?: string | null
          created_at?: string
          encounter_id?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          patient_id?: string | null
          payor_type?: Database["public"]["Enums"]["payor_type"]
          status?: Database["public"]["Enums"]["billing_event_status"]
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          billing_mode?: Database["public"]["Enums"]["billing_mode"]
          billing_mode_source?: string | null
          coverage_id?: string | null
          created_at?: string
          encounter_id?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          patient_id?: string | null
          payor_type?: Database["public"]["Enums"]["payor_type"]
          status?: Database["public"]["Enums"]["billing_event_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_coverage_id_fkey"
            columns: ["coverage_id"]
            isOneToOne: false
            referencedRelation: "coverages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_line_items: {
        Row: {
          billing_event_id: string
          billing_mode: Database["public"]["Enums"]["billing_mode"] | null
          created_at: string
          currency: string
          description: string
          id: string
          invoice_id: string | null
          line_total: number
          organization_id: string
          payment_status: Database["public"]["Enums"]["billing_line_payment_status"]
          payor_type: Database["public"]["Enums"]["payor_type"] | null
          quantity: number
          source_id: string | null
          source_type: string
          standard_line_total_in_centavos: number | null
          standard_unit_price_in_centavos: number | null
          tagged_at: string | null
          tagged_by: string | null
          unit_cost: number
          unit_price: number
          updated_at: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          billing_event_id: string
          billing_mode?: Database["public"]["Enums"]["billing_mode"] | null
          created_at?: string
          currency?: string
          description: string
          id?: string
          invoice_id?: string | null
          line_total?: number
          organization_id: string
          payment_status?: Database["public"]["Enums"]["billing_line_payment_status"]
          payor_type?: Database["public"]["Enums"]["payor_type"] | null
          quantity?: number
          source_id?: string | null
          source_type: string
          standard_line_total_in_centavos?: number | null
          standard_unit_price_in_centavos?: number | null
          tagged_at?: string | null
          tagged_by?: string | null
          unit_cost?: number
          unit_price: number
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          billing_event_id?: string
          billing_mode?: Database["public"]["Enums"]["billing_mode"] | null
          created_at?: string
          currency?: string
          description?: string
          id?: string
          invoice_id?: string | null
          line_total?: number
          organization_id?: string
          payment_status?: Database["public"]["Enums"]["billing_line_payment_status"]
          payor_type?: Database["public"]["Enums"]["payor_type"] | null
          quantity?: number
          source_id?: string | null
          source_type?: string
          standard_line_total_in_centavos?: number | null
          standard_unit_price_in_centavos?: number | null
          tagged_at?: string | null
          tagged_by?: string | null
          unit_cost?: number
          unit_price?: number
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_line_items_billing_event_id_fkey"
            columns: ["billing_event_id"]
            isOneToOne: false
            referencedRelation: "billing_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_line_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_state_transitions: {
        Row: {
          actor_user_id: string | null
          entity_id: string
          entity_type: string
          from_state: string | null
          id: string
          occurred_at: string
          organization_id: string
          reason: string | null
          to_state: string
        }
        Insert: {
          actor_user_id?: string | null
          entity_id: string
          entity_type: string
          from_state?: string | null
          id?: string
          occurred_at?: string
          organization_id: string
          reason?: string | null
          to_state: string
        }
        Update: {
          actor_user_id?: string | null
          entity_id?: string
          entity_type?: string
          from_state?: string | null
          id?: string
          occurred_at?: string
          organization_id?: string
          reason?: string | null
          to_state?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_state_transitions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          adjudicated_at: string | null
          adjudicated_by: string | null
          adjudication_result: string | null
          approved_amount: number | null
          approved_amount_centavos: number | null
          billable_period_end: string | null
          billable_period_start: string | null
          billing_event_id: string | null
          claim_type: string
          claimed_amount_centavos: number | null
          coverage_id: string | null
          created_at: string
          currency: string
          denied_reason: string | null
          encounter_id: string | null
          id: string
          items: Json
          organization_id: string
          patient_id: string
          payer_type: string | null
          payor_type: Database["public"]["Enums"]["payor_type"] | null
          philhealth_claim_number: string | null
          primary_icd10_code: string | null
          priority_code: string | null
          provider_organization_id: string | null
          state: Database["public"]["Enums"]["claim_lifecycle_state"]
          status: Database["public"]["Enums"]["claim_status"]
          submitted_at: string | null
          submitted_by: string | null
          total: number | null
          updated_at: string
          use: string
        }
        Insert: {
          adjudicated_at?: string | null
          adjudicated_by?: string | null
          adjudication_result?: string | null
          approved_amount?: number | null
          approved_amount_centavos?: number | null
          billable_period_end?: string | null
          billable_period_start?: string | null
          billing_event_id?: string | null
          claim_type: string
          claimed_amount_centavos?: number | null
          coverage_id?: string | null
          created_at?: string
          currency?: string
          denied_reason?: string | null
          encounter_id?: string | null
          id?: string
          items?: Json
          organization_id: string
          patient_id: string
          payer_type?: string | null
          payor_type?: Database["public"]["Enums"]["payor_type"] | null
          philhealth_claim_number?: string | null
          primary_icd10_code?: string | null
          priority_code?: string | null
          provider_organization_id?: string | null
          state?: Database["public"]["Enums"]["claim_lifecycle_state"]
          status?: Database["public"]["Enums"]["claim_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          total?: number | null
          updated_at?: string
          use?: string
        }
        Update: {
          adjudicated_at?: string | null
          adjudicated_by?: string | null
          adjudication_result?: string | null
          approved_amount?: number | null
          approved_amount_centavos?: number | null
          billable_period_end?: string | null
          billable_period_start?: string | null
          billing_event_id?: string | null
          claim_type?: string
          claimed_amount_centavos?: number | null
          coverage_id?: string | null
          created_at?: string
          currency?: string
          denied_reason?: string | null
          encounter_id?: string | null
          id?: string
          items?: Json
          organization_id?: string
          patient_id?: string
          payer_type?: string | null
          payor_type?: Database["public"]["Enums"]["payor_type"] | null
          philhealth_claim_number?: string | null
          primary_icd10_code?: string | null
          priority_code?: string | null
          provider_organization_id?: string | null
          state?: Database["public"]["Enums"]["claim_lifecycle_state"]
          status?: Database["public"]["Enums"]["claim_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          total?: number | null
          updated_at?: string
          use?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_billing_event_id_fkey"
            columns: ["billing_event_id"]
            isOneToOne: false
            referencedRelation: "billing_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_coverage_id_fkey"
            columns: ["coverage_id"]
            isOneToOne: false
            referencedRelation: "coverages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_provider_organization_id_fkey"
            columns: ["provider_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_role_definitions: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_role_definitions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_role_permission_overrides: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          permission: string
          role_code: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          permission: string
          role_code: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          permission?: string
          role_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_role_permission_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_rooms: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_services: {
        Row: {
          active: boolean
          base_price: number | null
          booking_enabled: boolean
          code: string
          created_at: string
          currency: string
          delivery_modes: Database["public"]["Enums"]["appointment_delivery_mode"][]
          description: string | null
          duration_minutes: number
          id: string
          max_professional_fee: number | null
          min_professional_fee: number | null
          name: string
          nbb_eligible: boolean | null
          organization_id: string
          owner_practitioner_role_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price?: number | null
          booking_enabled?: boolean
          code: string
          created_at?: string
          currency?: string
          delivery_modes?: Database["public"]["Enums"]["appointment_delivery_mode"][]
          description?: string | null
          duration_minutes?: number
          id?: string
          max_professional_fee?: number | null
          min_professional_fee?: number | null
          name: string
          nbb_eligible?: boolean | null
          organization_id: string
          owner_practitioner_role_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price?: number | null
          booking_enabled?: boolean
          code?: string
          created_at?: string
          currency?: string
          delivery_modes?: Database["public"]["Enums"]["appointment_delivery_mode"][]
          description?: string | null
          duration_minutes?: number
          id?: string
          max_professional_fee?: number | null
          min_professional_fee?: number | null
          name?: string
          nbb_eligible?: boolean | null
          organization_id?: string
          owner_practitioner_role_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_services_owner_practitioner_role_id_fkey"
            columns: ["owner_practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_user_access_status: {
        Row: {
          active: boolean
          created_at: string
          id: string
          organization_id: string
          updated_at: string
          updated_by: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          organization_id: string
          updated_at?: string
          updated_by: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          organization_id?: string
          updated_at?: string
          updated_by?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_user_access_status_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_notifications: {
        Row: {
          created_at: string
          diagnostic_report_id: string | null
          id: string
          kind: string
          message: string
          organization_id: string
          read_at: string | null
          recipient_user_id: string
          service_request_id: string
          title: string
        }
        Insert: {
          created_at?: string
          diagnostic_report_id?: string | null
          id?: string
          kind: string
          message: string
          organization_id: string
          read_at?: string | null
          recipient_user_id: string
          service_request_id: string
          title: string
        }
        Update: {
          created_at?: string
          diagnostic_report_id?: string | null
          id?: string
          kind?: string
          message?: string
          organization_id?: string
          read_at?: string | null
          recipient_user_id?: string
          service_request_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notifications_diagnostic_report_id_fkey"
            columns: ["diagnostic_report_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notifications_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      conditions: {
        Row: {
          clinical_status: string
          code: string
          code_display: string
          code_system: string
          created_at: string
          diagnosis_rank: number | null
          encounter_id: string | null
          id: string
          is_sensitive: boolean
          onset_date: string | null
          organization_id: string
          patient_id: string
          recorded_by_name: string | null
          recorded_by_practitioner_id: string | null
          resolved_date: string | null
          sensitive_category: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          clinical_status?: string
          code: string
          code_display: string
          code_system?: string
          created_at?: string
          diagnosis_rank?: number | null
          encounter_id?: string | null
          id?: string
          is_sensitive?: boolean
          onset_date?: string | null
          organization_id: string
          patient_id: string
          recorded_by_name?: string | null
          recorded_by_practitioner_id?: string | null
          resolved_date?: string | null
          sensitive_category?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          clinical_status?: string
          code?: string
          code_display?: string
          code_system?: string
          created_at?: string
          diagnosis_rank?: number | null
          encounter_id?: string | null
          id?: string
          is_sensitive?: boolean
          onset_date?: string | null
          organization_id?: string
          patient_id?: string
          recorded_by_name?: string | null
          recorded_by_practitioner_id?: string | null
          resolved_date?: string | null
          sensitive_category?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "conditions_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conditions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conditions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conditions_recorded_by_practitioner_id_fkey"
            columns: ["recorded_by_practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      coverages: {
        Row: {
          beneficiary_relationship: string | null
          class_values: Json
          coverage_type: string
          created_at: string
          hmo_member_number: string | null
          hmo_provider_name: string | null
          id: string
          max_benefit_limit: number | null
          member_birth_date: string | null
          member_family_name: string | null
          member_given_name: string | null
          member_middle_name: string | null
          member_sex: string | null
          member_suffix: string | null
          organization_id: string
          patient_id: string
          payor: Json
          payor_type: Database["public"]["Enums"]["payor_type"] | null
          period_end: string | null
          period_start: string | null
          philhealth_category: string | null
          philhealth_eligibility_checked_at: string | null
          philhealth_eligibility_reference: string | null
          philhealth_id: string | null
          remaining_benefit: number | null
          status: string
          subscriber_id: string | null
          updated_at: string
        }
        Insert: {
          beneficiary_relationship?: string | null
          class_values?: Json
          coverage_type: string
          created_at?: string
          hmo_member_number?: string | null
          hmo_provider_name?: string | null
          id?: string
          max_benefit_limit?: number | null
          member_birth_date?: string | null
          member_family_name?: string | null
          member_given_name?: string | null
          member_middle_name?: string | null
          member_sex?: string | null
          member_suffix?: string | null
          organization_id: string
          patient_id: string
          payor: Json
          payor_type?: Database["public"]["Enums"]["payor_type"] | null
          period_end?: string | null
          period_start?: string | null
          philhealth_category?: string | null
          philhealth_eligibility_checked_at?: string | null
          philhealth_eligibility_reference?: string | null
          philhealth_id?: string | null
          remaining_benefit?: number | null
          status: string
          subscriber_id?: string | null
          updated_at?: string
        }
        Update: {
          beneficiary_relationship?: string | null
          class_values?: Json
          coverage_type?: string
          created_at?: string
          hmo_member_number?: string | null
          hmo_provider_name?: string | null
          id?: string
          max_benefit_limit?: number | null
          member_birth_date?: string | null
          member_family_name?: string | null
          member_given_name?: string | null
          member_middle_name?: string | null
          member_sex?: string | null
          member_suffix?: string | null
          organization_id?: string
          patient_id?: string
          payor?: Json
          payor_type?: Database["public"]["Enums"]["payor_type"] | null
          period_end?: string | null
          period_start?: string | null
          philhealth_category?: string | null
          philhealth_eligibility_checked_at?: string | null
          philhealth_eligibility_reference?: string | null
          philhealth_id?: string | null
          remaining_benefit?: number | null
          status?: string
          subscriber_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coverages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      department_stock: {
        Row: {
          category_id: string
          created_at: string
          department_id: string
          id: string
          item_id: string
          organization_id: string
          quantity: number
          reorder_level: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          department_id: string
          id?: string
          item_id: string
          organization_id: string
          quantity?: number
          reorder_level?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          department_id?: string
          id?: string
          item_id?: string
          organization_id?: string
          quantity?: number
          reorder_level?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_stock_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_stock_department_id_organization_id_fkey"
            columns: ["department_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "department_stock_item_id_organization_id_fkey"
            columns: ["item_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "department_stock_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          id: string
          is_root_supply: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_root_supply?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_root_supply?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_reports: {
        Row: {
          based_on_service_request_id: string | null
          category_codes: Json
          code: string
          code_display: string | null
          conclusion: string | null
          conclusion_codes: Json
          created_at: string
          effective_at: string | null
          encounter_id: string | null
          id: string
          issued_at: string | null
          organization_id: string
          patient_id: string
          performer_organization_id: string | null
          presented_form: Json
          status: Database["public"]["Enums"]["diagnostic_report_status"]
          updated_at: string
        }
        Insert: {
          based_on_service_request_id?: string | null
          category_codes?: Json
          code: string
          code_display?: string | null
          conclusion?: string | null
          conclusion_codes?: Json
          created_at?: string
          effective_at?: string | null
          encounter_id?: string | null
          id?: string
          issued_at?: string | null
          organization_id: string
          patient_id: string
          performer_organization_id?: string | null
          presented_form?: Json
          status?: Database["public"]["Enums"]["diagnostic_report_status"]
          updated_at?: string
        }
        Update: {
          based_on_service_request_id?: string | null
          category_codes?: Json
          code?: string
          code_display?: string | null
          conclusion?: string | null
          conclusion_codes?: Json
          created_at?: string
          effective_at?: string | null
          encounter_id?: string | null
          id?: string
          issued_at?: string | null
          organization_id?: string
          patient_id?: string
          performer_organization_id?: string | null
          presented_form?: Json
          status?: Database["public"]["Enums"]["diagnostic_report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_reports_based_on_service_request_id_fkey"
            columns: ["based_on_service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_reports_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_reports_performer_organization_id_fkey"
            columns: ["performer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      disease_surveillance_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          purpose: string
          resource_ref: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          purpose: string
          resource_ref?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          purpose?: string
          resource_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disease_surveillance_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      disease_surveillance_rollups: {
        Row: {
          age_bracket: string
          barangay: string | null
          case_count: number
          created_at: string
          disease_name: string
          doh_category: string
          epi_week: number
          epi_year: number
          gender: string | null
          icd10_code: string
          id: string
          is_suppressed: boolean
          municipality: string | null
          organization_id: string
          psgc_code: string | null
        }
        Insert: {
          age_bracket: string
          barangay?: string | null
          case_count: number
          created_at?: string
          disease_name: string
          doh_category: string
          epi_week: number
          epi_year: number
          gender?: string | null
          icd10_code: string
          id?: string
          is_suppressed?: boolean
          municipality?: string | null
          organization_id: string
          psgc_code?: string | null
        }
        Update: {
          age_bracket?: string
          barangay?: string | null
          case_count?: number
          created_at?: string
          disease_name?: string
          doh_category?: string
          epi_week?: number
          epi_year?: number
          gender?: string | null
          icd10_code?: string
          id?: string
          is_suppressed?: boolean
          municipality?: string | null
          organization_id?: string
          psgc_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disease_surveillance_rollups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disease_surveillance_rollups_psgc_code_fkey"
            columns: ["psgc_code"]
            isOneToOne: false
            referencedRelation: "geo_barangays"
            referencedColumns: ["psgc_code"]
          },
        ]
      }
      doctor_payouts: {
        Row: {
          assigned_practitioner_role_id: string
          billing_event_id: string
          created_at: string
          currency: string
          encounter_id: string
          gross_service_amount: number
          id: string
          organization_id: string
          paid_at: string | null
          paid_by: string | null
          payment_reference: string | null
          payout_amount: number
          performed_by_practitioner_role_id: string | null
          practitioner_role_id: string
          share_basis_points: number
          status: Database["public"]["Enums"]["doctor_payout_status"]
          updated_at: string
        }
        Insert: {
          assigned_practitioner_role_id: string
          billing_event_id: string
          created_at?: string
          currency?: string
          encounter_id: string
          gross_service_amount: number
          id?: string
          organization_id: string
          paid_at?: string | null
          paid_by?: string | null
          payment_reference?: string | null
          payout_amount: number
          performed_by_practitioner_role_id?: string | null
          practitioner_role_id: string
          share_basis_points: number
          status?: Database["public"]["Enums"]["doctor_payout_status"]
          updated_at?: string
        }
        Update: {
          assigned_practitioner_role_id?: string
          billing_event_id?: string
          created_at?: string
          currency?: string
          encounter_id?: string
          gross_service_amount?: number
          id?: string
          organization_id?: string
          paid_at?: string | null
          paid_by?: string | null
          payment_reference?: string | null
          payout_amount?: number
          performed_by_practitioner_role_id?: string | null
          practitioner_role_id?: string
          share_basis_points?: number
          status?: Database["public"]["Enums"]["doctor_payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_payouts_assigned_practitioner_role_id_fkey"
            columns: ["assigned_practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_payouts_billing_event_id_fkey"
            columns: ["billing_event_id"]
            isOneToOne: true
            referencedRelation: "billing_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_payouts_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: true
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_payouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_payouts_performed_by_practitioner_role_id_fkey"
            columns: ["performed_by_practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_payouts_practitioner_role_id_fkey"
            columns: ["practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_references: {
        Row: {
          author_practitioner_id: string | null
          category_codes: Json
          content_title: string | null
          content_type: string
          content_url: string
          created_at: string
          date_at: string
          description: string | null
          doc_status: string | null
          encounter_id: string | null
          id: string
          organization_id: string
          patient_id: string | null
          status: Database["public"]["Enums"]["document_reference_status"]
          template_id: string | null
          template_version: number | null
          type_code: string
          type_display: string | null
          updated_at: string
        }
        Insert: {
          author_practitioner_id?: string | null
          category_codes?: Json
          content_title?: string | null
          content_type: string
          content_url: string
          created_at?: string
          date_at?: string
          description?: string | null
          doc_status?: string | null
          encounter_id?: string | null
          id?: string
          organization_id: string
          patient_id?: string | null
          status?: Database["public"]["Enums"]["document_reference_status"]
          template_id?: string | null
          template_version?: number | null
          type_code: string
          type_display?: string | null
          updated_at?: string
        }
        Update: {
          author_practitioner_id?: string | null
          category_codes?: Json
          content_title?: string | null
          content_type?: string
          content_url?: string
          created_at?: string
          date_at?: string
          description?: string | null
          doc_status?: string | null
          encounter_id?: string | null
          id?: string
          organization_id?: string
          patient_id?: string | null
          status?: Database["public"]["Enums"]["document_reference_status"]
          template_id?: string | null
          template_version?: number | null
          type_code?: string
          type_display?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_references_author_practitioner_id_fkey"
            columns: ["author_practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_references_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_references_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_references_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_references_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      document_template_versions: {
        Row: {
          condition_code: string | null
          condition_display: string | null
          condition_system: string | null
          id: string
          organization_id: string
          published_at: string
          published_by: string | null
          structured_body: Json
          template_id: string
          title: string
          type: string
          version: number
        }
        Insert: {
          condition_code?: string | null
          condition_display?: string | null
          condition_system?: string | null
          id?: string
          organization_id: string
          published_at?: string
          published_by?: string | null
          structured_body: Json
          template_id: string
          title: string
          type: string
          version: number
        }
        Update: {
          condition_code?: string | null
          condition_display?: string | null
          condition_system?: string | null
          id?: string
          organization_id?: string
          published_at?: string
          published_by?: string | null
          structured_body?: Json
          template_id?: string
          title?: string
          type?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_template_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          active: boolean
          body: string
          category: string
          code: string
          condition_code: string | null
          condition_display: string | null
          condition_system: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean
          name: string
          organization_id: string
          owner_doctor_id: string | null
          status: string
          structured_body: Json
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          active?: boolean
          body: string
          category: string
          code: string
          condition_code?: string | null
          condition_display?: string | null
          condition_system?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          owner_doctor_id?: string | null
          status?: string
          structured_body?: Json
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          active?: boolean
          body?: string
          category?: string
          code?: string
          condition_code?: string | null
          condition_display?: string | null
          condition_system?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          owner_doctor_id?: string | null
          status?: string
          structured_body?: Json
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_templates_owner_doctor_id_fkey"
            columns: ["owner_doctor_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      encounter_locks: {
        Row: {
          acquired_at: string
          encounter_id: string
          expires_at: string
          heartbeat_at: string
          organization_id: string
          practitioner_role_id: string
        }
        Insert: {
          acquired_at?: string
          encounter_id: string
          expires_at: string
          heartbeat_at?: string
          organization_id: string
          practitioner_role_id: string
        }
        Update: {
          acquired_at?: string
          encounter_id?: string
          expires_at?: string
          heartbeat_at?: string
          organization_id?: string
          practitioner_role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encounter_locks_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: true
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounter_locks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounter_locks_practitioner_role_id_fkey"
            columns: ["practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      encounters: {
        Row: {
          accommodation_type: string | null
          appointment_id: string | null
          assessment_note: string | null
          billing_coverage_id: string | null
          billing_mode: Database["public"]["Enums"]["billing_mode"] | null
          billing_mode_source: string | null
          class_code: string
          core_presentation_code: string | null
          created_at: string
          diagnosis: Json
          discharge_outcome: string | null
          encounter_setting: string | null
          id: string
          objective_note: string | null
          organization_id: string
          patient_id: string
          period_end: string | null
          period_start: string | null
          plan_note: string | null
          practitioner_role_id: string | null
          reason_codes: Json
          referred_from_facility: string | null
          referred_from_reason: string | null
          referred_to_facility: string | null
          referred_to_reason: string | null
          service_type: string | null
          status: Database["public"]["Enums"]["encounter_status"]
          subject_note: string | null
          triage_level: number | null
          type_codes: Json
          updated_at: string
          version: number
        }
        Insert: {
          accommodation_type?: string | null
          appointment_id?: string | null
          assessment_note?: string | null
          billing_coverage_id?: string | null
          billing_mode?: Database["public"]["Enums"]["billing_mode"] | null
          billing_mode_source?: string | null
          class_code?: string
          core_presentation_code?: string | null
          created_at?: string
          diagnosis?: Json
          discharge_outcome?: string | null
          encounter_setting?: string | null
          id?: string
          objective_note?: string | null
          organization_id: string
          patient_id: string
          period_end?: string | null
          period_start?: string | null
          plan_note?: string | null
          practitioner_role_id?: string | null
          reason_codes?: Json
          referred_from_facility?: string | null
          referred_from_reason?: string | null
          referred_to_facility?: string | null
          referred_to_reason?: string | null
          service_type?: string | null
          status?: Database["public"]["Enums"]["encounter_status"]
          subject_note?: string | null
          triage_level?: number | null
          type_codes?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          accommodation_type?: string | null
          appointment_id?: string | null
          assessment_note?: string | null
          billing_coverage_id?: string | null
          billing_mode?: Database["public"]["Enums"]["billing_mode"] | null
          billing_mode_source?: string | null
          class_code?: string
          core_presentation_code?: string | null
          created_at?: string
          diagnosis?: Json
          discharge_outcome?: string | null
          encounter_setting?: string | null
          id?: string
          objective_note?: string | null
          organization_id?: string
          patient_id?: string
          period_end?: string | null
          period_start?: string | null
          plan_note?: string | null
          practitioner_role_id?: string | null
          reason_codes?: Json
          referred_from_facility?: string | null
          referred_from_reason?: string | null
          referred_to_facility?: string | null
          referred_to_reason?: string | null
          service_type?: string | null
          status?: Database["public"]["Enums"]["encounter_status"]
          subject_note?: string | null
          triage_level?: number | null
          type_codes?: Json
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "encounters_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_billing_coverage_id_fkey"
            columns: ["billing_coverage_id"]
            isOneToOne: false
            referencedRelation: "coverages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_core_presentation_code_fkey"
            columns: ["core_presentation_code"]
            isOneToOne: false
            referencedRelation: "philhealth_core_presentations"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "encounters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_practitioner_role_id_fkey"
            columns: ["practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_barangays: {
        Row: {
          barangay_name: string
          geom: unknown
          geom_simplified: unknown
          municipality_code: string
          municipality_name: string
          province_name: string
          psgc_code: string
          region_name: string
        }
        Insert: {
          barangay_name: string
          geom: unknown
          geom_simplified: unknown
          municipality_code: string
          municipality_name: string
          province_name: string
          psgc_code: string
          region_name: string
        }
        Update: {
          barangay_name?: string
          geom?: unknown
          geom_simplified?: unknown
          municipality_code?: string
          municipality_name?: string
          province_name?: string
          psgc_code?: string
          region_name?: string
        }
        Relationships: []
      }
      geo_population_denominators: {
        Row: {
          census_year: number
          population: number
          psgc_code: string
          source: string
        }
        Insert: {
          census_year: number
          population: number
          psgc_code: string
          source: string
        }
        Update: {
          census_year?: number
          population?: number
          psgc_code?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "geo_population_denominators_psgc_code_fkey"
            columns: ["psgc_code"]
            isOneToOne: false
            referencedRelation: "geo_barangays"
            referencedColumns: ["psgc_code"]
          },
        ]
      }
      hello_world: {
        Row: {
          created_at: string
          id: string
          message: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
        }
        Relationships: []
      }
      icd10_reference: {
        Row: {
          case_rate: number | null
          category: string | null
          code: string
          created_at: string
          description: string
          hci_fee: number | null
          professional_fee: number | null
          source: string
        }
        Insert: {
          case_rate?: number | null
          category?: string | null
          code: string
          created_at?: string
          description: string
          hci_fee?: number | null
          professional_fee?: number | null
          source?: string
        }
        Update: {
          case_rate?: number | null
          category?: string | null
          code?: string
          created_at?: string
          description?: string
          hci_fee?: number | null
          professional_fee?: number | null
          source?: string
        }
        Relationships: []
      }
      immunizations: {
        Row: {
          administered_by_name: string | null
          administered_date: string
          created_at: string
          dose_number: string
          encounter_id: string | null
          id: string
          lot_number: string | null
          organization_id: string
          patient_id: string
          vaccine_code: string
          vaccine_display: string
        }
        Insert: {
          administered_by_name?: string | null
          administered_date?: string
          created_at?: string
          dose_number?: string
          encounter_id?: string | null
          id?: string
          lot_number?: string | null
          organization_id: string
          patient_id: string
          vaccine_code: string
          vaccine_display: string
        }
        Update: {
          administered_by_name?: string | null
          administered_date?: string
          created_at?: string
          dose_number?: string
          encounter_id?: string | null
          id?: string
          lot_number?: string | null
          organization_id?: string
          patient_id?: string
          vaccine_code?: string
          vaccine_display?: string
        }
        Relationships: [
          {
            foreignKeyName: "immunizations_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immunizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immunizations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_batches: {
        Row: {
          created_at: string
          department_id: string
          expiry_date: string | null
          id: string
          item_id: string
          legacy_unassigned_expiry: boolean
          lot_number: string | null
          organization_id: string
          quantity: number
          received_at: string
          stock_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id: string
          expiry_date?: string | null
          id?: string
          item_id: string
          legacy_unassigned_expiry?: boolean
          lot_number?: string | null
          organization_id: string
          quantity: number
          received_at?: string
          stock_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string
          expiry_date?: string | null
          id?: string
          item_id?: string
          legacy_unassigned_expiry?: boolean
          lot_number?: string | null
          organization_id?: string
          quantity?: number
          received_at?: string
          stock_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_department_id_organization_id_fkey"
            columns: ["department_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "inventory_batches_item_id_organization_id_fkey"
            columns: ["item_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "inventory_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_stock_id_organization_id_fkey"
            columns: ["stock_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "department_stock"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          active: boolean
          created_at: string
          department_id: string
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          department_id: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          department_id?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_department_id_organization_id_fkey"
            columns: ["department_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "inventory_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_expiry_settings: {
        Row: {
          near_expiry_days: number
          organization_id: string
          updated_at: string
        }
        Insert: {
          near_expiry_days?: number
          organization_id: string
          updated_at?: string
        }
        Update: {
          near_expiry_days?: number
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_expiry_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_holds: {
        Row: {
          billing_event_id: string | null
          currency: string
          department_id: string
          dispensed_at: string | null
          encounter_id: string
          held_at: string
          held_by: string
          id: string
          item_id: string
          organization_id: string
          patient_id: string
          quantity: number
          status: string
          stock_id: string
          unit_cost: number
          unit_price: number
        }
        Insert: {
          billing_event_id?: string | null
          currency: string
          department_id: string
          dispensed_at?: string | null
          encounter_id: string
          held_at?: string
          held_by: string
          id?: string
          item_id: string
          organization_id: string
          patient_id: string
          quantity: number
          status?: string
          stock_id: string
          unit_cost: number
          unit_price: number
        }
        Update: {
          billing_event_id?: string | null
          currency?: string
          department_id?: string
          dispensed_at?: string | null
          encounter_id?: string
          held_at?: string
          held_by?: string
          id?: string
          item_id?: string
          organization_id?: string
          patient_id?: string
          quantity?: number
          status?: string
          stock_id?: string
          unit_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_holds_billing_event_id_fkey"
            columns: ["billing_event_id"]
            isOneToOne: false
            referencedRelation: "billing_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_holds_department_id_organization_id_fkey"
            columns: ["department_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "inventory_holds_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_holds_item_id_organization_id_fkey"
            columns: ["item_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "inventory_holds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_holds_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_holds_stock_id_organization_id_fkey"
            columns: ["stock_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "department_stock"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          description: string | null
          id: string
          is_perishable: boolean
          name: string
          near_expiry_days_override: number | null
          organization_id: string
          selling_price: number
          sku: string
          unit_cost: number
          unit_of_measure: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_perishable?: boolean
          name: string
          near_expiry_days_override?: number | null
          organization_id: string
          selling_price?: number
          sku: string
          unit_cost?: number
          unit_of_measure: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_perishable?: boolean
          name?: string
          near_expiry_days_override?: number | null
          organization_id?: string
          selling_price?: number
          sku?: string
          unit_cost?: number
          unit_of_measure?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_pos_settings: {
        Row: {
          organization_id: string
          pharmacy_department_id: string | null
          updated_at: string
        }
        Insert: {
          organization_id: string
          pharmacy_department_id?: string | null
          updated_at?: string
        }
        Update: {
          organization_id?: string
          pharmacy_department_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_pos_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_pos_settings_pharmacy_department_id_fkey"
            columns: ["pharmacy_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_requisition_items: {
        Row: {
          created_at: string
          dispersed_quantity: number
          id: string
          item_id: string
          notes: string | null
          organization_id: string
          requested_quantity: number
          requisition_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dispersed_quantity?: number
          id?: string
          item_id: string
          notes?: string | null
          organization_id: string
          requested_quantity: number
          requisition_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dispersed_quantity?: number
          id?: string
          item_id?: string
          notes?: string | null
          organization_id?: string
          requested_quantity?: number
          requisition_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_requisition_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_requisition_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_requisition_items_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "inventory_requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_requisitions: {
        Row: {
          created_at: string
          emergency_justification: string | null
          id: string
          is_emergency: boolean
          notes: string | null
          organization_id: string
          requesting_department_id: string
          requisition_number: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          submitted_by: string
          supply_department_id: string
          target_delivery_week: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          emergency_justification?: string | null
          id?: string
          is_emergency?: boolean
          notes?: string | null
          organization_id: string
          requesting_department_id: string
          requisition_number: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          submitted_by: string
          supply_department_id: string
          target_delivery_week: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          emergency_justification?: string | null
          id?: string
          is_emergency?: boolean
          notes?: string | null
          organization_id?: string
          requesting_department_id?: string
          requisition_number?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string
          supply_department_id?: string
          target_delivery_week?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_requisitions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_requisitions_requesting_department_id_organizati_fkey"
            columns: ["requesting_department_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "inventory_requisitions_supply_department_id_organization_i_fkey"
            columns: ["supply_department_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      inventory_stock_movements: {
        Row: {
          batch_id: string | null
          created_at: string
          department_id: string
          id: string
          item_id: string
          movement_type: string
          occurred_at: string
          organization_id: string
          quantity_delta: number
          reason: string | null
          recorded_by: string | null
          stock_id: string
          transfer_group_id: string | null
          usage_id: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          department_id: string
          id?: string
          item_id: string
          movement_type: string
          occurred_at?: string
          organization_id: string
          quantity_delta: number
          reason?: string | null
          recorded_by?: string | null
          stock_id: string
          transfer_group_id?: string | null
          usage_id?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          department_id?: string
          id?: string
          item_id?: string
          movement_type?: string
          occurred_at?: string
          organization_id?: string
          quantity_delta?: number
          reason?: string | null
          recorded_by?: string | null
          stock_id?: string
          transfer_group_id?: string | null
          usage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_stock_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batch_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_stock_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_stock_movements_department_id_organization_id_fkey"
            columns: ["department_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "inventory_stock_movements_item_id_organization_id_fkey"
            columns: ["item_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "inventory_stock_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_stock_movements_stock_id_organization_id_fkey"
            columns: ["stock_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "department_stock"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "inventory_stock_movements_usage_id_fkey"
            columns: ["usage_id"]
            isOneToOne: false
            referencedRelation: "inventory_usages"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_usage_batch_consumptions: {
        Row: {
          batch_id: string
          created_at: string
          id: string
          organization_id: string
          quantity: number
          usage_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          id?: string
          organization_id: string
          quantity: number
          usage_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          quantity?: number
          usage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_usage_batch_consumptions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batch_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usage_batch_consumptions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usage_batch_consumptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usage_batch_consumptions_usage_id_fkey"
            columns: ["usage_id"]
            isOneToOne: false
            referencedRelation: "inventory_usages"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_usage_financial_ledger: {
        Row: {
          billing_line_item_id: string
          id: string
          organization_id: string
          paid_qty: number
          quantity: number
          settled_at: string | null
          settled_by: string | null
          state: Database["public"]["Enums"]["inventory_financial_state"]
          tagged_at: string
          tagged_by: string
          unbilled_qty: number
          usage_id: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          billing_line_item_id: string
          id?: string
          organization_id: string
          paid_qty?: number
          quantity: number
          settled_at?: string | null
          settled_by?: string | null
          state?: Database["public"]["Enums"]["inventory_financial_state"]
          tagged_at?: string
          tagged_by: string
          unbilled_qty: number
          usage_id: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          billing_line_item_id?: string
          id?: string
          organization_id?: string
          paid_qty?: number
          quantity?: number
          settled_at?: string | null
          settled_by?: string | null
          state?: Database["public"]["Enums"]["inventory_financial_state"]
          tagged_at?: string
          tagged_by?: string
          unbilled_qty?: number
          usage_id?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_usage_financial_ledger_billing_line_item_id_fkey"
            columns: ["billing_line_item_id"]
            isOneToOne: true
            referencedRelation: "billing_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usage_financial_ledger_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usage_financial_ledger_usage_id_fkey"
            columns: ["usage_id"]
            isOneToOne: true
            referencedRelation: "inventory_usages"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_usages: {
        Row: {
          created_at: string
          currency: string
          department_id: string
          encounter_id: string | null
          id: string
          item_id: string
          organization_id: string
          patient_id: string | null
          quantity: number
          reference_text: string | null
          stock_id: string
          tagged_by: string
          unit_cost: number
          unit_price: number
          used_at: string
        }
        Insert: {
          created_at?: string
          currency: string
          department_id: string
          encounter_id?: string | null
          id?: string
          item_id: string
          organization_id: string
          patient_id?: string | null
          quantity: number
          reference_text?: string | null
          stock_id: string
          tagged_by: string
          unit_cost?: number
          unit_price: number
          used_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          department_id?: string
          encounter_id?: string | null
          id?: string
          item_id?: string
          organization_id?: string
          patient_id?: string | null
          quantity?: number
          reference_text?: string | null
          stock_id?: string
          tagged_by?: string
          unit_cost?: number
          unit_price?: number
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_usages_department_id_organization_id_fkey"
            columns: ["department_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "inventory_usages_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usages_item_id_organization_id_fkey"
            columns: ["item_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "inventory_usages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usages_stock_id_organization_id_fkey"
            columns: ["stock_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "department_stock"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      invoice_qr_tokens: {
        Row: {
          appointment_id: string | null
          created_at: string
          created_by: string | null
          encounter_id: string | null
          expires_at: string
          id: string
          invoice_id: string
          organization_id: string
          revoked_at: string | null
          token_hash: string
          used_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          expires_at: string
          id?: string
          invoice_id: string
          organization_id: string
          revoked_at?: string | null
          token_hash: string
          used_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          expires_at?: string
          id?: string
          invoice_id?: string
          organization_id?: string
          revoked_at?: string | null
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_qr_tokens_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_qr_tokens_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_qr_tokens_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_qr_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          balance_due: number
          billing_event_id: string
          created_at: string
          discount_amount: number
          due_at: string | null
          id: string
          invoice_number: string
          issued_at: string | null
          organization_id: string
          paid_at: string | null
          patient_balance_due_in_centavos: number | null
          patient_id: string | null
          qr_payment_token: string | null
          standard_total_in_centavos: number | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number
          total_due: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          balance_due?: number
          billing_event_id: string
          created_at?: string
          discount_amount?: number
          due_at?: string | null
          id?: string
          invoice_number: string
          issued_at?: string | null
          organization_id: string
          paid_at?: string | null
          patient_balance_due_in_centavos?: number | null
          patient_id?: string | null
          qr_payment_token?: string | null
          standard_total_in_centavos?: number | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          total_due?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          balance_due?: number
          billing_event_id?: string
          created_at?: string
          discount_amount?: number
          due_at?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          organization_id?: string
          paid_at?: string | null
          patient_balance_due_in_centavos?: number | null
          patient_id?: string | null
          qr_payment_token?: string | null
          standard_total_in_centavos?: number | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          total_due?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_billing_event_id_fkey"
            columns: ["billing_event_id"]
            isOneToOne: false
            referencedRelation: "billing_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      laboratory_services: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          lab_cost: number
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          lab_cost?: number
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          lab_cost?: number
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "laboratory_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_requests: {
        Row: {
          authored_on: string
          category_codes: Json
          created_at: string
          dispense_request: Json | null
          dosage_instruction: Json
          encounter_id: string | null
          id: string
          intent: string
          medication_code: string
          medication_display: string | null
          note: string | null
          organization_id: string
          patient_id: string
          requester_practitioner_id: string | null
          status: "PENDING" | "SUCCESS" | "ERROR"
          template_id: string | null
          template_version: number | null
          updated_at: string
        }
        Insert: {
          authored_on?: string
          category_codes?: Json
          created_at?: string
          dispense_request?: Json | null
          dosage_instruction?: Json
          encounter_id?: string | null
          id?: string
          intent?: string
          medication_code: string
          medication_display?: string | null
          note?: string | null
          organization_id: string
          patient_id: string
          requester_practitioner_id?: string | null
          status?: "PENDING" | "SUCCESS" | "ERROR"
          template_id?: string | null
          template_version?: number | null
          updated_at?: string
        }
        Update: {
          authored_on?: string
          category_codes?: Json
          created_at?: string
          dispense_request?: Json | null
          dosage_instruction?: Json
          encounter_id?: string | null
          id?: string
          intent?: string
          medication_code?: string
          medication_display?: string | null
          note?: string | null
          organization_id?: string
          patient_id?: string
          requester_practitioner_id?: string | null
          status?: "PENDING" | "SUCCESS" | "ERROR"
          template_id?: string | null
          template_version?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_requests_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_requests_requester_practitioner_id_fkey"
            columns: ["requester_practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_requests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          authored_by_practitioner_role_id: string | null
          category_codes: Json
          code: string
          code_display: string | null
          code_system: string | null
          created_at: string
          diagnostic_report_id: string | null
          effective_at: string | null
          encounter_id: string | null
          id: string
          interpretation_codes: Json
          issued_at: string | null
          note: string | null
          organization_id: string
          patient_id: string
          performer_practitioner_id: string | null
          reference_range: Json
          status: Database["public"]["Enums"]["observation_status"]
          supersedes_id: string | null
          updated_at: string
          value: Json | null
          value_unit: string | null
        }
        Insert: {
          authored_by_practitioner_role_id?: string | null
          category_codes?: Json
          code: string
          code_display?: string | null
          code_system?: string | null
          created_at?: string
          diagnostic_report_id?: string | null
          effective_at?: string | null
          encounter_id?: string | null
          id?: string
          interpretation_codes?: Json
          issued_at?: string | null
          note?: string | null
          organization_id: string
          patient_id: string
          performer_practitioner_id?: string | null
          reference_range?: Json
          status?: Database["public"]["Enums"]["observation_status"]
          supersedes_id?: string | null
          updated_at?: string
          value?: Json | null
          value_unit?: string | null
        }
        Update: {
          authored_by_practitioner_role_id?: string | null
          category_codes?: Json
          code?: string
          code_display?: string | null
          code_system?: string | null
          created_at?: string
          diagnostic_report_id?: string | null
          effective_at?: string | null
          encounter_id?: string | null
          id?: string
          interpretation_codes?: Json
          issued_at?: string | null
          note?: string | null
          organization_id?: string
          patient_id?: string
          performer_practitioner_id?: string | null
          reference_range?: Json
          status?: Database["public"]["Enums"]["observation_status"]
          supersedes_id?: string | null
          updated_at?: string
          value?: Json | null
          value_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "observations_authored_by_practitioner_role_id_fkey"
            columns: ["authored_by_practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_diagnostic_report_id_fkey"
            columns: ["diagnostic_report_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_performer_practitioner_id_fkey"
            columns: ["performer_practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_branding: {
        Row: {
          accent_color: string
          booking_confirmation_message: string | null
          clinic_visit_message: string | null
          created_at: string
          display_name: string
          id: string
          logo_url: string | null
          organization_id: string
          primary_color: string
          support_email: string | null
          support_phone: string | null
          tagline: string | null
          teleconsult_message: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accent_color?: string
          booking_confirmation_message?: string | null
          clinic_visit_message?: string | null
          created_at?: string
          display_name: string
          id?: string
          logo_url?: string | null
          organization_id: string
          primary_color?: string
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          teleconsult_message?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accent_color?: string
          booking_confirmation_message?: string | null
          clinic_visit_message?: string | null
          created_at?: string
          display_name?: string
          id?: string
          logo_url?: string | null
          organization_id?: string
          primary_color?: string
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          teleconsult_message?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_branding_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_modules: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          module_key: string
          organization_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          module_key: string
          organization_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          module_key?: string
          organization_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_modules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          balance_billing_policy: string
          created_at: string
          facility_type: string
          fee_model: string
          hci_accreditation_number: string | null
          organization_id: string
          ownership: string
          queue_mode: string
          updated_at: string
        }
        Insert: {
          balance_billing_policy?: string
          created_at?: string
          facility_type?: string
          fee_model?: string
          hci_accreditation_number?: string | null
          organization_id: string
          ownership?: string
          queue_mode?: string
          updated_at?: string
        }
        Update: {
          balance_billing_policy?: string
          created_at?: string
          facility_type?: string
          fee_model?: string
          hci_accreditation_number?: string | null
          organization_id?: string
          ownership?: string
          queue_mode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          active: boolean
          address: Json
          created_at: string
          default_payor_type: Database["public"]["Enums"]["payor_type"]
          id: string
          identifier: Json
          name: string
          telecom: Json
          type_codes: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: Json
          created_at?: string
          default_payor_type?: Database["public"]["Enums"]["payor_type"]
          id?: string
          identifier?: Json
          name: string
          telecom?: Json
          type_codes?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: Json
          created_at?: string
          default_payor_type?: Database["public"]["Enums"]["payor_type"]
          id?: string
          identifier?: Json
          name?: string
          telecom?: Json
          type_codes?: Json
          updated_at?: string
        }
        Relationships: []
      }
      patient_clinic_contexts: {
        Row: {
          auth_user_id: string
          created_at: string
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_clinic_contexts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_import_batches: {
        Row: {
          created_at: string
          error_count: number
          errors: Json
          file_name: string
          id: string
          imported_by: string
          imported_count: number
          organization_id: string
          row_count: number
        }
        Insert: {
          created_at?: string
          error_count?: number
          errors?: Json
          file_name: string
          id?: string
          imported_by: string
          imported_count?: number
          organization_id: string
          row_count: number
        }
        Update: {
          created_at?: string
          error_count?: number
          errors?: Json
          file_name?: string
          id?: string
          imported_by?: string
          imported_count?: number
          organization_id?: string
          row_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "patient_import_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          active: boolean
          address: Json
          auth_user_id: string | null
          birth_date: string | null
          blood_type: string | null
          communication: Json
          contact: Json
          created_at: string
          gender: string | null
          id: string
          identifier: Json
          name: Json
          organization_id: string
          photo_url: string | null
          telecom: Json
          updated_at: string
          walk_in_failed_attempts: number
          walk_in_id: string | null
          walk_in_locked_until: string | null
          walk_in_pin_hash: string | null
        }
        Insert: {
          active?: boolean
          address?: Json
          auth_user_id?: string | null
          birth_date?: string | null
          blood_type?: string | null
          communication?: Json
          contact?: Json
          created_at?: string
          gender?: string | null
          id?: string
          identifier?: Json
          name: Json
          organization_id: string
          photo_url?: string | null
          telecom?: Json
          updated_at?: string
          walk_in_failed_attempts?: number
          walk_in_id?: string | null
          walk_in_locked_until?: string | null
          walk_in_pin_hash?: string | null
        }
        Update: {
          active?: boolean
          address?: Json
          auth_user_id?: string | null
          birth_date?: string | null
          blood_type?: string | null
          communication?: Json
          contact?: Json
          created_at?: string
          gender?: string | null
          id?: string
          identifier?: Json
          name?: Json
          organization_id?: string
          photo_url?: string | null
          telecom?: Json
          updated_at?: string
          walk_in_failed_attempts?: number
          walk_in_id?: string | null
          walk_in_locked_until?: string | null
          walk_in_pin_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string
          currency: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          organization_id: string
          qr_token: string | null
          recorded_by: string | null
          reference_number: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          organization_id: string
          qr_token?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          organization_id?: string
          qr_token?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_prescription_order_events: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          line_id: string | null
          metadata: Json
          order_id: string
          organization_id: string
          reason: string | null
          status: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          line_id?: string | null
          metadata?: Json
          order_id: string
          organization_id: string
          reason?: string | null
          status: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          line_id?: string | null
          metadata?: Json
          order_id?: string
          organization_id?: string
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_prescription_order_event_order_id_organization_id_fkey"
            columns: ["order_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_prescription_orders"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "pharmacy_prescription_order_events_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_prescription_order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_prescription_order_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_prescription_order_lines: {
        Row: {
          created_at: string
          dispensed_quantity: number
          dosage_instruction: string | null
          id: string
          item_id: string | null
          line_total_in_centavos: number | null
          notes: string | null
          order_id: string
          organization_id: string
          original_medication: string
          pharmacist_reason: string | null
          requested_quantity: number
          status: string
          unit_of_measure: string | null
          unit_price_in_centavos: number | null
          updated_at: string
          usage_id: string | null
        }
        Insert: {
          created_at?: string
          dispensed_quantity?: number
          dosage_instruction?: string | null
          id?: string
          item_id?: string | null
          line_total_in_centavos?: number | null
          notes?: string | null
          order_id: string
          organization_id: string
          original_medication: string
          pharmacist_reason?: string | null
          requested_quantity: number
          status?: string
          unit_of_measure?: string | null
          unit_price_in_centavos?: number | null
          updated_at?: string
          usage_id?: string | null
        }
        Update: {
          created_at?: string
          dispensed_quantity?: number
          dosage_instruction?: string | null
          id?: string
          item_id?: string | null
          line_total_in_centavos?: number | null
          notes?: string | null
          order_id?: string
          organization_id?: string
          original_medication?: string
          pharmacist_reason?: string | null
          requested_quantity?: number
          status?: string
          unit_of_measure?: string | null
          unit_price_in_centavos?: number | null
          updated_at?: string
          usage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_prescription_order_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_prescription_order_lines_item_id_organization_id_fkey"
            columns: ["item_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "pharmacy_prescription_order_lines_order_id_organization_id_fkey"
            columns: ["order_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_prescription_orders"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "pharmacy_prescription_order_lines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_prescription_order_lines_usage_id_fkey"
            columns: ["usage_id"]
            isOneToOne: false
            referencedRelation: "inventory_usages"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_prescription_orders: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          encounter_id: string | null
          id: string
          invoice_id: string | null
          medication_request_id: string | null
          notes: string | null
          organization_id: string
          patient_id: string | null
          patient_reference: string | null
          physical_prescription_reference: string | null
          pos_sale_id: string | null
          prescriber_name: string | null
          priority: string
          receipt_number: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_type: string
          status: string
          submitted_at: string
          submitted_by: string
          updated_at: string
          ward_reference: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          encounter_id?: string | null
          id?: string
          invoice_id?: string | null
          medication_request_id?: string | null
          notes?: string | null
          organization_id: string
          patient_id?: string | null
          patient_reference?: string | null
          physical_prescription_reference?: string | null
          pos_sale_id?: string | null
          prescriber_name?: string | null
          priority?: string
          receipt_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_type?: string
          status?: string
          submitted_at?: string
          submitted_by: string
          updated_at?: string
          ward_reference?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          encounter_id?: string | null
          id?: string
          invoice_id?: string | null
          medication_request_id?: string | null
          notes?: string | null
          organization_id?: string
          patient_id?: string | null
          patient_reference?: string | null
          physical_prescription_reference?: string | null
          pos_sale_id?: string | null
          prescriber_name?: string | null
          priority?: string
          receipt_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_type?: string
          status?: string
          submitted_at?: string
          submitted_by?: string
          updated_at?: string
          ward_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_prescription_orders_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_prescription_orders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_prescription_orders_medication_request_id_fkey"
            columns: ["medication_request_id"]
            isOneToOne: false
            referencedRelation: "medication_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_prescription_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_prescription_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_prescription_orders_pos_sale_id_fkey"
            columns: ["pos_sale_id"]
            isOneToOne: false
            referencedRelation: "pos_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      philhealth_core_presentations: {
        Row: {
          active: boolean
          code: string
          display: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          code: string
          display: string
          sort_order: number
        }
        Update: {
          active?: boolean
          code?: string
          display?: string
          sort_order?: number
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          granted_at: string
          granted_by: string
          id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by: string
          id?: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      pmr_document_snapshots: {
        Row: {
          copy_type: string
          created_at: string
          created_by: string | null
          document_id: string
          document_payload: Json
          document_reference_id: string | null
          id: string
          is_latest_revision: boolean
          organization_id: string
          patient_id: string
          redactions_applied: Json
          revision: number
          sections_included: Json
          sha256_hash: string
          storage_path: string | null
          superseded_by: string | null
          watermark_status: string | null
        }
        Insert: {
          copy_type?: string
          created_at?: string
          created_by?: string | null
          document_id: string
          document_payload: Json
          document_reference_id?: string | null
          id?: string
          is_latest_revision?: boolean
          organization_id: string
          patient_id: string
          redactions_applied?: Json
          revision?: number
          sections_included?: Json
          sha256_hash: string
          storage_path?: string | null
          superseded_by?: string | null
          watermark_status?: string | null
        }
        Update: {
          copy_type?: string
          created_at?: string
          created_by?: string | null
          document_id?: string
          document_payload?: Json
          document_reference_id?: string | null
          id?: string
          is_latest_revision?: boolean
          organization_id?: string
          patient_id?: string
          redactions_applied?: Json
          revision?: number
          sections_included?: Json
          sha256_hash?: string
          storage_path?: string | null
          superseded_by?: string | null
          watermark_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pmr_document_snapshots_document_reference_id_fkey"
            columns: ["document_reference_id"]
            isOneToOne: false
            referencedRelation: "document_references"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pmr_document_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pmr_document_snapshots_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pmr_document_snapshots_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "pmr_document_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      pmr_release_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          consent_reference: string
          document_id: string
          id: number
          ip_address: string | null
          metadata: Json
          occurred_at: string
          organization_id: string
          patient_id: string
          purpose: string
          recipient: string
          sections_included: Json
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string
          consent_reference: string
          document_id: string
          id?: never
          ip_address?: string | null
          metadata?: Json
          occurred_at?: string
          organization_id: string
          patient_id: string
          purpose: string
          recipient: string
          sections_included?: Json
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          consent_reference?: string
          document_id?: string
          id?: never
          ip_address?: string | null
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          patient_id?: string
          purpose?: string
          recipient?: string
          sections_included?: Json
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pmr_release_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pmr_release_audit_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      pmr_share_links: {
        Row: {
          consent_reference: string
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          max_views: number
          organization_id: string
          passcode_hash: string | null
          patient_id: string
          purpose: string
          recipient_email: string | null
          recipient_name: string
          revoked: boolean
          revoked_at: string | null
          revoked_by: string | null
          sections_included: Json
          share_token: string
          snapshot_id: string
          view_count: number
        }
        Insert: {
          consent_reference: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          max_views?: number
          organization_id: string
          passcode_hash?: string | null
          patient_id: string
          purpose: string
          recipient_email?: string | null
          recipient_name: string
          revoked?: boolean
          revoked_at?: string | null
          revoked_by?: string | null
          sections_included?: Json
          share_token: string
          snapshot_id: string
          view_count?: number
        }
        Update: {
          consent_reference?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          max_views?: number
          organization_id?: string
          passcode_hash?: string | null
          patient_id?: string
          purpose?: string
          recipient_email?: string | null
          recipient_name?: string
          revoked?: boolean
          revoked_at?: string | null
          revoked_by?: string | null
          sections_included?: Json
          share_token?: string
          snapshot_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "pmr_share_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pmr_share_links_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pmr_share_links_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "pmr_document_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sales: {
        Row: {
          billing_event_id: string
          cashier_user_id: string
          completed_at: string | null
          created_at: string
          customer_name: string | null
          id: string
          organization_id: string
          patient_balance_due_in_centavos: number | null
          receipt_number: string
          standard_total_in_centavos: number | null
          status: Database["public"]["Enums"]["pos_sale_status"]
          updated_at: string
        }
        Insert: {
          billing_event_id: string
          cashier_user_id: string
          completed_at?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          organization_id: string
          patient_balance_due_in_centavos?: number | null
          receipt_number: string
          standard_total_in_centavos?: number | null
          status?: Database["public"]["Enums"]["pos_sale_status"]
          updated_at?: string
        }
        Update: {
          billing_event_id?: string
          cashier_user_id?: string
          completed_at?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          organization_id?: string
          patient_balance_due_in_centavos?: number | null
          receipt_number?: string
          standard_total_in_centavos?: number | null
          status?: Database["public"]["Enums"]["pos_sale_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_sales_billing_event_id_fkey"
            columns: ["billing_event_id"]
            isOneToOne: false
            referencedRelation: "billing_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_coverage_grants: {
        Row: {
          covered_practitioner_role_id: string
          covering_practitioner_role_id: string
          created_at: string
          created_by: string
          id: string
          organization_id: string
          reason: string
          valid_from: string
          valid_to: string
        }
        Insert: {
          covered_practitioner_role_id: string
          covering_practitioner_role_id: string
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          reason: string
          valid_from: string
          valid_to: string
        }
        Update: {
          covered_practitioner_role_id?: string
          covering_practitioner_role_id?: string
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          reason?: string
          valid_from?: string
          valid_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_coverage_grants_covered_practitioner_role_id_fkey"
            columns: ["covered_practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_coverage_grants_covering_practitioner_role_id_fkey"
            columns: ["covering_practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_coverage_grants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_payout_settings: {
        Row: {
          active: boolean
          created_at: string
          id: string
          organization_id: string
          practitioner_role_id: string
          share_basis_points: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          organization_id: string
          practitioner_role_id: string
          share_basis_points?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          organization_id?: string
          practitioner_role_id?: string
          share_basis_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_payout_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_payout_settings_practitioner_role_id_fkey"
            columns: ["practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_roles: {
        Row: {
          active: boolean
          available_time: Json
          created_at: string
          id: string
          not_available: Json
          organization_id: string
          practitioner_id: string
          queue_prefix: string | null
          role_code: string
          specialty_codes: Json
          telecom: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          available_time?: Json
          created_at?: string
          id?: string
          not_available?: Json
          organization_id: string
          practitioner_id: string
          queue_prefix?: string | null
          role_code: string
          specialty_codes?: Json
          telecom?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          available_time?: Json
          created_at?: string
          id?: string
          not_available?: Json
          organization_id?: string
          practitioner_id?: string
          queue_prefix?: string | null
          role_code?: string
          specialty_codes?: Json
          telecom?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_roles_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_service_fees: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          effective_from: string
          id: string
          organization_id: string
          practitioner_role_id: string
          service_practitioner_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          effective_from?: string
          id?: string
          organization_id: string
          practitioner_role_id: string
          service_practitioner_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          effective_from?: string
          id?: string
          organization_id?: string
          practitioner_role_id?: string
          service_practitioner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_service_fees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_service_fees_practitioner_role_id_fkey"
            columns: ["practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_service_fees_service_practitioner_id_fkey"
            columns: ["service_practitioner_id"]
            isOneToOne: false
            referencedRelation: "service_practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioners: {
        Row: {
          active: boolean
          address: Json
          auth_user_id: string | null
          created_at: string
          id: string
          identifier: Json
          name: Json
          organization_id: string
          qualification: Json
          telecom: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: Json
          auth_user_id?: string | null
          created_at?: string
          id?: string
          identifier?: Json
          name: Json
          organization_id: string
          qualification?: Json
          telecom?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: Json
          auth_user_id?: string | null
          created_at?: string
          id?: string
          identifier?: Json
          name?: Json
          organization_id?: string
          qualification?: Json
          telecom?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures: {
        Row: {
          code: string
          code_display: string
          created_at: string
          encounter_id: string | null
          id: string
          notes: string | null
          organization_id: string
          patient_id: string
          performed_by_name: string | null
          performed_date: string
        }
        Insert: {
          code: string
          code_display: string
          created_at?: string
          encounter_id?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          patient_id: string
          performed_by_name?: string | null
          performed_date?: string
        }
        Update: {
          code?: string
          code_display?: string
          created_at?: string
          encounter_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          patient_id?: string
          performed_by_name?: string | null
          performed_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedures_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_preferences: {
        Row: {
          created_at: string
          encounter_view_mode: string
          teleconsult_chart_collapsed: boolean
          teleconsult_split_ratio: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encounter_view_mode?: string
          teleconsult_chart_collapsed?: boolean
          teleconsult_split_ratio?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encounter_view_mode?: string
          teleconsult_chart_collapsed?: boolean
          teleconsult_split_ratio?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_weekly_availability: {
        Row: {
          clinic_service_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          organization_id: string
          practitioner_role_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          clinic_service_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          organization_id: string
          practitioner_role_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          clinic_service_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          organization_id?: string
          practitioner_role_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_weekly_availability_clinic_service_id_fkey"
            columns: ["clinic_service_id"]
            isOneToOne: false
            referencedRelation: "clinic_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_weekly_availability_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_weekly_availability_practitioner_role_id_fkey"
            columns: ["practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          permission: string
          role_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          permission: string
          role_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          permission?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_assignments: {
        Row: {
          created_at: string
          date: string
          id: string
          organization_id: string
          practitioner_role_id: string
          room_id: string
          shift_end: string
          shift_start: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          organization_id: string
          practitioner_role_id: string
          room_id: string
          shift_end: string
          shift_start: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          organization_id?: string
          practitioner_role_id?: string
          room_id?: string
          shift_end?: string
          shift_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_assignments_practitioner_role_id_fkey"
            columns: ["practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "clinic_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      service_practitioners: {
        Row: {
          clinic_service_id: string
          created_at: string
          duration_minutes_override: number | null
          id: string
          is_active: boolean
          organization_id: string
          practitioner_role_id: string
          updated_at: string
        }
        Insert: {
          clinic_service_id: string
          created_at?: string
          duration_minutes_override?: number | null
          id?: string
          is_active?: boolean
          organization_id: string
          practitioner_role_id: string
          updated_at?: string
        }
        Update: {
          clinic_service_id?: string
          created_at?: string
          duration_minutes_override?: number | null
          id?: string
          is_active?: boolean
          organization_id?: string
          practitioner_role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_practitioners_clinic_service_id_fkey"
            columns: ["clinic_service_id"]
            isOneToOne: false
            referencedRelation: "clinic_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_practitioners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_practitioners_practitioner_role_id_fkey"
            columns: ["practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          category: string
          code: string
          code_display: string | null
          created_at: string
          encounter_id: string | null
          id: string
          intent: string
          note: string | null
          occurrence_end: string | null
          occurrence_start: string | null
          organization_id: string
          patient_id: string
          performer_organization_id: string | null
          performer_practitioner_role_id: string | null
          priority: string | null
          reason_codes: Json
          requester_practitioner_id: string | null
          status: "PENDING" | "SUCCESS" | "ERROR"
          supporting_info: Json
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          code_display?: string | null
          created_at?: string
          encounter_id?: string | null
          id?: string
          intent?: string
          note?: string | null
          occurrence_end?: string | null
          occurrence_start?: string | null
          organization_id: string
          patient_id: string
          performer_organization_id?: string | null
          performer_practitioner_role_id?: string | null
          priority?: string | null
          reason_codes?: Json
          requester_practitioner_id?: string | null
          status?: "PENDING" | "SUCCESS" | "ERROR"
          supporting_info?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          code_display?: string | null
          created_at?: string
          encounter_id?: string | null
          id?: string
          intent?: string
          note?: string | null
          occurrence_end?: string | null
          occurrence_start?: string | null
          organization_id?: string
          patient_id?: string
          performer_organization_id?: string | null
          performer_practitioner_role_id?: string | null
          priority?: string | null
          reason_codes?: Json
          requester_practitioner_id?: string | null
          status?: "PENDING" | "SUCCESS" | "ERROR"
          supporting_info?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_performer_organization_id_fkey"
            columns: ["performer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_performer_practitioner_role_id_fkey"
            columns: ["performer_practitioner_role_id"]
            isOneToOne: false
            referencedRelation: "practitioner_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_requester_practitioner_id_fkey"
            columns: ["requester_practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_department_assignments: {
        Row: {
          created_at: string
          department_id: string
          id: string
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_department_assignments_department_id_organization_id_fkey"
            columns: ["department_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "staff_department_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      teleconsult_rooms: {
        Row: {
          appointment_id: string
          closed_at: string | null
          created_at: string
          id: string
          opened_at: string | null
          organization_id: string
          provider: Database["public"]["Enums"]["teleconsult_provider"]
          room_name: string
          status: Database["public"]["Enums"]["teleconsult_room_status"]
          updated_at: string
        }
        Insert: {
          appointment_id: string
          closed_at?: string | null
          created_at?: string
          id?: string
          opened_at?: string | null
          organization_id: string
          provider?: Database["public"]["Enums"]["teleconsult_provider"]
          room_name: string
          status?: Database["public"]["Enums"]["teleconsult_room_status"]
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          opened_at?: string | null
          organization_id?: string
          provider?: Database["public"]["Enums"]["teleconsult_provider"]
          room_name?: string
          status?: Database["public"]["Enums"]["teleconsult_room_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teleconsult_rooms_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsult_rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      waiting_room_queue: {
        Row: {
          appointment_id: string
          id: string
          organization_id: string
          practitioner_display_name: string | null
          queue_date: string
          queue_label: string
          queue_number: number
          room_label: string | null
          scheduled_at: string
          service_name: string
          stage: Database["public"]["Enums"]["waiting_queue_stage"]
          updated_at: string
        }
        Insert: {
          appointment_id: string
          id?: string
          organization_id: string
          practitioner_display_name?: string | null
          queue_date: string
          queue_label: string
          queue_number: number
          room_label?: string | null
          scheduled_at: string
          service_name: string
          stage?: Database["public"]["Enums"]["waiting_queue_stage"]
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          id?: string
          organization_id?: string
          practitioner_display_name?: string | null
          queue_date?: string
          queue_label?: string
          queue_number?: number
          room_label?: string | null
          scheduled_at?: string
          service_name?: string
          stage?: Database["public"]["Enums"]["waiting_queue_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiting_room_queue_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_room_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      disease_surveillance_rollups_safe: {
        Row: {
          age_bracket: string | null
          barangay: string | null
          case_count: number | null
          created_at: string | null
          disease_name: string | null
          doh_category: string | null
          epi_week: number | null
          epi_year: number | null
          gender: string | null
          icd10_code: string | null
          id: string | null
          is_suppressed: boolean | null
          municipality: string | null
          organization_id: string | null
          psgc_code: string | null
        }
        Relationships: []
      }
      inventory_batch_statuses: {
        Row: {
          created_at: string | null
          days_until_expiry: number | null
          department_id: string | null
          department_name: string | null
          expiry_date: string | null
          expiry_status: string | null
          id: string | null
          is_perishable: boolean | null
          item_id: string | null
          item_name: string | null
          item_sku: string | null
          legacy_unassigned_expiry: boolean | null
          lot_number: string | null
          organization_id: string | null
          quantity: number | null
          received_at: string | null
          stock_id: string | null
          unit_of_measure: string | null
          updated_at: string | null
          usable_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_department_id_organization_id_fkey"
            columns: ["department_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "inventory_batches_item_id_organization_id_fkey"
            columns: ["item_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "inventory_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_stock_id_organization_id_fkey"
            columns: ["stock_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "department_stock"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
    }
    Functions: {
      access_pmr_share_link: {
        Args: {
          p_share_token: string
          p_passcode?: string
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: {
          document_payload: Json
          sha256_hash: string
          document_id: string
          facility_name: string
          expires_at: string
          views_remaining: number
        }[]
      }
      acquire_encounter_lock: {
        Args: {
          p_encounter_id: string
        }
        Returns: {
          encounter_id: string
          practitioner_role_id: string
          organization_id: string
          acquired_at: string
          heartbeat_at: string
          expires_at: string
        }[]
      }
      add_soap_note:
        | {
            Args: {
              p_encounter_id: string
              p_text: string
              p_supersedes_id: string
              p_expected_version: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_encounter_id: string
              p_text: string
              p_supersedes_id?: string
            }
            Returns: string
          }
      add_soap_observation:
        | {
            Args: {
              p_encounter_id: string
              p_section: string
              p_text: string
              p_supersedes_id: string
              p_expected_version: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_encounter_id: string
              p_section: string
              p_text: string
              p_supersedes_id?: string
            }
            Returns: string
          }
      adjudicate_claim: {
        Args: {
          p_claim_id: string
          p_result: string
          p_approved_amount?: number
          p_denied_reason?: string
        }
        Returns: undefined
      }
      adjust_department_stock: {
        Args: {
          p_item_id: string
          p_department_id: string
          p_quantity_delta: number
          p_reason: string
          p_movement_type?: string
        }
        Returns: string
      }
      allocate_perishable_stock_fefo: {
        Args: {
          p_stock_id: string
          p_quantity: number
          p_allow_expired?: boolean
        }
        Returns: {
          allocated_batch_id: string
          allocated_lot_number: string
          allocated_expiry_date: string
          allocated_quantity: number
        }[]
      }
      apply_practitioner_philhealth_accreditation: {
        Args: {
          p_practitioner_id: string
          p_pan: string
          p_prc_license: string
        }
        Returns: undefined
      }
      archive_clinical_document_template: {
        Args: {
          p_organization_id: string
          p_template_id: string
        }
        Returns: undefined
      }
      assert_encounter_condition_writer: {
        Args: {
          p_encounter: unknown
        }
        Returns: string
      }
      assert_encounter_writer: {
        Args: {
          p_encounter: unknown
          p_role_id: string
        }
        Returns: undefined
      }
      assert_professional_fee_bounds: {
        Args: {
          p_service_id: string
          p_amount: number
        }
        Returns: undefined
      }
      assert_professional_fee_declaration_allowed: {
        Args: {
          p_organization_id: string
          p_amount: number
        }
        Returns: undefined
      }
      assign_service_practitioners: {
        Args: {
          p_organization_id: string
          p_clinic_service_id: string
          p_practitioner_role_ids: string[]
          p_duration_minutes_override?: number
        }
        Returns: {
          id: string
          organization_id: string
          clinic_service_id: string
          practitioner_role_id: string
          is_active: boolean
          duration_minutes_override: number
          created_at: string
          updated_at: string
        }[]
      }
      assign_staff_department: {
        Args: {
          p_organization_id: string
          p_user_id: string
          p_department_id: string
        }
        Returns: undefined
      }
      assign_staff_role: {
        Args: {
          p_organization_id: string
          p_user_id: string
          p_role_code: string
        }
        Returns: undefined
      }
      billed_on_finalized_event: {
        Args: {
          p_source_type: string
          p_source_id: string
        }
        Returns: string
      }
      book_appointment: {
        Args: {
          p_slot_id: string
          p_delivery_mode?: Database["public"]["Enums"]["appointment_delivery_mode"]
        }
        Returns: string
      }
      book_appointment_slot: {
        Args: {
          p_slot_id: string
          p_patient_id?: string
          p_delivery_mode?: Database["public"]["Enums"]["appointment_delivery_mode"]
        }
        Returns: string
      }
      bookable_practitioners: {
        Args: {
          p_service_id: string
        }
        Returns: {
          practitioner_role_id: string
          display_name: string
          specialty: string
          title: string
          photo_url: string
          total_price: number
          currency: string
        }[]
      }
      calculate_epi_week: {
        Args: {
          p_at: string
        }
        Returns: number
      }
      can_access_organization: {
        Args: {
          target_organization_id: string
        }
        Returns: boolean
      }
      can_manage_laboratory_services: {
        Args: {
          p_organization_id: string
        }
        Returns: boolean
      }
      can_manage_organization_accounts: {
        Args: {
          p_organization_id: string
        }
        Returns: boolean
      }
      can_view_professional_fee_line: {
        Args: {
          p_organization_id: string
          p_billing_event_id: string
          p_service_practitioner_id: string
        }
        Returns: boolean
      }
      cancel_appointment: {
        Args: {
          p_appointment_id: string
          p_block_slot?: boolean
        }
        Returns: undefined
      }
      categorize_age_bracket: {
        Args: {
          p_birth_date: string
        }
        Returns: string
      }
      check_in_appointment: {
        Args: {
          p_appointment_id: string
          p_encounter_setting?: string
          p_accommodation_type?: string
          p_referred_from_facility?: string
          p_referred_from_reason?: string
        }
        Returns: string
      }
      claim_walk_in_patient: {
        Args: {
          p_organization_id: string
          p_walk_in_id: string
          p_pin: string
        }
        Returns: string
      }
      close_teleconsult_room: {
        Args: {
          p_appointment_id: string
        }
        Returns: undefined
      }
      complete_pharmacy_prescription_order: {
        Args: {
          p_order_id: string
          p_outcomes: Json
        }
        Returns: Json
      }
      confirm_inventory_holds_for_billing_event: {
        Args: {
          p_billing_event_id: string
        }
        Returns: undefined
      }
      confirm_payment_attempt: {
        Args: {
          p_payment_id: string
        }
        Returns: string
      }
      create_appointment_slot: {
        Args: {
          p_start_at: string
          p_end_at: string
          p_clinic_service_id: string
        }
        Returns: string
      }
      create_appointment_slot_range: {
        Args: {
          p_start_at: string
          p_end_at: string
          p_clinic_service_id: string
        }
        Returns: number
      }
      create_diagnostic_service_request:
        | {
            Args: {
              p_encounter_id: string
              p_category: string
              p_code: string
              p_code_display: string
              p_priority?: string
              p_note?: string
              p_performer_practitioner_role_id?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_encounter_id: string
              p_category: string
              p_code: string
              p_code_display: string
              p_priority?: string
              p_note?: string
              p_performer_practitioner_role_id?: string
              p_laboratory_service_id?: string
            }
            Returns: string
          }
      create_nbb_pharmacy_pos_sale: {
        Args: {
          p_organization_id: string
          p_items: Json
          p_patient_name: string
        }
        Returns: Json
      }
      create_payment_attempt: {
        Args: {
          p_invoice_id: string
          p_method: Database["public"]["Enums"]["payment_method"]
          p_reference?: string
        }
        Returns: string
      }
      create_pharmacy_prescription_transcription: {
        Args: {
          p_organization_id: string
          p_patient_id: string
          p_encounter_id: string
          p_prescription_reference: string
          p_prescriber_name: string
          p_items: Json
          p_priority?: string
        }
        Returns: string
      }
      create_pmr_share_link: {
        Args: {
          p_document_id: string
          p_patient_id: string
          p_organization_id: string
          p_expires_in_hours?: number
          p_passcode?: string
          p_max_views?: number
          p_recipient_name?: string
          p_recipient_email?: string
          p_purpose?: string
          p_consent_reference?: string
          p_sections_included?: Json
        }
        Returns: {
          share_id: string
          share_token: string
          expires_at: string
          has_passcode: boolean
        }[]
      }
      create_pos_sale: {
        Args: {
          p_organization_id: string
          p_items: Json
          p_customer_name?: string
          p_payment_method?: Database["public"]["Enums"]["payment_method"]
        }
        Returns: Json
      }
      create_standalone_pharmacy_inventory_order: {
        Args: {
          p_organization_id: string
          p_patient_reference: string
          p_ward_reference: string
          p_prescription_reference: string
          p_prescriber_name: string
          p_items: Json
          p_priority?: string
        }
        Returns: string
      }
      create_walk_in_patient: {
        Args: {
          p_organization_id: string
          p_name: Json
          p_telecom?: Json
          p_birth_date?: string
          p_gender?: string
        }
        Returns: {
          patient_id: string
          walk_in_id: string
          pin: string
        }[]
      }
      current_doctor_practitioner_id: {
        Args: {
          p_organization_id: string
        }
        Returns: string
      }
      delete_clinic_role_definition: {
        Args: {
          p_organization_id: string
          p_code: string
        }
        Returns: undefined
      }
      delete_laboratory_service: {
        Args: {
          p_service_id: string
          p_organization_id: string
        }
        Returns: undefined
      }
      discharge_details_problems: {
        Args: {
          p_encounter: unknown
          p_outcome: string
          p_to_facility: string
          p_to_reason: string
        }
        Returns: string[]
      }
      disperse_inventory_requisition_item: {
        Args: {
          p_requisition_item_id: string
          p_quantity?: number
        }
        Returns: string
      }
      effective_balance_billing_policy: {
        Args: {
          p_organization_id: string
        }
        Returns: string
      }
      enroll_patient_at_clinic: {
        Args: {
          p_organization_id: string
          p_display_name: string
        }
        Returns: string
      }
      ensure_encounter_draft_bill: {
        Args: {
          p_encounter_id: string
        }
        Returns: string
      }
      expire_unpaid_appointment_reservations: {
        Args: {
          p_organization_id?: string
        }
        Returns: number
      }
      export_doh_pidsr_cases: {
        Args: {
          p_organization_id: string
          p_purpose: string
          p_epi_year: number
          p_epi_week: number
        }
        Returns: Json
      }
      finalize_billing_event: {
        Args: {
          p_billing_event_id: string
        }
        Returns: Json
      }
      finalize_billing_event_before_inventory_confirmation: {
        Args: {
          p_billing_event_id: string
        }
        Returns: Json
      }
      finalize_billing_event_without_catalog_sync: {
        Args: {
          p_billing_event_id: string
        }
        Returns: Json
      }
      finish_clinical_encounter:
        | {
            Args: {
              p_encounter_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_encounter_id: string
              p_expected_version: number
              p_discharge_outcome?: string
              p_referred_to_facility?: string
              p_referred_to_reason?: string
            }
            Returns: number
          }
      gbt_bit_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_bool_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_bool_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_bpchar_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_bytea_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_cash_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_cash_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_date_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_date_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_enum_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_enum_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_float4_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_float4_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_float8_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_float8_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_inet_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int2_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int2_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int4_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int4_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int8_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int8_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_intv_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_intv_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_intv_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_macad_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_macad_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_macad8_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_macad8_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_numeric_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_oid_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_oid_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_text_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_time_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_time_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_timetz_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_ts_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_ts_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_tstz_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_uuid_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_uuid_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_var_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_var_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey_var_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey_var_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey16_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey16_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey2_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey2_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey32_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey32_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey4_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey4_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey8_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey8_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      generate_appointment_bill: {
        Args: {
          p_appointment_id: string
        }
        Returns: Json
      }
      generate_billing_event: {
        Args: {
          p_organization_id: string
          p_encounter_id: string
          p_payor_type_override?: Database["public"]["Enums"]["payor_type"]
        }
        Returns: string
      }
      generate_invoice_number: {
        Args: {
          p_organization_id: string
        }
        Returns: string
      }
      generate_receipt_number: {
        Args: {
          p_organization_id: string
        }
        Returns: string
      }
      get_available_slots: {
        Args: {
          p_service_id: string
          p_date_range: unknown
          p_practitioner_role_id: string
        }
        Returns: {
          id: string
          practitioner_role_id: string
          clinic_service_id: string
          service_type: string
          start_at: string
          end_at: string
          display_name: string
          specialty: string
          title: string
          photo_url: string
        }[]
      }
      get_barangay_choropleth: {
        Args: {
          p_organization_id: string
          p_icd10_code: string
          p_epi_year: number
          p_epi_week: number
        }
        Returns: {
          psgc_code: string
          barangay_name: string
          municipality_name: string
          province_name: string
          region_name: string
          geometry: Json
          population: number
          case_count: number
          is_suppressed: boolean
          rate_per_10k: number
        }[]
      }
      get_billable_encounters: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          id: string
          patient_id: string
          patient_name: string
          appointment_id: string
          service_type: string
          period_start: string
          period_end: string
          status: Database["public"]["Enums"]["encounter_status"]
          service_name: string
          service_price: number
        }[]
      }
      get_billing_line_items: {
        Args: {
          p_billing_event_id: string
        }
        Returns: {
          id: string
          source_type: string
          source_id: string
          description: string
          quantity: number
          unit_price: number
          currency: string
          line_total: number
          payment_status: Database["public"]["Enums"]["billing_line_payment_status"]
          billing_mode: Database["public"]["Enums"]["billing_mode"]
          payor_type: Database["public"]["Enums"]["payor_type"]
          tagged_at: string
          void_reason: string
        }[]
      }
      get_billing_workspace: {
        Args: {
          p_organization_id: string
        }
        Returns: Json
      }
      get_claims_workspace: {
        Args: {
          p_organization_id: string
        }
        Returns: Json
      }
      get_clinical_template_asset_context: {
        Args: {
          p_organization_id: string
        }
        Returns: Json
      }
      get_current_practitioner: {
        Args: {
          p_organization_id: string
          p_roles: string[]
        }
        Returns: string
      }
      get_current_provider_role_id: {
        Args: {
          p_organization_id: string
        }
        Returns: string
      }
      get_current_staff_department: {
        Args: {
          p_organization_id: string
        }
        Returns: string
      }
      get_current_staff_organization: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_encounter_lock: {
        Args: {
          p_encounter_id: string
        }
        Returns: {
          encounter_id: string
          practitioner_role_id: string
          practitioner_name: string
          heartbeat_at: string
          expires_at: string
        }[]
      }
      get_encounter_template_context: {
        Args: {
          p_encounter_id: string
        }
        Returns: Json
      }
      get_governance_dashboard: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          active_patients: number
          appointments_today: number
          waiting_now: number
          completed_encounters_30d: number
          outstanding_invoices: number
          outstanding_balance: number
          confirmed_revenue_30d: number
          active_staff: number
          audit_events_24h: number
        }[]
      }
      get_governance_patient_record: {
        Args: {
          p_organization_id: string
          p_patient_id: string
        }
        Returns: Json
      }
      get_inventory_usage_billing_statuses: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          usage_id: string
          billing_status: string
        }[]
      }
      get_invoice_detail: {
        Args: {
          p_invoice_id: string
        }
        Returns: Json
      }
      get_my_encounter_view_mode: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_inventory_view_mode: {
        Args: {
          p_organization_id: string
        }
        Returns: string
      }
      get_my_organization_permissions: {
        Args: {
          p_organization_id: string
        }
        Returns: string[]
      }
      get_my_philhealth_accreditation: {
        Args: {
          p_organization_id: string
        }
        Returns: Json
      }
      get_my_teleconsult_workspace_preference: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_organization_billing_profile: {
        Args: {
          p_organization_id: string
        }
        Returns: Json
      }
      get_organization_facility_classification: {
        Args: {
          p_organization_id: string
        }
        Returns: Json
      }
      get_organization_fee_settings: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          organization_id: string
          fee_model: string
          is_government: boolean
          can_manage_fee_model: boolean
        }[]
      }
      get_organization_queue_settings: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          organization_id: string
          queue_mode: string
          can_manage_queue_mode: boolean
        }[]
      }
      get_patient_coverages: {
        Args: {
          p_organization_id: string
          p_patient_id: string
        }
        Returns: {
          id: string
          organization_id: string
          patient_id: string
          status: string
          coverage_type: string
          subscriber_id: string
          payor: Json
          period_start: string
          period_end: string
          class_values: Json
        }[]
      }
      get_patient_default_template: {
        Args: {
          p_organization_id: string
          p_type: string
          p_condition_code?: string
        }
        Returns: {
          id: string
          organization_id: string
          category: string
          name: string
          condition_code: string
          condition_display: string
          structured_body: Json
          version: number
        }[]
      }
      get_patient_document_template: {
        Args: {
          p_template_id: string
          p_template_version?: number
        }
        Returns: {
          id: string
          organization_id: string
          category: string
          name: string
          condition_code: string
          condition_display: string
          structured_body: Json
          version: number
        }[]
      }
      get_patient_invoices: {
        Args: {
          p_organization_id: string
        }
        Returns: Json
      }
      get_patient_philhealth_profile: {
        Args: {
          p_organization_id: string
          p_patient_id: string
        }
        Returns: Json
      }
      get_pharmacy_prescription_availability: {
        Args: {
          p_organization_id: string
          p_items: Json
        }
        Returns: Json
      }
      get_philhealth_claim_document: {
        Args: {
          p_claim_id: string
        }
        Returns: Json
      }
      get_philhealth_claim_document_base: {
        Args: {
          p_claim_id: string
        }
        Returns: Json
      }
      get_portal_access: {
        Args: {
          p_portal: string
        }
        Returns: {
          is_allowed: boolean
          is_superadmin: boolean
          organization_ids: string[]
          role_codes: string[]
        }[]
      }
      get_practitioner_philhealth_accreditation: {
        Args: {
          p_organization_id: string
          p_user_id: string
        }
        Returns: Json
      }
      get_professional_fee_at: {
        Args: {
          p_service_practitioner_id: string
          p_at?: string
        }
        Returns: number
      }
      get_professional_fee_overview: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          service_practitioner_id: string
          service_id: string
          service_name: string
          practitioner_role_id: string
          practitioner_name: string
          currency: string
          min_professional_fee: number
          max_professional_fee: number
          current_fee: number
          current_fee_effective_from: string
        }[]
      }
      get_root_supply_department: {
        Args: {
          p_organization_id: string
        }
        Returns: string
      }
      get_specialist_options: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          practitioner_role_id: string
          display_name: string
          specialty: Json
          organization_name: string
        }[]
      }
      get_visit_invoice_qr: {
        Args: {
          p_invoice_id: string
        }
        Returns: Json
      }
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      has_organization_permission: {
        Args: {
          target_organization_id: string
          target_permission: string
        }
        Returns: boolean
      }
      has_organization_role: {
        Args: {
          target_organization_id: string
          allowed_roles: string[]
        }
        Returns: boolean
      }
      heartbeat_encounter_lock: {
        Args: {
          p_encounter_id: string
        }
        Returns: string
      }
      human_name_parts: {
        Args: {
          p_name: Json
        }
        Returns: {
          family: string
          given: string
          middle: string
          suffix: string
        }[]
      }
      identify_patient_by_qr: {
        Args: {
          p_organization_id: string
          p_payload: string
        }
        Returns: {
          patient_id: string
          display_name: string
          walk_in_id: string
          birth_date: string
          gender: string
        }[]
      }
      import_governance_patients: {
        Args: {
          p_organization_id: string
          p_file_name: string
          p_rows: Json
        }
        Returns: {
          patient_id: string
          row_number: number
          display_name: string
          walk_in_id: string
          pin: string
          error: string
        }[]
      }
      inventory_manila_today: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_active_practitioner_coverage: {
        Args: {
          p_organization_id: string
          p_covered_practitioner_role_id: string
          p_on_date: string
        }
        Returns: boolean
      }
      is_active_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_any_owner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_organization_module_enabled: {
        Args: {
          p_organization_id: string
          p_module_key: string
        }
        Returns: boolean
      }
      is_patient_self: {
        Args: {
          target_patient_id: string
          target_organization_id: string
        }
        Returns: boolean
      }
      is_philhealth_visit: {
        Args: {
          p_encounter: unknown
        }
        Returns: boolean
      }
      is_service_practitioner_bookable: {
        Args: {
          p_service_practitioner_id: string
          p_at?: string
        }
        Returns: boolean
      }
      is_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_walk_in_patient: {
        Args: {
          target_patient_id: string
          target_organization_id: string
        }
        Returns: boolean
      }
      issue_billing_invoice: {
        Args: {
          p_billing_event_id: string
        }
        Returns: Json
      }
      issue_billing_invoice_without_claim: {
        Args: {
          p_billing_event_id: string
        }
        Returns: Json
      }
      issue_medical_certificate: {
        Args: {
          p_encounter_id: string
          p_title: string
          p_statement: string
          p_template_id?: string
          p_template_version?: number
        }
        Returns: string
      }
      issue_prescription: {
        Args: {
          p_encounter_id: string
          p_medication: string
          p_dosage: string
          p_note?: string
          p_template_id?: string
          p_template_version?: number
        }
        Returns: string
      }
      issue_prescription_regimen: {
        Args: {
          p_encounter_id: string
          p_medications: Json
          p_template_id?: string
          p_template_version?: number
        }
        Returns: string[]
      }
      list_clinic_calendar: {
        Args: {
          p_organization_id: string
          p_week_start: string
          p_doctor_role_id?: string
          p_clinic_service_id?: string
        }
        Returns: {
          doctor_role_id: string
          doctor_name: string
          service_name: string
          start_at: string
          end_at: string
          status: string
          queue_label: string
        }[]
      }
      list_clinic_operations_logs: {
        Args: {
          p_organization_id: string
          p_module?: string
          p_action?: string
          p_actor_id?: string
          p_start_time?: string
          p_end_time?: string
          p_search?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: number
          occurred_at: string
          actor_id: string
          actor_name: string
          actor_type: string
          module: string
          action: string
          table_name: string
          record_id: string
          description: string
          metadata: Json
        }[]
      }
      list_clinic_role_definitions: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          code: string
          name: string
          is_custom: boolean
          permissions: string[]
        }[]
      }
      list_clinic_staff: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          user_id: string
          display_name: string
          email: string
          role_code: string
          department_id: string
          active: boolean
        }[]
      }
      list_diagnostic_encounters: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          id: string
          patient_name: string
          service_type: string
          period_start: string
          status: Database["public"]["Enums"]["encounter_status"]
        }[]
      }
      list_doctor_management: {
        Args: {
          p_organization_id: string
          p_date: string
        }
        Returns: {
          practitioner_role_id: string
          doctor_name: string
          assigned_services: string[]
          room_label: string
          queue_prefix: string
          declared_fee_summary: string
        }[]
      }
      list_doctor_payouts: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          id: string
          encounter_id: string
          billing_event_id: string
          practitioner_role_id: string
          practitioner_name: string
          delivery_mode: Database["public"]["Enums"]["appointment_delivery_mode"]
          service_type: string
          encounter_finished_at: string
          gross_service_amount: number
          share_basis_points: number
          payout_amount: number
          currency: string
          status: Database["public"]["Enums"]["doctor_payout_status"]
          paid_at: string
          payment_reference: string
          created_at: string
        }[]
      }
      list_encounter_clinical_document_templates: {
        Args: {
          p_encounter_id: string
          p_type: string
        }
        Returns: {
          id: string
          organization_id: string
          owner_doctor_id: string
          category: string
          name: string
          condition_system: string
          condition_code: string
          condition_display: string
          structured_body: Json
          is_default: boolean
          status: string
          version: number
          updated_at: string
        }[]
      }
      list_encounter_conditions: {
        Args: {
          p_encounter_id: string
        }
        Returns: {
          id: string
          code: string
          code_display: string
          diagnosis_rank: number
          verification_status: string
          case_rate: number
          recorded_by_name: string
          created_at: string
        }[]
      }
      list_governance_patients: {
        Args: {
          p_organization_id: string
          p_search?: string
        }
        Returns: {
          patient_id: string
          display_name: string
          walk_in_id: string
          birth_date: string
          gender: string
          telecom: Json
          active: boolean
          encounter_count: number
          appointment_count: number
          last_activity_at: string
        }[]
      }
      list_inventory_encounters: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          id: string
          service_type: string
          period_start: string
        }[]
      }
      list_inventory_staff_names: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          user_id: string
          display_name: string
        }[]
      }
      list_laboratory_services: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          id: string
          code: string
          name: string
          lab_cost: number
          active: boolean
        }[]
      }
      list_my_professional_fee_services: {
        Args: Record<PropertyKey, never>
        Returns: {
          service_practitioner_id: string
          service_id: string
          service_name: string
          currency: string
          min_professional_fee: number
          max_professional_fee: number
          current_fee: number
          current_fee_effective_from: string
        }[]
      }
      list_nbb_pharmacy_pos_catalog: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          stock_id: string
          item_id: string
          sku: string
          name: string
          unit_of_measure: string
          available_quantity: number
          standard_unit_price_in_centavos: number
          currency: string
        }[]
      }
      list_patient_audit_trail: {
        Args: {
          p_organization_id: string
          p_patient_id?: string
          p_limit?: number
        }
        Returns: {
          id: string
          occurred_at: string
          actor_name: string
          actor_type: string
          action: string
          resource_type: string
          record_id: string
          metadata: Json
        }[]
      }
      list_pharmacy_prescription_queue: {
        Args: {
          p_organization_id: string
          p_status?: string
        }
        Returns: Json
      }
      list_practitioner_queue_prefixes: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          practitioner_role_id: string
          display_name: string
          role_code: string
          queue_prefix: string
        }[]
      }
      list_professional_fee_history: {
        Args: {
          p_service_practitioner_id: string
        }
        Returns: {
          id: string
          amount: number
          effective_from: string
          created_by: string
          created_at: string
        }[]
      }
      list_staff_departments: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          id: string
          code: string
          name: string
          active: boolean
        }[]
      }
      list_teleconsult_appointments: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          appointment_id: string
          organization_id: string
          provider: Database["public"]["Enums"]["teleconsult_provider"]
          room_name: string
          room_status: Database["public"]["Enums"]["teleconsult_room_status"]
          appointment_status: Database["public"]["Enums"]["appointment_status"]
          start_at: string
          end_at: string
          service_type: string
          patient_name: string
          practitioner_name: string
          can_join: boolean
          encounter_id: string
          encounter_status: Database["public"]["Enums"]["encounter_status"]
        }[]
      }
      log_billing_transition: {
        Args: {
          p_organization_id: string
          p_entity_type: string
          p_entity_id: string
          p_from_state: string
          p_to_state: string
          p_reason?: string
          p_actor_user_id?: string
        }
        Returns: undefined
      }
      mark_clinical_notification_read: {
        Args: {
          p_notification_id: string
        }
        Returns: undefined
      }
      mark_practitioner_absent: {
        Args: {
          p_practitioner_role_id: string
          p_date: string
          p_covering_practitioner_role_id: string
          p_reason: string
        }
        Returns: {
          moved_count: number
          not_movable_count: number
          results: Json
        }[]
      }
      patient_has_philhealth_coverage: {
        Args: {
          p_organization_id: string
          p_patient_id: string
        }
        Returns: boolean
      }
      philhealth_staff_can_edit: {
        Args: {
          p_organization_id: string
        }
        Returns: boolean
      }
      philhealth_visit_context_problems: {
        Args: {
          p_encounter: unknown
        }
        Returns: string[]
      }
      raise_encounter_version_conflict: {
        Args: {
          p_actual_version: number
        }
        Returns: undefined
      }
      read_disease_surveillance_rollups_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          organization_id: string
          epi_year: number
          epi_week: number
          icd10_code: string
          disease_name: string
          doh_category: string
          age_bracket: string
          gender: string
          municipality: string
          barangay: string
          case_count: number
          is_suppressed: boolean
          created_at: string
          psgc_code: string
        }[]
      }
      reassign_appointment: {
        Args: {
          p_appointment_id: string
          p_new_practitioner_role_id: string
          p_reason: string
        }
        Returns: string
      }
      receive_inventory_stock: {
        Args: {
          p_item_id: string
          p_department_id: string
          p_batches: Json
          p_reason: string
          p_movement_type?: string
        }
        Returns: string
      }
      record_diagnostic_report: {
        Args: {
          p_service_request_id: string
          p_conclusion: string
          p_results: Json
        }
        Returns: string
      }
      record_disease_surveillance_audit: {
        Args: {
          p_organization_id: string
          p_action: string
          p_purpose: string
          p_resource_ref?: string
          p_metadata?: Json
        }
        Returns: string
      }
      record_encounter_condition: {
        Args: {
          p_encounter_id: string
          p_icd10_code: string
          p_diagnosis_rank?: number
          p_verification_status?: string
        }
        Returns: string
      }
      record_encounter_discharge: {
        Args: {
          p_encounter_id: string
          p_discharge_outcome: string
          p_referred_to_facility?: string
          p_referred_to_reason?: string
        }
        Returns: undefined
      }
      record_encounter_region_diagnosis: {
        Args: {
          p_encounter_id: string
          p_region_code: string
          p_region_display: string
          p_anatomy_view: string
          p_diagnosis_text: string
          p_code_system?: string
          p_code?: string
        }
        Returns: Json
      }
      record_payment: {
        Args: {
          p_invoice_id: string
          p_amount: number
          p_method: Database["public"]["Enums"]["payment_method"]
          p_reference?: string
        }
        Returns: string
      }
      record_pmr_release_audit: {
        Args: {
          p_organization_id: string
          p_patient_id: string
          p_document_id: string
          p_action: string
          p_recipient: string
          p_purpose: string
          p_consent_reference: string
          p_sections_included?: Json
          p_ip_address?: string
          p_user_agent?: string
          p_metadata?: Json
        }
        Returns: number
      }
      record_standalone_pharmacy_inventory_usage: {
        Args: {
          p_order_id: string
          p_stock_id: string
          p_quantity: number
        }
        Returns: string
      }
      record_triage_vital_signs: {
        Args: {
          p_appointment_id: string
          p_systolic_bp: number
          p_diastolic_bp: number
          p_pulse_bpm: number
          p_respiratory_rate: number
          p_temperature_c: number
          p_oxygen_saturation: number
          p_weight_kg?: number
          p_height_cm?: number
          p_pain_score?: number
          p_acuity?: string
          p_chief_complaint?: string
          p_notes?: string
          p_supersedes_id?: string
          p_triage_level?: number
          p_core_presentation_code?: string
        }
        Returns: string
      }
      refresh_disease_surveillance_rollups: {
        Args: {
          p_organization_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: undefined
      }
      refresh_doctor_payout: {
        Args: {
          p_encounter_id: string
        }
        Returns: undefined
      }
      refresh_philhealth_claim_for_encounter: {
        Args: {
          p_encounter_id: string
        }
        Returns: string
      }
      release_encounter_lock: {
        Args: {
          p_encounter_id: string
        }
        Returns: undefined
      }
      remove_encounter_condition: {
        Args: {
          p_condition_id: string
        }
        Returns: undefined
      }
      reset_clinic_role_permissions: {
        Args: {
          p_organization_id: string
          p_code: string
        }
        Returns: undefined
      }
      resolve_billing_mode: {
        Args: {
          p_organization_id: string
          p_patient_id: string
          p_clinic_service_id?: string
          p_encounter_id?: string
        }
        Returns: {
          billing_mode: Database["public"]["Enums"]["billing_mode"]
          payor_type: Database["public"]["Enums"]["payor_type"]
          coverage_id: string
          resolution_source: string
        }[]
      }
      resolve_invoice_qr: {
        Args: {
          p_qr_payload: string
        }
        Returns: Json
      }
      resolve_patient_teleconsult_clinic: {
        Args: {
          p_appointment_id: string
        }
        Returns: string
      }
      resolve_philhealth_membership: {
        Args: {
          p_organization_id: string
          p_patient_id: string
        }
        Returns: {
          coverage_id: string
          is_member: boolean
          is_nbb_category: boolean
        }[]
      }
      retire_provider_clinic_service: {
        Args: {
          p_service_id: string
        }
        Returns: undefined
      }
      review_pharmacy_prescription_order: {
        Args: {
          p_order_id: string
          p_updates: Json
          p_reason?: string
        }
        Returns: undefined
      }
      save_admin_clinic_service: {
        Args: {
          p_organization_id: string
          p_service_id: string
          p_name: string
          p_description: string
          p_duration_minutes: number
          p_base_price: number
          p_currency: string
          p_booking_enabled: boolean
          p_active: boolean
          p_delivery_modes: Database["public"]["Enums"]["appointment_delivery_mode"][]
        }
        Returns: string
      }
      save_clinic_role_definition: {
        Args: {
          p_organization_id: string
          p_code: string
          p_name: string
          p_permissions: string[]
        }
        Returns: undefined
      }
      save_clinical_document_template: {
        Args: {
          p_organization_id: string
          p_template_id: string
          p_type: string
          p_title: string
          p_scope: string
          p_condition_system: string
          p_condition_code: string
          p_condition_display: string
          p_structured_body: Json
          p_is_default: boolean
          p_status: string
        }
        Returns: string
      }
      save_company_coverage: {
        Args: {
          p_organization_id: string
          p_coverage_id: string
          p_patient_id: string
          p_coverage_type: string
          p_subscriber_id: string
          p_payor_name: string
          p_period_start: string
          p_period_end: string
          p_status: string
        }
        Returns: string
      }
      save_document_template: {
        Args: {
          p_organization_id: string
          p_template_id: string
          p_name: string
          p_category: string
          p_description: string
          p_body: string
          p_active: boolean
        }
        Returns: string
      }
      save_inventory_expiry_settings: {
        Args: {
          p_organization_id: string
          p_near_expiry_days?: number
          p_pharmacy_department_id?: string
        }
        Returns: undefined
      }
      save_laboratory_service: {
        Args: {
          p_service_id: string
          p_organization_id: string
          p_name: string
          p_lab_cost: number
          p_active?: boolean
        }
        Returns: string
      }
      save_my_encounter_view_mode: {
        Args: {
          p_mode: string
        }
        Returns: undefined
      }
      save_my_inventory_view_mode: {
        Args: {
          p_organization_id: string
          p_mode: string
        }
        Returns: undefined
      }
      save_my_teleconsult_workspace_preference: {
        Args: {
          p_split_ratio: number
          p_chart_collapsed: boolean
        }
        Returns: undefined
      }
      save_organization_branding:
        | {
            Args: {
              p_organization_id: string
              p_display_name: string
              p_tagline: string
              p_logo_url: string
              p_primary_color: string
              p_accent_color: string
              p_support_email: string
              p_support_phone: string
            }
            Returns: string
          }
        | {
            Args: {
              p_organization_id: string
              p_display_name: string
              p_tagline?: string
              p_logo_url?: string
              p_primary_color?: string
              p_accent_color?: string
              p_support_email?: string
              p_support_phone?: string
              p_clinic_visit_message?: string
              p_teleconsult_message?: string
              p_booking_confirmation_message?: string
            }
            Returns: string
          }
      save_patient_philhealth_coverage: {
        Args: {
          p_organization_id: string
          p_patient_id: string
          p_philhealth_id: string
          p_category: string
          p_beneficiary_relationship?: string
          p_eligibility_reference?: string
          p_member_pin?: string
          p_member_family_name?: string
          p_member_given_name?: string
          p_member_middle_name?: string
          p_member_suffix?: string
          p_member_birth_date?: string
          p_member_sex?: string
        }
        Returns: string
      }
      save_patient_philhealth_identity: {
        Args: {
          p_organization_id: string
          p_patient_id: string
          p_family_name: string
          p_given_name: string
          p_middle_name: string
          p_suffix: string
          p_sex: string
          p_birth_date: string
          p_street: string
          p_barangay: string
          p_city: string
          p_province: string
          p_postal_code?: string
        }
        Returns: undefined
      }
      save_provider_clinic_service: {
        Args: {
          p_service_id: string
          p_organization_id: string
          p_code: string
          p_name: string
          p_description: string
          p_duration_minutes: number
          p_base_price: number
          p_booking_enabled: boolean
        }
        Returns: string
      }
      save_provider_clinic_service_with_delivery: {
        Args: {
          p_service_id: string
          p_organization_id: string
          p_code: string
          p_name: string
          p_description: string
          p_duration_minutes: number
          p_base_price: number
          p_booking_enabled: boolean
          p_delivery_modes: Database["public"]["Enums"]["appointment_delivery_mode"][]
        }
        Returns: string
      }
      save_provider_weekly_availability: {
        Args: {
          p_clinic_service_id: string
          p_windows: Json
        }
        Returns: number
      }
      save_staff_department: {
        Args: {
          p_organization_id: string
          p_department_id: string
          p_name: string
          p_description: string
          p_active: boolean
        }
        Returns: string
      }
      search_icd10_reference: {
        Args: {
          p_query: string
        }
        Returns: {
          code: string
          description: string
          category: string
        }[]
      }
      set_appointment_slot_unavailable: {
        Args: {
          p_slot_id: string
          p_unavailable: boolean
        }
        Returns: undefined
      }
      set_clinic_service_professional_fee_bounds: {
        Args: {
          p_service_id: string
          p_min_professional_fee?: number
          p_max_professional_fee?: number
        }
        Returns: string
      }
      set_clinic_user_active: {
        Args: {
          p_organization_id: string
          p_user_id: string
          p_active: boolean
        }
        Returns: undefined
      }
      set_governance_patient_active: {
        Args: {
          p_organization_id: string
          p_patient_id: string
          p_active: boolean
        }
        Returns: undefined
      }
      set_inventory_item_perishable: {
        Args: {
          p_item_id: string
          p_is_perishable: boolean
        }
        Returns: undefined
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      set_my_philhealth_accreditation: {
        Args: {
          p_organization_id: string
          p_pan: string
          p_prc_license?: string
        }
        Returns: Json
      }
      set_my_professional_fee: {
        Args: {
          p_service_id: string
          p_amount: number
          p_effective_from?: string
        }
        Returns: string
      }
      set_organization_billing_profile: {
        Args: {
          p_organization_id: string
          p_facility_type: string
          p_ownership: string
          p_balance_billing_policy: string
          p_hci_accreditation_number?: string
        }
        Returns: Json
      }
      set_organization_facility_classification: {
        Args: {
          p_organization_id: string
          p_payor_type: Database["public"]["Enums"]["payor_type"]
        }
        Returns: Json
      }
      set_organization_fee_model: {
        Args: {
          p_organization_id: string
          p_fee_model: string
        }
        Returns: string
      }
      set_organization_module: {
        Args: {
          p_organization_id: string
          p_module_key: string
          p_enabled: boolean
        }
        Returns: undefined
      }
      set_organization_queue_mode: {
        Args: {
          p_organization_id: string
          p_queue_mode: string
        }
        Returns: string
      }
      set_patient_clinic_context: {
        Args: {
          p_organization_id: string
        }
        Returns: undefined
      }
      set_practitioner_payout_rate: {
        Args: {
          p_practitioner_role_id: string
          p_share_basis_points: number
        }
        Returns: undefined
      }
      set_practitioner_philhealth_accreditation: {
        Args: {
          p_organization_id: string
          p_user_id: string
          p_pan: string
          p_prc_license?: string
        }
        Returns: undefined
      }
      set_practitioner_queue_prefix: {
        Args: {
          p_practitioner_role_id: string
          p_queue_prefix?: string
        }
        Returns: string
      }
      set_professional_fee_for_practitioner: {
        Args: {
          p_service_practitioner_id: string
          p_amount: number
          p_effective_from?: string
        }
        Returns: string
      }
      set_root_supply_department: {
        Args: {
          p_organization_id: string
          p_department_id: string
        }
        Returns: undefined
      }
      settle_doctor_payouts: {
        Args: {
          p_organization_id: string
          p_payout_ids: string[]
          p_payment_reference: string
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          "": string
        }
        Returns: string[]
      }
      start_appointment_encounter: {
        Args: {
          p_appointment_id: string
        }
        Returns: string
      }
      submit_claim: {
        Args: {
          p_claim_id: string
        }
        Returns: undefined
      }
      submit_inventory_requisition: {
        Args: {
          p_organization_id: string
          p_requesting_department_id: string
          p_items: Json
          p_notes?: string
          p_is_emergency?: boolean
          p_emergency_justification?: string
          p_simulated_date?: string
          p_supply_department_id?: string
        }
        Returns: string
      }
      sync_inventory_hold_to_billing: {
        Args: {
          p_hold_id: string
        }
        Returns: string
      }
      sync_inventory_usage_to_billing: {
        Args: {
          p_usage_id: string
        }
        Returns: string
      }
      sync_laboratory_request_to_billing: {
        Args: {
          p_service_request_id: string
        }
        Returns: string
      }
      system_generated_code: {
        Args: {
          p_prefix: string
        }
        Returns: string
      }
      tag_inventory_usage:
        | {
            Args: {
              p_encounter_id: string
              p_stock_id: string
              p_quantity: number
            }
            Returns: string
          }
        | {
            Args: {
              p_encounter_id: string
              p_stock_id: string
              p_quantity: number
              p_department_id: string
            }
            Returns: string
          }
      transfer_department_stock: {
        Args: {
          p_item_id: string
          p_from_department_id: string
          p_to_department_id: string
          p_quantity: number
          p_reason: string
        }
        Returns: string
      }
      unassign_service_practitioners: {
        Args: {
          p_organization_id: string
          p_clinic_service_id: string
          p_practitioner_role_ids: string[]
        }
        Returns: number
      }
      update_appointment_status: {
        Args: {
          p_appointment_id: string
          p_status: Database["public"]["Enums"]["appointment_status"]
        }
        Returns: undefined
      }
      update_own_patient_profile: {
        Args: {
          p_patient_id: string
          p_display_name: string
          p_birth_date?: string
          p_gender?: string
          p_phone?: string
          p_address?: string
          p_blood_type?: string
          p_photo_url?: string
          p_email?: string
          p_emergency_contact_name?: string
          p_emergency_contact_phone?: string
          p_emergency_contact_relationship?: string
        }
        Returns: undefined
      }
      update_referral_status: {
        Args: {
          p_service_request_id: string
          p_status: "PENDING" | "SUCCESS" | "ERROR"
        }
        Returns: undefined
      }
      verify_pmr_document: {
        Args: {
          p_document_id: string
        }
        Returns: {
          valid: boolean
          status: string
          document_id: string
          facility_name: string
          issued_at: string
          sha256_hash: string
          copy_type: string
          revision: number
          watermark: string
          message: string
        }[]
      }
      verify_walk_in_patient: {
        Args: {
          p_organization_id: string
          p_walk_in_id: string
          p_pin: string
        }
        Returns: string
      }
      void_billing_line_item: {
        Args: {
          p_line_item_id: string
          p_reason: string
        }
        Returns: undefined
      }
    }
    Enums: {
      appointment_delivery_mode: "in_person" | "virtual"
      appointment_status:
        | "proposed"
        | "pending"
        | "booked"
        | "arrived"
        | "fulfilled"
        | "cancelled"
        | "noshow"
      billing_event_status: "draft" | "finalized" | "cancelled"
      billing_line_payment_status: "unpaid" | "paid" | "written_off" | "voided"
      billing_mode: "standard" | "nbb"
      claim_lifecycle_state:
        | "draft"
        | "clean_validated"
        | "batched"
        | "submitted"
        | "acknowledged"
        | "returned"
        | "adjudicated"
        | "settled"
        | "disputed"
      claim_status: "active" | "cancelled" | "draft" | "entered_in_error"
      diagnostic_report_status:
        | "registered"
        | "partial"
        | "preliminary"
        | "final"
        | "amended"
        | "corrected"
        | "appended"
        | "cancelled"
        | "entered_in_error"
        | "unknown"
      doctor_payout_status: "pending" | "paid" | "void"
      document_reference_status: "current" | "superseded" | "entered_in_error"
      encounter_status:
        | "planned"
        | "arrived"
        | "in_progress"
        | "onleave"
        | "finished"
        | "cancelled"
        | "entered_in_error"
        | "unknown"
      inventory_financial_state: "tagged" | "paid" | "written_off" | "voided"
      invoice_status:
        | "draft"
        | "issued"
        | "paid"
        | "partially_paid"
        | "void"
        | "cancelled"
      observation_status:
        | "registered"
        | "preliminary"
        | "final"
        | "amended"
        | "corrected"
        | "cancelled"
        | "entered_in_error"
        | "unknown"
      payment_method: "cash" | "card" | "qr_ewallet" | "bank_transfer" | "check"
      payment_status: "pending" | "confirmed" | "failed" | "refunded"
      payor_type:
        | "self_pay"
        | "hmo"
        | "philhealth_nbb"
        | "government_subsidized"
      pos_sale_status: "open" | "completed" | "void"
      request_status:
        | "draft"
        | "active"
        | "on_hold"
        | "revoked"
        | "completed"
        | "entered_in_error"
        | "unknown"
      slot_status:
        | "busy"
        | "free"
        | "busy_unavailable"
        | "busy_tentative"
        | "entered_in_error"
      teleconsult_provider: "jitsi" | "daily" | "twilio" | "custom_webrtc"
      teleconsult_room_status: "scheduled" | "open" | "closed" | "cancelled"
      waiting_queue_stage:
        | "scheduled"
        | "waiting"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "noshow"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

