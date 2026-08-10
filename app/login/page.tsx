"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/utils/supabase/client";

type Mode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;

    setIsBusy(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (mode === "signup") {
        if (password.length < 8) {
          throw new Error("Use a password with at least 8 characters.");
        }

        const emailRedirectTo =
          `${window.location.origin}/auth/callback?next=/dashboard`;

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo,
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          router.replace("/dashboard");
          router.refresh();
          return;
        }

        setMessage(
          "Account created. Check your email and click the confirmation link, then you’ll be signed in."
        );
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not complete that request."
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function sendPasswordReset() {
    if (!email.trim()) {
      setErrorMessage("Enter your email address first.");
      return;
    }

    setIsBusy(true);
    setMessage("");
    setErrorMessage("");

    try {
      const redirectTo =
        `${window.location.origin}/login`;

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo }
        );

      if (error) throw error;

      setMessage(
        "If an account exists for that email, a password reset message has been sent."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Password reset could not be started."
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070a] px-6 py-10 text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/home" className="flex items-center gap-3">
          <span className="flex h-11 w-11 overflow-hidden rounded-xl bg-white">
            <img
              src="/branding/walknwow-logo.png"
              alt="WalkNWow AI logo"
              className="h-full w-full object-cover"
            />
          </span>
          <span className="text-2xl font-black">
            WalkNWow<span className="text-cyan-300">.AI</span>
          </span>
        </Link>

        <Link
          href="/home"
          className="text-sm text-white/50 transition hover:text-white"
        >
          View website
        </Link>
      </nav>

      <section className="mx-auto mt-14 max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/40">
        <div className="mx-auto mb-7 flex h-24 w-24 overflow-hidden rounded-[1.75rem] bg-white p-1">
          <img
            src="/branding/walknwow-logo.png"
            alt="WalkNWow AI"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-black/30 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage("");
              setErrorMessage("");
            }}
            className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${
              mode === "login"
                ? "bg-cyan-300 text-black"
                : "text-white/45 hover:text-white"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setMessage("");
              setErrorMessage("");
            }}
            className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${
              mode === "signup"
                ? "bg-cyan-300 text-black"
                : "text-white/45 hover:text-white"
            }`}
          >
            Create account
          </button>
        </div>

        <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
          Agent account
        </p>

        <h1 className="mt-3 text-4xl font-black">
          {mode === "login" ? "Welcome back." : "Create your account."}
        </h1>

        <p className="mt-3 text-sm leading-6 text-white/45">
          {mode === "login"
            ? "Sign in to manage projects, past videos, agent branding, membership and billing."
            : "Create one WalkNWow account for your profile, brokerage, projects, videos and future billing."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {mode === "signup" && (
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              autoComplete="name"
              placeholder="Full name"
              className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 outline-none focus:border-cyan-300/60"
            />
          )}

          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            autoComplete="email"
            placeholder="Email address"
            className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 outline-none focus:border-cyan-300/60"
          />

          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="Password"
            className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 outline-none focus:border-cyan-300/60"
          />

          {errorMessage && (
            <p className="rounded-xl border border-red-300/20 bg-red-300/[0.08] px-4 py-3 text-sm text-red-100">
              {errorMessage}
            </p>
          )}

          {message && (
            <p className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.08] px-4 py-3 text-sm text-emerald-100">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isBusy}
            className="w-full rounded-xl bg-cyan-300 px-5 py-3 font-bold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy
              ? "Please wait..."
              : mode === "login"
                ? "Log in"
                : "Create account"}
          </button>
        </form>

        {mode === "login" && (
          <button
            type="button"
            disabled={isBusy}
            onClick={sendPasswordReset}
            className="mt-4 w-full text-center text-sm font-semibold text-white/40 transition hover:text-cyan-300 disabled:opacity-50"
          >
            Forgot your password?
          </button>
        )}

        <div className="my-6 h-px bg-white/10" />

        <p className="text-center text-sm text-white/45">
          {mode === "login" ? "New to WalkNWow?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-semibold text-cyan-300 hover:text-cyan-200"
          >
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>
      </section>
    </main>
  );
}
