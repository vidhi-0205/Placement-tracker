import Dashboard from "./Dashboard";
import { getCompanies } from "@/lib/db";

export default async function Home() {
  const companies = await getCompanies();

  return <Dashboard companies={companies} />;
}
