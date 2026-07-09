import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBytes, formatDate } from "@/utils/format";

import type { DocumentRow } from "../types";
import { DocumentEmbedButton } from "./document-embed-button";
import { DocumentProcessButton } from "./document-process-button";
import { DocumentRowActions } from "./document-row-actions";
import { DocumentStatusBadge } from "./document-status-badge";

export function DocumentsTable({ documents }: { documents: DocumentRow[] }) {
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden sm:table-cell">Tamaño</TableHead>
            <TableHead className="hidden md:table-cell">Páginas</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="hidden sm:table-cell">Fecha</TableHead>
            <TableHead>
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="max-w-48 sm:max-w-72">
                <span
                  className="block truncate font-medium"
                  title={document.original_filename}
                >
                  {document.filename}
                </span>
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {formatBytes(document.size_bytes)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {document.page_count ?? "—"}
              </TableCell>
              <TableCell>
                <DocumentStatusBadge status={document.status} />
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {formatDate(document.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <DocumentProcessButton document={document} />
                  <DocumentEmbedButton document={document} />
                  <DocumentRowActions document={document} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
