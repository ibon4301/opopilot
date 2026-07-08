"use client";

import { Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function UploadCta() {
  return (
    <Button
      onClick={() =>
        toast("Muy pronto", {
          description:
            "La subida de documentos llegará en la próxima fase de OpoPilot.",
        })
      }
    >
      <Upload aria-hidden />
      Subir primer documento
    </Button>
  );
}
