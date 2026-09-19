"use client";

import Link from "next/link";
import { ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "react-toastify";

export function SiteHeader() {
  const { isAuthenticated, isAuthLoading, logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
    toast.success("Logout successfully");
  };

  return (
    <header className="flex items-center justify-between border-b border-white/15 pb-6">
      <Link href="/" className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/75 font-mono text-base font-bold transition hover:bg-white hover:text-black">
          &lt;/&gt;
        </span>
        <span className="text-base font-medium tracking-tight">
          DevTask Manager
        </span>
      </Link>

      <div className="flex w-[220px] shrink-0 justify-end text-sm text-white/55 sm:w-[280px]">
        {!isAuthLoading ? (
          user && isAuthenticated ? (
            <details className="group relative">
              <summary className="flex h-12 cursor-pointer list-none items-center justify-end gap-3 rounded-xl border border-white/15 bg-white/[0.03] px-3 transition hover:border-white/35 hover:bg-white/[0.07] [&::-webkit-details-marker]:hidden">
                <Avatar className="size-10 border border-white/20">
                  <AvatarImage
                    src="https://i.pravatar.cc/160?img=12"
                    alt="Alex Morgan"
                  />
                  <AvatarFallback>AM</AvatarFallback>
                </Avatar>
                <span className="hidden min-w-0 max-w-[150px] text-left sm:block">
                  <span className="block truncate text-sm font-medium text-white/90">
                    {user?.name}
                  </span>
                  <span className="block truncate text-xs text-white/45">
                    {user?.email}
                  </span>
                </span>
                <ChevronDown className="size-4 text-white/45 transition-transform group-open:rotate-180" />
              </summary>

              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-60 rounded-xl border border-white/15 bg-[#0b0b0b] p-2 shadow-[0_18px_50px_rgb(0_0_0_/_45%)]">
                <div className="border-b border-white/10 px-3 py-2.5">
                  <p className="text-sm font-medium text-white/90">
                    Alex Morgan
                  </p>
                  <p className="mt-1 text-xs text-white/45">alex@example.com</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-white/65 transition hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="size-4" />
                  Log out
                </button>
              </div>
            </details>
          ) : (
            <div className="flex items-center justify-end gap-3">
              <Link
                href="/login"
                className="rounded-lg border border-white/20 px-4 py-2.5 transition hover:border-white/50 hover:bg-white/10 hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-white px-4 py-2.5 font-medium text-black transition hover:bg-white/85"
              >
                Login
              </Link>
            </div>
          )
        ) : (
          <></>
        )}
      </div>
    </header>
  );
}
