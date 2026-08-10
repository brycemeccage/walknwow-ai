import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import SiteNav from "@/components/layout/site-nav";
import ProjectCheckout from "@/components/projects/project-checkout";
import { createClient } from "@/utils/supabase/server";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { id } = await params;
  const { step = "property" } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/projects/${id}`);
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !project) {
    notFound();
  }

  const currentStep =
    step === "photos"
      ? 2
      : step === "create"
      ? 3
      : step === "done"
      ? 4
      : 1;

  const steps = [
    { number: 1, label: "Property" },
    { number: 2, label: "Photos" },
    { number: 3, label: "Create" },
    { number: 4, label: "Done" },
  ];

  return (
    <main className="min-h-screen bg-[#fffaf4] text-[#172026]">
      <SiteNav signedIn userLabel={user.email || ""} />

      <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        <Link
          href="/dashboard"
          className="text-sm font-black text-cyan-600 hover:text-cyan-700"
        >
          ← My Videos
        </Link>

        <div className="mt-6 rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-[0_20px_60px_rgba(14,165,233,0.08)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-600">
            Your Property
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            Let&apos;s make this easy.
          </h1>

          <p className="mt-3 max-w-2xl text-slate-500">
            We&apos;ll move through one simple step at a time.
          </p>

          <div className="mt-8 grid grid-cols-4 gap-2">
            {steps.map((item) => {
              const active = item.number === currentStep;
              const complete = item.number < currentStep;

              return (
                <div key={item.number} className="text-center">
                  <div
                    className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${
                      active
                        ? "bg-cyan-500 text-white"
                        : complete
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {complete ? "✓" : item.number}
                  </div>
                  <p
                    className={`mt-2 text-xs font-bold ${
                      active ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {currentStep === 1 && (
          <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">
              Step 1 of 4
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em]">
              Your property is ready.
            </h2>

            <p className="mt-3 text-slate-500">
              We&apos;ll use this listing to find the property photos and prepare
              your video.
            </p>

            <div className="mt-6 break-all rounded-2xl border border-slate-200 bg-[#fffaf4] p-4 text-sm text-slate-600">
              {project.listing_url || "No listing URL saved."}
            </div>

            <Link
              href={`/projects/${project.id}?step=photos`}
              className="mt-7 inline-flex w-full justify-center rounded-2xl bg-cyan-500 px-6 py-4 text-lg font-black text-white shadow-sm transition hover:bg-cyan-600 sm:w-auto"
            >
              Continue to Photos →
            </Link>
          </section>
        )}

        {currentStep === 2 && (
          <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">
              Step 2 of 4
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em]">
              Pick your favorite photos.
            </h2>

            <p className="mt-3 max-w-2xl text-slate-500">
              We&apos;ll pull the listing photos here next. For now, this confirms
              the Photos step is working.
            </p>

            <div className="mt-6 rounded-2xl border-2 border-dashed border-cyan-200 bg-cyan-50/60 p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                🏡
              </div>
              <p className="mt-4 text-lg font-black">Photos will appear here</p>
              <p className="mt-2 text-sm text-slate-500">
                Next we&apos;ll connect your listing-photo extraction to this step.
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/projects/${project.id}`}
                className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-base font-black text-slate-700"
              >
                ← Back
              </Link>

              <Link
                href={`/projects/${project.id}?step=create`}
                className="inline-flex justify-center rounded-2xl bg-cyan-500 px-6 py-4 text-base font-black text-white"
              >
                Continue to Create →
              </Link>
            </div>
          </section>
        )}

        {currentStep === 3 && (
          <section className="mt-6">
            <ProjectCheckout projectId={project.id} />
          </section>
        )}

        {currentStep === 4 && (
          <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
              ✓
            </div>
            <h2 className="mt-5 text-3xl font-black">You&apos;re all set.</h2>
            <p className="mt-3 text-slate-500">
              Your project is ready for the next production step.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}