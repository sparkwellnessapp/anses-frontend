import { redirect } from "next/navigation";

/**
 * The site has exactly one entry point. Any visitor at "/" is sent
 * straight to /supervivencias.
 */
export default function RootPage() {
  redirect("/supervivencias");
}
