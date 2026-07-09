"use client";

import { useState, useTransition } from "react";
import { FileText, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  searchDocumentsAction,
  type SearchResult,
} from "@/server/actions/embeddings";

export function SemanticSearchCard() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [isSearching, startSearch] = useTransition();

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startSearch(async () => {
      const result = await searchDocumentsAction(query);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setResults(result.data);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Búsqueda semántica</CardTitle>
        <CardDescription>
          Busca por significado dentro de tus documentos indexados: no hace
          falta que coincidan las palabras exactas.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="p. ej. ¿qué principios recoge el título preliminar?"
            aria-label="Consulta de búsqueda semántica"
            disabled={isSearching}
          />
          <Button
            type="submit"
            disabled={isSearching || query.trim().length < 3}
          >
            {isSearching ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Search aria-hidden />
            )}
            Buscar
          </Button>
        </form>

        {results !== null && results.length === 0 && (
          <p className="text-small text-muted-foreground">
            Sin resultados para esta consulta.
          </p>
        )}

        {results !== null && results.length > 0 && (
          <ul className="flex flex-col gap-3">
            {results.map((result) => (
              <li
                key={result.chunk_id}
                className="rounded-lg border p-3 text-small"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <FileText
                    className="size-3.5 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="font-medium">
                    {result.document_filename}
                  </span>
                  <span className="text-caption text-muted-foreground">
                    pág. {result.page_number ?? "—"}
                  </span>
                  <Badge variant="secondary" className="ml-auto">
                    {Math.round(result.similarity * 100)}% similar
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-3 text-muted-foreground">
                  {result.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
