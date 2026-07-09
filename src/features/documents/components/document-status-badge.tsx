import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { DocumentStatus } from "../types";

const STATUS_CONFIG: Record<
  DocumentStatus,
  {
    label: string;
    variant: React.ComponentProps<typeof Badge>["variant"];
    spinning?: boolean;
  }
> = {
  uploading: { label: "Subiendo", variant: "secondary", spinning: true },
  ready: { label: "Listo", variant: "default" },
  processing: { label: "Procesando", variant: "secondary", spinning: true },
  processed: { label: "Procesado", variant: "outline" },
  failed: { label: "Error", variant: "destructive" },
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant}>
      {config.spinning && <Loader2 className="animate-spin" aria-hidden />}
      {config.label}
    </Badge>
  );
}
