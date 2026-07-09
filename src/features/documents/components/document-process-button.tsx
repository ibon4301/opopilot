"use client";

import { useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { processDocumentAction } from "@/server/actions/documents";

import type { DocumentRow } from "../types";

/** Estados desde los que se puede lanzar (o relanzar) el procesamiento. */
const PROCESSABLE_STATUSES: DocumentRow["status"][] = ["ready", "failed"];

export function DocumentProcessButton({ document }: { document: DocumentRow }) {
  const [isProcessing, startProcessing] = useTransition();

  if (!PROCESSABLE_STATUSES.includes(document.status)) {
    return null;
  }

  function handleProcess() {
    startProcessing(async () => {
      const result = await processDocumentAction(document.id);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        `Documento procesado: ${result.data.chunkCount} fragmentos de ${result.data.pageCount} páginas.`,
      );
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isProcessing}
      onClick={handleProcess}
    >
      {isProcessing ? (
        <Loader2 className="animate-spin" aria-hidden />
      ) : (
        <Sparkles aria-hidden />
      )}
      {isProcessing
        ? "Procesando…"
        : document.status === "failed"
          ? "Reintentar"
          : "Procesar"}
    </Button>
  );
}
