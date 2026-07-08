"use client";

import { useTransition } from "react";
import Link from "next/link";
import { CreditCard, Loader2, LogOut, Settings } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import type { UserProfile } from "@/lib/supabase/types";
import { logoutAction } from "@/server/actions/auth";

function getInitials(profile: UserProfile) {
  const source = profile.fullName ?? profile.email;
  const words = source.trim().split(/\s+/);
  const first = words[0]?.charAt(0) ?? "?";
  const second = words[1]?.charAt(0) ?? "";
  return `${first}${second}`.toUpperCase();
}

export function UserMenu({ profile }: { profile: UserProfile }) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Abrir menú de usuario"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-gradient-brand text-caption font-semibold text-white">
              {getInitials(profile)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-medium">
            {profile.fullName ?? "Mi cuenta"}
          </span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {profile.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={ROUTES.settings}>
              <Settings aria-hidden />
              Ajustes
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={ROUTES.billing}>
              <CreditCard aria-hidden />
              Billing
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onSelect={(event) => {
            event.preventDefault();
            startTransition(async () => {
              await logoutAction();
            });
          }}
        >
          {isPending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <LogOut aria-hidden />
          )}
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
