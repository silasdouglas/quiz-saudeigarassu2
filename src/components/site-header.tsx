"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  ChevronDown,
  LogOut,
  HelpCircle,
  Settings,
  Trophy,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Profile } from "@/lib/types";

const navItems = [
  { href: "/quiz", label: "Quiz" },
  { href: "/ranking", label: "Ranking" },
];

export function SiteHeader({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const firstName = profile.full_name.split(" ")[0];

  return (
    <header className="sticky top-0 z-10 bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-white p-1 shadow-sm">
            <Image
              src="/logo-mark.png"
              alt="Prefeitura de Igarassu"
              width={32}
              height={32}
              className="size-full object-contain"
              priority
            />
          </div>
          <span className="text-primary-foreground">Quiz Igarassu</span>
        </Link>

        {/* Desktop nav + user */}
        <div className="flex items-center gap-1">
          {/* Nav links — hidden on mobile */}
          <nav className="mr-1 hidden items-center gap-0.5 sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/15",
                  pathname.startsWith(item.href)
                    ? "bg-white/20 text-white"
                    : "text-primary-foreground/80"
                )}
              >
                {item.label}
              </Link>
            ))}
            {profile.role === "admin" && (
              <Link
                href="/admin"
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/15",
                  pathname.startsWith("/admin")
                    ? "bg-white/20 text-white"
                    : "text-primary-foreground/80"
                )}
              >
                <ShieldCheck className="size-3.5" />
                Admin
              </Link>
            )}
          </nav>

          <ThemeToggle className="text-primary-foreground/90 hover:bg-white/15" />

          {/* Divider before profile dropdown */}
          <span className="mx-1 hidden h-5 w-px bg-white/25 sm:block" />

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1 text-sm transition-colors hover:bg-white/15">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="size-7 rounded-full object-cover ring-2 ring-white/40"
                  />
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden font-medium sm:inline">{firstName}</span>
                <ChevronDown className="size-3.5 text-primary-foreground/70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-2">
              <DropdownMenuLabel className="font-normal px-2 py-2.5">
                <div className="font-semibold text-sm">{profile.full_name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{profile.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-0 my-1" />

              {/* Mobile-only nav items */}
              <div className="sm:hidden">
                <DropdownMenuItem asChild className="cursor-pointer gap-3 px-2 py-2.5 rounded-lg">
                  <Link href="/quiz">
                    <BookOpen className="size-4 shrink-0" />
                    Quiz
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer gap-3 px-2 py-2.5 rounded-lg">
                  <Link href="/ranking">
                    <Trophy className="size-4 shrink-0" />
                    Ranking
                  </Link>
                </DropdownMenuItem>
                {profile.role === "admin" && (
                  <DropdownMenuItem asChild className="cursor-pointer gap-3 px-2 py-2.5 rounded-lg">
                    <Link href="/admin">
                      <ShieldCheck className="size-4 shrink-0" />
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="mx-0 my-1" />
              </div>

              <DropdownMenuItem asChild className="cursor-pointer gap-3 px-2 py-2.5 rounded-lg">
                <Link href="/settings">
                  <Settings className="size-4 shrink-0" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer gap-3 px-2 py-2.5 rounded-lg">
                <Link href="/ajuda">
                  <HelpCircle className="size-4 shrink-0" />
                  Ajuda
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-0 my-1" />
              <form action={logout}>
                <DropdownMenuItem asChild>
                  <button
                    type="submit"
                    className="w-full cursor-pointer gap-3 px-2 py-2.5 rounded-lg text-destructive focus:text-destructive"
                  >
                    <LogOut className="size-4 shrink-0" />
                    Sair
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
