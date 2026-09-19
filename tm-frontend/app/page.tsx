import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  LayoutGrid,
  MoveUpRight,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden font-sans text-white">
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <SiteHeader />
        <section className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24 lg:py-20">
          <div className="max-w-2xl">
            <p className="mb-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
              <span className="h-px w-8 bg-white/50" />
              workspace / overview
            </p>
            <h1 className="max-w-xl text-5xl font-medium leading-[0.98] tracking-[-0.055em] sm:text-7xl">
              Make work
              <br />
              <span className="text-white/45">move forward.</span>
            </h1>
            <p className="mt-8 max-w-md text-sm leading-7 text-white/55 sm:text-base">
              A focused command center for engineering teams to plan, track, and
              ship better work together... or not.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="group flex h-12 items-center gap-8 rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/85"
              >
                Open workspace
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/task"
                className="flex h-12 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm text-white/75 transition hover:border-white/50 hover:text-white"
              >
                View tasks
                <MoveUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative lg:justify-self-end">
            <div className="absolute -inset-4 rounded-[2rem] border border-white/5" />
            <div className="relative w-full max-w-[430px] rounded-2xl border border-white/15 bg-[#090909]/95 p-5 shadow-[0_28px_90px_rgb(0_0_0_/_55%)] backdrop-blur-sm sm:p-6">
              <div className="mb-7 flex items-start justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
                    sprint / 24
                  </p>
                  <h2 className="mt-2 text-lg font-medium">Đừng dừng lại</h2>
                </div>
                <LayoutGrid className="h-5 w-5 text-white/45" />
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between text-[11px] text-white/45">
                    <span className="flex items-center gap-2">
                      <CircleDot className="h-3.5 w-3.5 text-amber-300" />
                      IN PROGRESS
                    </span>
                    <span>03</span>
                  </div>
                  <p className="mt-3 text-sm text-white/85">
                    Refine task workflow states
                  </p>
                  <div className="mt-4 h-1 rounded-full bg-white/10">
                    <div className="h-full w-[68%] rounded-full bg-amber-300" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 p-4">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    <p className="mt-5 font-mono text-2xl">12</p>
                    <p className="mt-1 text-[11px] text-white/40">completed</p>
                  </div>
                  <div className="rounded-xl border border-white/10 p-4">
                    <Clock3 className="h-4 w-4 text-sky-300" />
                    <p className="mt-5 font-mono text-2xl">04</p>
                    <p className="mt-1 text-[11px] text-white/40">upcoming</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5 font-mono text-[10px] text-white/40">
                <span>last synced 2m ago</span>
                <span className="text-white/65">84% on track</span>
              </div>
            </div>
          </div>
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}
