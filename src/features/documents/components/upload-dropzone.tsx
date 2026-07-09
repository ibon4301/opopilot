"use client";

import { useState } from "react";
import { FileUp, Loader2 } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import {
  DOCUMENT_EXTENSION,
  DOCUMENT_MAX_SIZE_MB,
} from "@/constants/documents";
import { cn } from "@/lib/utils";

import { useDocumentUpload } from "../hooks/use-document-upload";

export function UploadDropzone() {
  const { upload, phase, progress, filename, isUploading } =
    useDocumentUpload();
  const [isDragOver, setIsDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file && !isUploading) {
      void upload(file);
    }
  }

  return (
    // El label delega clic y teclado en el input de archivo nativo.
    <label
      onDragOver={(event) => {
        event.preventDefault();
        if (!isUploading) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragOver(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-8 text-center transition-colors has-[:focus-visible]:border-ring has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
        isDragOver && "border-primary bg-accent",
        isUploading && "cursor-default opacity-80",
        !isUploading && "hover:border-primary/50 hover:bg-accent/50",
      )}
    >
      <input
        type="file"
        accept={DOCUMENT_EXTENSION}
        className="sr-only"
        disabled={isUploading}
        aria-label="Subir un documento PDF"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {isUploading ? (
        <>
          <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
          <div className="w-full max-w-sm">
            <p className="truncate text-small font-medium">{filename}</p>
            <Progress
              value={progress}
              className="mt-3"
              aria-label="Progreso de subida"
            />
            <p className="mt-2 text-caption text-muted-foreground">
              {phase === "finalizing"
                ? "Verificando la subida…"
                : `Subiendo… ${progress}%`}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent">
            <FileUp className="size-5 text-primary" aria-hidden />
          </div>
          <div>
            <p className="text-small font-medium">
              Arrastra tu PDF aquí o haz clic para seleccionarlo
            </p>
            <p className="mt-1 text-caption text-muted-foreground">
              Solo PDF · máximo {DOCUMENT_MAX_SIZE_MB} MB
            </p>
          </div>
        </>
      )}
    </label>
  );
}
