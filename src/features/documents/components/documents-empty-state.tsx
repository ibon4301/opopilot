import { FileText } from "lucide-react";

export function DocumentsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-accent">
        <FileText className="size-6 text-primary" aria-hidden />
      </div>
      <p className="mt-6 max-w-md text-body font-medium text-balance">
        Todavía no has subido ningún documento
      </p>
      <p className="mt-2 max-w-md text-small text-muted-foreground">
        Sube tu primer PDF con el área de arriba: OpoPilot lo convertirá en
        tests, flashcards y resúmenes en las próximas fases.
      </p>
    </div>
  );
}
