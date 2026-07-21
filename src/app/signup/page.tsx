import { redirect } from "next/navigation";

// Public self-signup is disabled — WAVR accounts are created by invitation only.
// Anyone landing here is sent to the login page.
export default function SignupPage() {
  redirect("/login");
}
