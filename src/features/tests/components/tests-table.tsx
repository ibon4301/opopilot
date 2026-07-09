import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { testDetailRoute } from "@/constants/routes";
import type { TestListItem } from "@/server/actions/tests";
import { formatDate } from "@/utils/format";

import { TestDifficultyBadge } from "./test-difficulty-badge";

export function TestsTable({ tests }: { tests: TestListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead className="hidden md:table-cell">Documento</TableHead>
            <TableHead>Dificultad</TableHead>
            <TableHead className="text-right">Preguntas</TableHead>
            <TableHead className="hidden sm:table-cell">Fecha</TableHead>
            <TableHead>
              <span className="sr-only">Ver test</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tests.map((test) => (
            <TableRow key={test.id}>
              <TableCell className="max-w-56 truncate font-medium">
                {test.title}
              </TableCell>
              <TableCell className="hidden max-w-48 truncate text-muted-foreground md:table-cell">
                {test.documents?.filename ?? "Documento eliminado"}
              </TableCell>
              <TableCell>
                <TestDifficultyBadge difficulty={test.difficulty} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {test.question_count}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {formatDate(test.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={testDetailRoute(test.id)}>
                    Ver
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
