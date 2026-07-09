import { Badge } from "@/components/ui/badge";
import { TEST_DIFFICULTY_LABELS } from "@/constants/tests";
import type { Enums } from "@/lib/supabase/types";

/** difficulty null = test de dificultad mixta. */
export function TestDifficultyBadge({
  difficulty,
}: {
  difficulty: Enums<"question_difficulty"> | null;
}) {
  return (
    <Badge variant={difficulty === "hard" ? "destructive" : "secondary"}>
      {TEST_DIFFICULTY_LABELS[difficulty ?? "mixed"]}
    </Badge>
  );
}
