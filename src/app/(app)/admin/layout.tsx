import type { ReactNode } from "react";
import { LayoutDashboard, Tag, HelpCircle, CalendarDays, Settings2 } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { AdminNavLink } from "@/components/admin/admin-nav-link";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="size-4 shrink-0" /> },
  { href: "/admin/categories", label: "Categorias", icon: <Tag className="size-4 shrink-0" /> },
  { href: "/admin/questions", label: "Perguntas", icon: <HelpCircle className="size-4 shrink-0" /> },
  { href: "/admin/schedule", label: "Agendamento", icon: <CalendarDays className="size-4 shrink-0" /> },
  { href: "/admin/settings", label: "Configurações", icon: <Settings2 className="size-4 shrink-0" /> },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      {/* Mobile horizontal nav */}
      <nav className="mb-5 flex gap-1 overflow-x-auto pb-1 sm:hidden">
        {navItems.map((item) => (
          <AdminNavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </nav>

      {/* Desktop two-column layout */}
      <div className="sm:flex sm:gap-6">
        <aside className="hidden w-52 shrink-0 sm:block">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Admin
          </p>
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <AdminNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
              />
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
