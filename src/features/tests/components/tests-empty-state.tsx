import { ListChecks } from "lucide-react";

export function TestsEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
      <div className="flex size-11 items-center justify-center rounded-lg bg-muted">
        <ListChecks className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="font-medium">Aún no has generado ningún test</p>
      <p className="max-w-sm text-small text-muted-foreground">
        Genera tu primer test con el formulario de arriba: elige un documento
        indexado, el número de preguntas y la dificultad.
      </p>
    </div>
  );
}
