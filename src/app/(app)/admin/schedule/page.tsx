import { redirect } from "next/navigation";

export default function AdminSchedulePage() {
  redirect("/admin/questions?tab=agendamento");
}
