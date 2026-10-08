import { redirect } from "next/navigation";

// Los indicadores de esta página se migraron al módulo /dashboard/indicators
export default function Dashboard() {
  redirect("/dashboard/indicators");
}
