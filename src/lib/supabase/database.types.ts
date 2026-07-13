export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          created_at: string;
          document_id: string | null;
          id: string;
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          document_id?: string | null;
          id?: string;
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          document_id?: string | null;
          id?: string;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_conversations_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          metadata: Json;
          role: Database["public"]["Enums"]["chat_role"];
          user_id: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          role: Database["public"]["Enums"]["chat_role"];
          user_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          role?: Database["public"]["Enums"]["chat_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_user_id_fkey";
            columns: ["conversation_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "chat_conversations";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      credit_transactions: {
        Row: {
          amount: number;
          created_at: string;
          description: string | null;
          id: string;
          kind: Database["public"]["Enums"]["credit_transaction_kind"];
          metadata: Json;
          stripe_reference: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          kind: Database["public"]["Enums"]["credit_transaction_kind"];
          metadata?: Json;
          stripe_reference?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["credit_transaction_kind"];
          metadata?: Json;
          stripe_reference?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      credits: {
        Row: {
          balance: number;
          created_at: string;
          stripe_customer_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          balance?: number;
          created_at?: string;
          stripe_customer_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          balance?: number;
          created_at?: string;
          stripe_customer_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      document_chunks: {
        Row: {
          chunk_index: number;
          content: string;
          created_at: string;
          document_id: string;
          embedding: string | null;
          id: string;
          page_number: number | null;
          token_count: number | null;
          user_id: string;
        };
        Insert: {
          chunk_index: number;
          content: string;
          created_at?: string;
          document_id: string;
          embedding?: string | null;
          id?: string;
          page_number?: number | null;
          token_count?: number | null;
          user_id: string;
        };
        Update: {
          chunk_index?: number;
          content?: string;
          created_at?: string;
          document_id?: string;
          embedding?: string | null;
          id?: string;
          page_number?: number | null;
          token_count?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_user_id_fkey";
            columns: ["document_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      documents: {
        Row: {
          created_at: string;
          error_message: string | null;
          filename: string;
          id: string;
          mime_type: string;
          original_filename: string;
          page_count: number | null;
          processed_at: string | null;
          size_bytes: number;
          status: Database["public"]["Enums"]["document_status"];
          storage_path: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          filename: string;
          id?: string;
          mime_type?: string;
          original_filename: string;
          page_count?: number | null;
          processed_at?: string | null;
          size_bytes: number;
          status?: Database["public"]["Enums"]["document_status"];
          storage_path: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          filename?: string;
          id?: string;
          mime_type?: string;
          original_filename?: string;
          page_count?: number | null;
          processed_at?: string | null;
          size_bytes?: number;
          status?: Database["public"]["Enums"]["document_status"];
          storage_path?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      flashcard_deck_context_chunks: {
        Row: {
          chunk_id: string;
          created_at: string;
          deck_id: string;
          user_id: string;
        };
        Insert: {
          chunk_id: string;
          created_at?: string;
          deck_id: string;
          user_id: string;
        };
        Update: {
          chunk_id?: string;
          created_at?: string;
          deck_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flashcard_deck_context_chunks_chunk_id_user_id_fkey";
            columns: ["chunk_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "document_chunks";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "flashcard_deck_context_chunks_deck_id_user_id_fkey";
            columns: ["deck_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "flashcard_decks";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      flashcard_decks: {
        Row: {
          card_count: number;
          created_at: string;
          difficulty: Database["public"]["Enums"]["question_difficulty"] | null;
          document_id: string | null;
          id: string;
          title: string;
          topic: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          card_count: number;
          created_at?: string;
          difficulty?:
            Database["public"]["Enums"]["question_difficulty"] | null;
          document_id?: string | null;
          id?: string;
          title: string;
          topic?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          card_count?: number;
          created_at?: string;
          difficulty?:
            Database["public"]["Enums"]["question_difficulty"] | null;
          document_id?: string | null;
          id?: string;
          title?: string;
          topic?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flashcard_decks_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flashcard_decks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      flashcard_reviews: {
        Row: {
          flashcard_id: string;
          id: number;
          rating: Database["public"]["Enums"]["flashcard_rating"];
          reviewed_at: string;
          user_id: string;
        };
        Insert: {
          flashcard_id: string;
          id?: never;
          rating: Database["public"]["Enums"]["flashcard_rating"];
          reviewed_at?: string;
          user_id: string;
        };
        Update: {
          flashcard_id?: string;
          id?: never;
          rating?: Database["public"]["Enums"]["flashcard_rating"];
          reviewed_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_user_id_fkey";
            columns: ["flashcard_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "flashcards";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      flashcards: {
        Row: {
          back: string;
          created_at: string;
          deck_id: string | null;
          difficulty: Database["public"]["Enums"]["question_difficulty"];
          document_id: string | null;
          due_at: string;
          ease_factor: number;
          front: string;
          hint: string | null;
          id: string;
          interval_days: number;
          last_reviewed_at: string | null;
          order_index: number | null;
          repetitions: number;
          source_page: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          back: string;
          created_at?: string;
          deck_id?: string | null;
          difficulty?: Database["public"]["Enums"]["question_difficulty"];
          document_id?: string | null;
          due_at?: string;
          ease_factor?: number;
          front: string;
          hint?: string | null;
          id?: string;
          interval_days?: number;
          last_reviewed_at?: string | null;
          order_index?: number | null;
          repetitions?: number;
          source_page?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          back?: string;
          created_at?: string;
          deck_id?: string | null;
          difficulty?: Database["public"]["Enums"]["question_difficulty"];
          document_id?: string | null;
          due_at?: string;
          ease_factor?: number;
          front?: string;
          hint?: string | null;
          id?: string;
          interval_days?: number;
          last_reviewed_at?: string | null;
          order_index?: number | null;
          repetitions?: number;
          source_page?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_user_id_fkey";
            columns: ["deck_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "flashcard_decks";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "flashcards_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flashcards_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          correct_option: number;
          created_at: string;
          difficulty: Database["public"]["Enums"]["question_difficulty"];
          explanation: string | null;
          id: string;
          options: Json;
          order_index: number;
          statement: string;
          test_id: string;
          user_id: string;
        };
        Insert: {
          correct_option: number;
          created_at?: string;
          difficulty?: Database["public"]["Enums"]["question_difficulty"];
          explanation?: string | null;
          id?: string;
          options: Json;
          order_index: number;
          statement: string;
          test_id: string;
          user_id: string;
        };
        Update: {
          correct_option?: number;
          created_at?: string;
          difficulty?: Database["public"]["Enums"]["question_difficulty"];
          explanation?: string | null;
          id?: string;
          options?: Json;
          order_index?: number;
          statement?: string;
          test_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_test_id_user_id_fkey";
            columns: ["test_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "tests";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      study_plans: {
        Row: {
          created_at: string;
          description: string | null;
          exam_date: string | null;
          id: string;
          is_active: boolean;
          schedule: Json;
          title: string;
          updated_at: string;
          user_id: string;
          weekly_hours: number | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          exam_date?: string | null;
          id?: string;
          is_active?: boolean;
          schedule?: Json;
          title: string;
          updated_at?: string;
          user_id: string;
          weekly_hours?: number | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          exam_date?: string | null;
          id?: string;
          is_active?: boolean;
          schedule?: Json;
          title?: string;
          updated_at?: string;
          user_id?: string;
          weekly_hours?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "study_plans_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      test_attempt_answers: {
        Row: {
          answered_at: string;
          attempt_id: string;
          id: string;
          is_correct: boolean | null;
          question_id: string;
          selected_option: number | null;
          user_id: string;
        };
        Insert: {
          answered_at?: string;
          attempt_id: string;
          id?: string;
          is_correct?: boolean | null;
          question_id: string;
          selected_option?: number | null;
          user_id: string;
        };
        Update: {
          answered_at?: string;
          attempt_id?: string;
          id?: string;
          is_correct?: boolean | null;
          question_id?: string;
          selected_option?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "test_attempt_answers_attempt_id_user_id_fkey";
            columns: ["attempt_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "test_attempts";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "test_attempt_answers_question_id_user_id_fkey";
            columns: ["question_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      test_attempts: {
        Row: {
          completed_at: string | null;
          correct_count: number | null;
          id: string;
          question_count: number | null;
          score: number | null;
          started_at: string;
          test_id: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          correct_count?: number | null;
          id?: string;
          question_count?: number | null;
          score?: number | null;
          started_at?: string;
          test_id: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          correct_count?: number | null;
          id?: string;
          question_count?: number | null;
          score?: number | null;
          started_at?: string;
          test_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "test_attempts_test_id_user_id_fkey";
            columns: ["test_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "tests";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      test_context_chunks: {
        Row: {
          chunk_id: string;
          created_at: string;
          test_id: string;
          user_id: string;
        };
        Insert: {
          chunk_id: string;
          created_at?: string;
          test_id: string;
          user_id: string;
        };
        Update: {
          chunk_id?: string;
          created_at?: string;
          test_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "test_context_chunks_chunk_id_user_id_fkey";
            columns: ["chunk_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "document_chunks";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "test_context_chunks_test_id_user_id_fkey";
            columns: ["test_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "tests";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      tests: {
        Row: {
          created_at: string;
          difficulty: Database["public"]["Enums"]["question_difficulty"] | null;
          document_id: string | null;
          error_message: string | null;
          id: string;
          question_count: number;
          status: Database["public"]["Enums"]["test_status"];
          title: string;
          topic: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          difficulty?:
            Database["public"]["Enums"]["question_difficulty"] | null;
          document_id?: string | null;
          error_message?: string | null;
          id?: string;
          question_count?: number;
          status?: Database["public"]["Enums"]["test_status"];
          title: string;
          topic?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          difficulty?:
            Database["public"]["Enums"]["question_difficulty"] | null;
          document_id?: string | null;
          error_message?: string | null;
          id?: string;
          question_count?: number;
          status?: Database["public"]["Enums"]["test_status"];
          title?: string;
          topic?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tests_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      usage_logs: {
        Row: {
          action: Database["public"]["Enums"]["ai_action"];
          created_at: string;
          credits_spent: number;
          id: number;
          input_tokens: number | null;
          metadata: Json;
          model: string | null;
          output_tokens: number | null;
          user_id: string;
        };
        Insert: {
          action: Database["public"]["Enums"]["ai_action"];
          created_at?: string;
          credits_spent?: number;
          id?: never;
          input_tokens?: number | null;
          metadata?: Json;
          model?: string | null;
          output_tokens?: number | null;
          user_id: string;
        };
        Update: {
          action?: Database["public"]["Enums"]["ai_action"];
          created_at?: string;
          credits_spent?: number;
          id?: never;
          input_tokens?: number | null;
          metadata?: Json;
          model?: string | null;
          output_tokens?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "usage_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_document_chunks: {
        Args: {
          filter_document_id?: string;
          match_count?: number;
          query_embedding: string;
        };
        Returns: {
          chunk_id: string;
          content: string;
          document_filename: string;
          document_id: string;
          page_number: number;
          similarity: number;
        }[];
      };
      spend_credits: {
        Args: { p_amount: number; p_description?: string };
        Returns: number;
      };
    };
    Enums: {
      ai_action:
        | "document_processing"
        | "embedding_generation"
        | "test_generation"
        | "flashcard_generation"
        | "chat_message"
        | "study_plan_generation";
      chat_role: "user" | "assistant";
      credit_transaction_kind:
        | "welcome"
        | "purchase"
        | "subscription"
        | "consumption"
        | "refund"
        | "adjustment";
      document_status:
        | "uploading"
        | "processing"
        | "ready"
        | "failed"
        | "processed"
        | "embedded";
      flashcard_rating: "again" | "hard" | "good" | "easy";
      question_difficulty: "easy" | "medium" | "hard";
      test_status: "generating" | "ready" | "failed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ai_action: [
        "document_processing",
        "embedding_generation",
        "test_generation",
        "flashcard_generation",
        "chat_message",
        "study_plan_generation",
      ],
      chat_role: ["user", "assistant"],
      credit_transaction_kind: [
        "welcome",
        "purchase",
        "subscription",
        "consumption",
        "refund",
        "adjustment",
      ],
      document_status: [
        "uploading",
        "processing",
        "ready",
        "failed",
        "processed",
        "embedded",
      ],
      flashcard_rating: ["again", "hard", "good", "easy"],
      question_difficulty: ["easy", "medium", "hard"],
      test_status: ["generating", "ready", "failed"],
    },
  },
} as const;
