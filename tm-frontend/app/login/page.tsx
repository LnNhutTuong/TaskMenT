"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Eye, EyeOff, GitBranch, GitFork } from "lucide-react";
import { toast } from "react-toastify";
import { useState } from "react";
import type { LoginFromData } from "../types/auth";
import type { SubmitEvent } from "react";
import { login } from "@/service/auth.service";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
export default function LoginPage() {
  const router = useRouter();

  //{conKhi: XimenT} = con khi co ten la XimenT
  const { login: saveLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter your email and password.");
      return;
    }

    const payload: LoginFromData = {
      email,
      password,
    };

    try {
      const response = await login(payload);
      saveLogin(response.data.accessToken, response.data.user);
      toast.success("Signed in successfully.");
      handleBackToHome();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Email or password is incorrect.",
      );
    }
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <main className="relative flex flex-col min-h-screen items-center justify-center overflow-hidden bg-transparent px-4 py-7 font-sans text-white sm:px-6">
      <div className="mb-2">
        <button
          onClick={handleBackToHome}
          className="cursor-pointer rounded-xl border border-white/20 hover:font-bold hover:bg-white/20 px-2 hover:shadow-[0_8px_24px_rgb(255_255_255_/_10%)]"
        >
          Back to home ?
        </button>
      </div>
      <Card className="relative w-full max-w-[480px] rounded-3xl bg-[#080808] p-7 shadow-[0_24px_80px_rgb(0_0_0_/_60%)] sm:p-10">
        <header className="mb-9 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/80 font-mono text-lg font-bold transition hover:bg-white hover:text-black">
            &lt;/&gt;
          </div>
          <div>
            <h1 className="text-xl font-medium tracking-tight">
              DevTask Manager
            </h1>
            <p className="mt-1 text-xs text-white/55">
              Streamline your engineering workflow.
            </p>
          </div>
        </header>

        <div className="mb-9">
          <p className="mb-3 font-mono text-[10px] tracking-[0.12em] text-white/45">
            {"// secure access"}
          </p>
          <h2 className="text-3xl font-medium tracking-tight">Welcome back.</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">
            Sign in to continue to your workspace.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              className="mb-2.5 block text-xs font-medium text-white/70"
              htmlFor="email"
            >
              Email / Tech ID
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              placeholder="engineer@company.com"
              className="h-12 border-[#262626] bg-[#0a0a0a] px-4 focus:border-white focus:bg-[#0d0d0d]"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                className="text-xs font-medium text-white/70"
                htmlFor="password"
              >
                Password
              </label>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-0 text-[11px] font-normal underline underline-offset-4"
              >
                Forgot password?
              </Button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                placeholder="Enter your password"
                className="h-12 border-[#262626] bg-[#0a0a0a] px-4 pr-16 focus:border-white focus:bg-[#0d0d0d]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-white/45 transition hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-3 text-xs text-white/65">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-white/30 bg-black accent-white"
            />
            Remember me
          </label>

          <Button
            type="submit"
            className="h-12 w-full justify-between rounded-xl px-4 text-sm font-semibold hover:shadow-[0_8px_24px_rgb(255_255_255_/_10%)]"
          >
            <span>Sign In</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>

        <div className="my-8 flex items-center gap-3 text-[10px] tracking-[0.12em] text-white/35">
          <span className="h-px flex-1 bg-white/10" />
          <span>or continue with</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-11 rounded-xl">
            <GitFork className="h-4 w-4" aria-hidden="true" />
            GitHub
          </Button>
          <Button variant="outline" className="h-11 rounded-xl">
            <GitBranch className="h-4 w-4" aria-hidden="true" />
            GitLab
          </Button>
        </div>

        <footer className="mt-9 border-t border-white/10 pt-5 font-mono text-[10px] tracking-[0.08em] text-white/40">
          <Badge className="border-white/10 bg-transparent px-0 py-0 font-mono text-[10px] font-normal text-white/40">
            <span className="mr-2 text-white">●</span>
            System Status:{" "}
            <span className="ml-1 font-bold text-white">Online</span>
          </Badge>
        </footer>
      </Card>
    </main>
  );
}
