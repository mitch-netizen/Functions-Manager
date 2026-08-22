"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/pipeline");
    router.refresh();
  }

  async function handleMagicLink() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMagicLinkSent(true);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-neutral-200 bg-white p-8">
        <h1 className="text-xl font-semibold">Sign in</h1>

        {magicLinkSent ? (
          <p className="text-sm text-neutral-600">Check your email for a sign-in link.</p>
        ) : (
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={pending}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 disabled:opacity-50"
            >
              Email me a sign-in link instead
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
