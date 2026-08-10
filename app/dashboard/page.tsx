import Link from "next/link";
import { redirect } from "next/navigation";
import AgentProfileForm,{type AgentProfile} from "@/components/dashboard/agent-profile-form";
import SiteNav from "@/components/layout/site-nav";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/");
 const [{data:p},{data:rows}]=await Promise.all([
  supabase.from("agent_profiles").select("*").eq("id",user.id).maybeSingle(),
  supabase.from("projects").select("id,listing_url,property_address,property_city,property_state,status,progress_percent").eq("user_id",user.id).order("created_at",{ascending:false})
 ]);
 const projects=rows??[]; const name=p?.full_name||(typeof user.user_metadata?.full_name==="string"?user.user_metadata.full_name:"");
 const profile:AgentProfile={id:user.id,email:p?.email??user.email??null,full_name:p?.full_name??name??null,phone:p?.phone??null,license_number:p?.license_number??null,website:p?.website??null,closing_cta:p?.closing_cta??null,headshot_url:p?.headshot_url??null,brokerage_name:p?.brokerage_name??null,brokerage_logo_url:p?.brokerage_logo_url??null,office_phone:p?.office_phone??null,office_email:p?.office_email??null,office_address:p?.office_address??null,city:p?.city??null,state:p?.state??null,postal_code:p?.postal_code??null};
 const label=(s:string)=>s==="ready"?"Ready":s==="failed"?"Needs attention":["queued","analyzing","generating","merging"].includes(s)?"Creating":"Draft";
 return <main className="min-h-screen bg-[#05070a] text-white"><SiteNav signedIn userLabel={name||user.email||""}/>
  <div className="mx-auto max-w-6xl px-5 py-10">
   <section className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/[0.06] p-8 sm:p-10">
    <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">{name?`Hi ${name.split(" ")[0]}`:"Welcome"}</p>
    <h1 className="mt-3 text-4xl font-black sm:text-5xl">What would you like to do?</h1>
    <p className="mt-3 text-white/45">Start a property video or check on one you already created.</p>
    <Link href="/projects/new" className="mt-7 inline-flex w-full justify-center rounded-2xl bg-cyan-300 px-7 py-5 text-lg font-black text-black sm:w-auto">+ Create New Video</Link>
   </section>
   <section id="videos" className="mt-8 scroll-mt-28">
    <h2 className="text-2xl font-black">My Videos</h2><p className="mt-1 text-sm text-white/40">Everything you're working on is right here.</p>
    {projects.length===0?<div className="mt-5 rounded-3xl border border-dashed border-white/15 p-10 text-center text-white/40">You haven't created a video yet.</div>:
    <div className="mt-5 grid gap-4 md:grid-cols-2">{projects.map((x:any)=>{const l=label(x.status);return <article key={x.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
      <div className="flex justify-between gap-4"><div className="min-w-0"><h3 className="truncate text-lg font-bold">{x.property_address||x.listing_url||"Property video"}</h3><p className="mt-1 text-sm text-white/35">{[x.property_city,x.property_state].filter(Boolean).join(", ")}</p></div><span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-bold text-white/60">{l}</span></div>
      {l==="Creating"&&<div className="mt-5"><div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-cyan-300" style={{width:`${Math.max(5,Math.min(100,x.progress_percent||0))}%`}}/></div></div>}
      <Link href={`/projects/${x.id}`} className="mt-5 inline-block rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black">{l==="Ready"?"View Video":"Continue"}</Link>
    </article>})}</div>}
   </section>
   <details id="profile" className="mt-8 scroll-mt-28 rounded-3xl border border-white/10 bg-white/[0.025]"><summary className="cursor-pointer list-none p-6"><div className="flex justify-between"><div><h2 className="text-xl font-bold">My Profile</h2><p className="mt-1 text-sm text-white/40">Photo, contact info and brokerage.</p></div><span className="text-cyan-300">Edit →</span></div></summary><div className="border-t border-white/10 p-5"><AgentProfileForm userId={user.id} initialProfile={profile}/></div></details>
   <section id="billing" className="mt-5 scroll-mt-28 rounded-3xl border border-white/10 bg-white/[0.025] p-6"><h2 className="text-xl font-bold">Billing</h2><p className="mt-1 text-sm text-white/40">Plans, payment methods and receipts.</p></section>
  </div>
 </main>;
}
