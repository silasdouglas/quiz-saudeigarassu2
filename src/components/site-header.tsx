"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Stethoscope,
  ShieldCheck,
  ChevronDown,
  LogOut,
  HelpCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/login/actions";
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
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
            <Stethoscope className="size-4 text-primary-foreground" />
          </div>
          <span>
            Quiz <span className="text-primary">Igarassu</span>
          </span>
        </Link>

        {/* Desktop nav + user */}
        <div className="flex items-center gap-1">
          {/* Nav links — hidden on mobile */}
          <nav className="mr-2 hidden items-center gap-0.5 sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent",
                  pathname.startsWith(item.href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
            {profile.role === "admin" && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent",
                  pathname.startsWith("/admin")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <ShieldCheck className="size-3.5" />
                Admin
              </Link>
            )}
          </nav>

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm hover:bg-accent transition-colors">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden font-medium sm:inline">{firstName}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="font-semibold">{profile.full_name}</div>
                <div className="text-xs text-muted-foreground">{profile.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Mobile-only nav items */}
              <div className="sm:hidden">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
                {profile.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </div>

              <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="size-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <HelpCircle className="size-4" />
                Ajuda
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <form action={logout}>
                <DropdownMenuItem asChild>
                  <button
                    type="submit"
                    className="w-full gap-2 text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="size-4" />
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
