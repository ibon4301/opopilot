"use client";

import { useTransition } from "react";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { generateEmbeddingsAction } from "@/server/actions/embeddings";

import type { DocumentRow } from "../types";

/** Visible solo para documentos procesados pendientes de indexar. */
export function DocumentEmbedButton({ document }: { document: DocumentRow }) {
  const [isEmbedding, startEmbedding] = useTransition();

  if (document.status !== "processed") {
    return null;
  }

  function handleEmbed() {
    startEmbedding(async () => {
      const result = await generateEmbeddingsAction(document.id);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        `Documento indexado: ${result.data.embeddedCount} embeddings generados.`,
      );
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isEmbedding}
      onClick={handleEmbed}
    >
      {isEmbedding ? (
        <Loader2 className="animate-spin" aria-hidden />
      ) : (
        <Zap aria-hidden />
      )}
      {isEmbedding ? "Indexando…" : "Generar embeddings"}
    </Button>
  );
}
