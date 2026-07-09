"use client";

import { useState, useTransition } from "react";
import { Info, Loader2, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteDocumentAction } from "@/server/actions/documents";
import { regenerateEmbeddingsAction } from "@/server/actions/embeddings";

import type { DocumentRow } from "../types";
import { DocumentInfoDialog } from "./document-info-dialog";

export function DocumentRowActions({ document }: { document: DocumentRow }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [isRegenerating, startRegenerate] = useTransition();

  function handleRegenerateEmbeddings() {
    startRegenerate(async () => {
      const result = await regenerateEmbeddingsAction(document.id);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        `Embeddings regenerados: ${result.data.embeddedCount} fragmentos.`,
      );
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteDocumentAction(document.id);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setConfirmOpen(false);
      toast.success("Documento eliminado");
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Acciones de ${document.filename}`}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setInfoOpen(true)}>
            <Info aria-hidden />
            Ver información
          </DropdownMenuItem>
          {document.status === "embedded" && (
            <DropdownMenuItem
              disabled={isRegenerating}
              onSelect={handleRegenerateEmbeddings}
            >
              {isRegenerating ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <RefreshCw aria-hidden />
              )}
              Regenerar embeddings
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmOpen(true)}
          >
            <Trash2 aria-hidden />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DocumentInfoDialog
        document={document}
        open={infoOpen}
        onOpenChange={setInfoOpen}
      />

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => !isDeleting && setConfirmOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar documento?</DialogTitle>
            <DialogDescription>
              Se eliminará «{document.filename}» y su archivo de forma
              permanente. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting && <Loader2 className="animate-spin" aria-hidden />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
