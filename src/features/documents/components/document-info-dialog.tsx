"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBytes, formatDateTime } from "@/utils/format";

import type { DocumentRow } from "../types";
import { DocumentStatusBadge } from "./document-status-badge";

interface DocumentInfoDialogProps {
  document: DocumentRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentInfoDialog({
  document,
  open,
  onOpenChange,
}: DocumentInfoDialogProps) {
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Nombre original", value: document.original_filename },
    { label: "Tamaño", value: formatBytes(document.size_bytes) },
    { label: "Tipo", value: document.mime_type },
    { label: "Páginas", value: document.page_count ?? "—" },
    {
      label: "Estado",
      value: <DocumentStatusBadge status={document.status} />,
    },
    { label: "Subido", value: formatDateTime(document.created_at) },
    {
      label: "Procesado",
      value: document.processed_at
        ? formatDateTime(document.processed_at)
        : "—",
    },
    ...(document.error_message
      ? [{ label: "Error", value: document.error_message }]
      : []),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="truncate">{document.filename}</DialogTitle>
          <DialogDescription>Información del documento</DialogDescription>
        </DialogHeader>
        <dl className="divide-y">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 py-2.5"
            >
              <dt className="text-small text-muted-foreground">{row.label}</dt>
              <dd className="min-w-0 truncate text-small font-medium">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
