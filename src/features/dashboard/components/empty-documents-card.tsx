import { FileText } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { UploadCta } from "./upload-cta";

export function EmptyDocumentsCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-h4">Empieza por tu temario</CardTitle>
        <CardDescription>
          Sube tus apuntes o temario en PDF y OpoPilot los convertirá en
          material de estudio.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center">
        <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent">
            <FileText className="size-5 text-primary" aria-hidden />
          </div>
          <p className="max-w-xs text-small text-muted-foreground">
            Aún no tienes documentos. Cuando subas el primero, aquí verás tu
            biblioteca de estudio.
          </p>
          <UploadCta />
        </div>
      </CardContent>
    </Card>
  );
}
