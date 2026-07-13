"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { GraduationCap, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FLASHCARD_DIFFICULTY_LABELS } from "@/constants/flashcards";
import { flashcardDeckRoute } from "@/constants/routes";
import {
  deleteFlashcardDeckAction,
  type FlashcardDeckListItem,
} from "@/server/actions/flashcards";
import { formatDate } from "@/utils/format";

export function DecksTable({ decks }: { decks: FlashcardDeckListItem[] }) {
  const [deckToDelete, setDeckToDelete] =
    useState<FlashcardDeckListItem | null>(null);
  const [isDeleting, startDeleting] = useTransition();

  function handleDelete() {
    if (!deckToDelete) return;

    startDeleting(async () => {
      const result = await deleteFlashcardDeckAction(deckToDelete.id);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Mazo eliminado.");
      setDeckToDelete(null);
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead className="hidden md:table-cell">Documento</TableHead>
            <TableHead>Dificultad</TableHead>
            <TableHead className="text-right">Tarjetas</TableHead>
            <TableHead className="hidden sm:table-cell">Fecha</TableHead>
            <TableHead>
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {decks.map((deck) => (
            <TableRow key={deck.id}>
              <TableCell className="max-w-56 truncate font-medium">
                {deck.title}
              </TableCell>
              <TableCell className="hidden max-w-48 truncate text-muted-foreground md:table-cell">
                {deck.documents?.filename ?? "Documento eliminado"}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {deck.difficulty
                    ? FLASHCARD_DIFFICULTY_LABELS[deck.difficulty]
                    : FLASHCARD_DIFFICULTY_LABELS.mixed}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {deck.card_count}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {formatDate(deck.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={flashcardDeckRoute(deck.id)}>
                      <GraduationCap aria-hidden />
                      Estudiar
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Eliminar el mazo ${deck.title}`}
                    onClick={() => setDeckToDelete(deck)}
                  >
                    <Trash2 className="text-muted-foreground" aria-hidden />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={deckToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeckToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar este mazo?</DialogTitle>
            <DialogDescription>
              Se eliminarán «{deckToDelete?.title}» y sus{" "}
              {deckToDelete?.card_count} tarjetas, junto con su historial de
              estudio. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isDeleting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Eliminando…
                </>
              ) : (
                "Eliminar mazo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
