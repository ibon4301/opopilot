import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint: string;
}

export function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <Card className="py-5">
      <CardContent className="flex flex-col gap-3 px-5">
        <div className="flex items-center justify-between">
          <p className="text-small font-medium text-muted-foreground">
            {label}
          </p>
          <Icon className="size-4 text-muted-foreground" aria-hidden />
        </div>
        <p className="text-h2 tabular-nums">{value}</p>
        <p className="text-caption text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
