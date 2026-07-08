import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata: Metadata = {
  title: "Chat",
};

export default function ChatPage() {
  return (
    <PagePlaceholder
      icon={MessageSquare}
      title="Chat"
      description="Pregunta cualquier duda sobre tu temario."
      hint="Un tutor de IA que responde con citas exactas de tus propios documentos."
    />
  );
}
