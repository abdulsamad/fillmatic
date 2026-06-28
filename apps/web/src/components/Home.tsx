import {
  Zap,
  Target,
  Keyboard,
  UserCircle,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BookMarked,
  CreditCard,
  CheckCircle2,
  type LucideProps,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const STORE_URL =
  "https://chromewebstore.google.com/detail/fillmatic/mpkjmebmnkhpfomlopbehcpmgmfndfje";

type Feature = {
  Icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  title: string;
  description: string;
};

const CORE_FEATURES: Feature[] = [
  {
    Icon: Target,
    title: "Smart Field Detection",
    description:
      "Reads autocomplete attributes, name, ID, placeholder, and label text to understand what each field expects — then fills it with the right kind of data.",
  },
  {
    Icon: Sparkles,
    title: "Realistic Fake Data",
    description:
      "Generates proper names, emails, phone numbers, addresses, URLs, and more. Looks real enough to pass validation without touching production data.",
  },
  {
    Icon: Keyboard,
    title: "Natural Typing Simulation",
    description:
      "Simulates real keystrokes with configurable speed, firing focus, beforeinput, input, change, and blur events — React, Vue, and Angular controlled inputs respond correctly.",
  },
  {
    Icon: ShieldCheck,
    title: "Framework-Safe Filling",
    description:
      "Uses native prototype setters to bypass React and Vue value trackers, ensuring onChange always fires and controlled inputs update their visible state.",
  },
];

const POWER_FEATURES: Feature[] = [
  {
    Icon: Zap,
    title: "Custom Actions",
    description:
      "Create one-click buttons for specific sites that fill fields with fixed values. Built-in actions for Stripe, Lemon Squeezy, and Paddle are included — all editable.",
  },
  {
    Icon: UserCircle,
    title: "Identity Profiles",
    description:
      "Switch between named profiles (Work, Personal, Staging) each carrying their own email provider, password, and field overrides — great for multi-account testing.",
  },
  {
    Icon: BookMarked,
    title: "Field Rules",
    description:
      "Pin a fixed value to any field on any site using attribute matching. Perfect for promo codes, usernames, or anything that should always fill the same way.",
  },
  {
    Icon: SlidersHorizontal,
    title: "Deep Customisation",
    description:
      "Control typing speed, email provider (Mailinator, YOPmail, mailsac), ignored fields, shared passwords, and always-checked checkboxes per profile.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Install in one click",
    description:
      "Add FillMatic from the Chrome Web Store. No account, no sign-up — works immediately.",
  },
  {
    number: "02",
    title: "Open any web form",
    description:
      "Navigate to a registration page, checkout, or any form you're testing.",
  },
  {
    number: "03",
    title: "Fill with one click",
    description:
      "Click the FillMatic icon or press the keyboard shortcut. Every visible field fills in milliseconds.",
  },
];

const INTEGRATIONS = [
  { name: "Stripe", color: "text-indigo-600", bg: "bg-indigo-50", desc: "Test card numbers" },
  { name: "Lemon Squeezy", color: "text-yellow-700", bg: "bg-yellow-50", desc: "Checkout testing" },
  { name: "Paddle", color: "text-blue-600", bg: "bg-blue-50", desc: "Billing flows" },
  { name: "React", color: "text-sky-600", bg: "bg-sky-50", desc: "Controlled inputs" },
  { name: "Vue", color: "text-emerald-600", bg: "bg-emerald-50", desc: "v-model fields" },
  { name: "Angular", color: "text-red-600", bg: "bg-red-50", desc: "Reactive forms" },
];

const CHECKLIST = [
  "Fills all major input types — text, email, password, select, checkbox, radio, date",
  "Keyboard shortcut to fill without touching the mouse",
  "Handles dynamic forms that mount fields after page load",
  "Per-profile field rules and email addresses",
  "No account required — works offline",
  "Open to feedback — built by a developer, for developers",
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <a className="flex items-center gap-2" href="/">
            <img src="icon192.png" alt="FillMatic" width={28} />
            <span className="text-xl font-bold">
              Fill
              <span className="italic bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Matic
              </span>
            </span>
          </a>
          <nav className="hidden sm:flex gap-6 items-center">
            <a
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              href="#features"
            >
              Features
            </a>
            <a
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              href="#how-it-works"
            >
              How it works
            </a>
            <a
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              href="#feedback"
            >
              Feedback
            </a>
            <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-5">
              <a href={STORE_URL} target="_blank" rel="noopener">
                Add to Chrome
              </a>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="w-full pt-20 pb-24 md:pt-32 md:pb-36 bg-gradient-to-b from-violet-50 via-violet-50/60 to-white relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 60% 10%, rgba(139,92,246,0.08) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(168,85,247,0.06) 0%, transparent 50%)",
            }}
          />
          <div className="container mx-auto px-4 md:px-6 text-center relative">
            <Badge className="mb-6 bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100">
              Chrome Extension — free forever
            </Badge>
            <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl lg:text-7xl max-w-4xl mx-auto leading-[1.08]">
              Stop filling test forms{" "}
              <span className="bg-linear-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent">
                by hand
              </span>
            </h1>
            <p className="mt-6 mx-auto max-w-xl text-lg text-muted-foreground md:text-xl leading-relaxed">
              FillMatic detects every field on a form and fills it with realistic
              data in milliseconds. Built for developers who test forms every
              single day.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-8 shadow-lg shadow-violet-200"
              >
                <a href={STORE_URL} target="_blank" rel="noopener">
                  Add to Chrome — it's free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                <a href="/demo">Try the demo</a>
              </Button>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              No account required &nbsp;·&nbsp; Works on any form &nbsp;·&nbsp; Manifest V3
            </p>
          </div>
        </section>

        {/* ── Integrations strip ── */}
        <section className="border-y bg-muted/30 py-6">
          <div className="container mx-auto px-4 md:px-6">
            <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest mb-5">
              Works great with
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {INTEGRATIONS.map(({ name, color, bg, desc }) => (
                <div
                  key={name}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border ${bg} text-sm font-medium ${color}`}
                >
                  <span>{name}</span>
                  <span className="text-xs opacity-60">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Core Features ── */}
        <section id="features" className="w-full py-20 md:py-28 scroll-mt-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4 text-violet-600 border-violet-200">
                Core autofill
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                Fills the right data, every time
              </h2>
              <p className="mt-4 text-muted-foreground md:text-lg max-w-2xl mx-auto">
                FillMatic understands what each field expects. No random text
                in email fields, no strings in number inputs.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {CORE_FEATURES.map(({ Icon, title, description }) => (
                <Card
                  key={title}
                  className="border-border/60 hover:border-violet-200 hover:shadow-md transition-all duration-200"
                >
                  <CardContent className="p-6">
                    <div className="rounded-lg bg-violet-50 p-2.5 w-fit mb-4">
                      <Icon className="h-5 w-5 text-violet-600" />
                    </div>
                    <h3 className="font-semibold text-base mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── Power Features ── */}
        <section className="w-full py-20 md:py-28 bg-violet-50/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4 text-violet-600 border-violet-200">
                Power features
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                Built for serious form testing
              </h2>
              <p className="mt-4 text-muted-foreground md:text-lg max-w-2xl mx-auto">
                Profiles, Actions, and Field Rules give you precise control over
                what gets filled — on a per-site, per-environment basis.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Actions — large card */}
              <Card className="border-violet-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 md:row-span-2">
                <CardContent className="p-8 h-full flex flex-col">
                  <div className="rounded-lg bg-violet-100 p-3 w-fit mb-5">
                    <Zap className="h-6 w-6 text-violet-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Custom Actions</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    One-click buttons that appear in the popup on matching URLs.
                    Each Action runs a full autofill and overrides specific fields
                    with fixed values you define.
                  </p>
                  <div className="space-y-3 mt-auto">
                    {[
                      { label: "Stripe", desc: "Fill test card 4242 4242 4242 4242" },
                      { label: "Lemon Squeezy", desc: "Use test card on Lemon checkout" },
                      { label: "Paddle", desc: "Sandbox billing with valid test data" },
                      { label: "Custom site", desc: "Any URL pattern you define" },
                    ].map(({ label, desc }) => (
                      <div
                        key={label}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/40"
                      >
                        <CheckCircle2 className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Profiles */}
              <Card className="border-border/60 bg-white hover:border-violet-200 hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="rounded-lg bg-violet-50 p-2.5 w-fit mb-4">
                    <UserCircle className="h-5 w-5 text-violet-600" />
                  </div>
                  <h3 className="font-semibold text-base mb-2">Identity Profiles</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Switch between Work, Personal, or Staging profiles — each
                    with its own email domain, password, and ignored fields. One
                    click to switch context.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Work", "Personal", "Staging", "+ Add your own"].map((p) => (
                      <span
                        key={p}
                        className="text-xs px-2.5 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-700"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Field Rules */}
              <Card className="border-border/60 bg-white hover:border-violet-200 hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="rounded-lg bg-violet-50 p-2.5 w-fit mb-4">
                    <BookMarked className="h-5 w-5 text-violet-600" />
                  </div>
                  <h3 className="font-semibold text-base mb-2">Field Rules</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Match any field by id, name, placeholder, label, or
                    autocomplete attribute. Exact, contains, or regex operators.
                    Pin a fixed value that always wins.
                  </p>
                  <div className="text-xs font-mono bg-muted/60 rounded-md px-3 py-2.5 text-muted-foreground">
                    <span className="text-violet-600">name</span> contains{" "}
                    <span className="text-emerald-700">"coupon"</span>{" "}
                    <span className="text-orange-600">→</span> SAVE20
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="w-full py-20 md:py-28 scroll-mt-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4 text-violet-600 border-violet-200">
                How it works
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                From install to filled in 60 seconds
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              {STEPS.map(({ number, title, description }) => (
                <div key={number} className="flex flex-col items-center text-center">
                  <span className="text-7xl font-black text-violet-100 mb-3 leading-none select-none tabular-nums">
                    {number}
                  </span>
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-14 text-center">
              <Button
                asChild
                size="lg"
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-8 shadow-lg shadow-violet-200"
              >
                <a href={STORE_URL} target="_blank" rel="noopener">
                  Get FillMatic free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Checklist / What's included ── */}
        <section className="w-full py-20 md:py-24 bg-violet-600">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
                Everything you get, free
              </h2>
              <p className="mt-3 text-violet-200 md:text-lg">
                No paid tier, no feature gates. FillMatic is free and always will be.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-4">
              {CHECKLIST.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-violet-300 shrink-0 mt-0.5" />
                  <p className="text-sm text-violet-100 leading-snug">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="rounded-full px-8"
              >
                <a href={STORE_URL} target="_blank" rel="noopener">
                  Add to Chrome — free
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                className="rounded-full px-8 border border-white/30 text-white hover:bg-white/10 bg-transparent shadow-none"
              >
                <a href="/demo">See it in action</a>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Payment Integrations callout ── */}
        <section className="w-full py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <Badge variant="outline" className="mb-4 text-violet-600 border-violet-200">
                Payment integrations
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Test payment flows without memorising test cards
              </h2>
              <p className="mt-4 text-muted-foreground md:text-lg">
                FillMatic ships with built-in Actions for the three most common
                payment processors. Click once and the right test card fills in —
                no copy-pasting from docs.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3 max-w-3xl mx-auto">
              {[
                {
                  name: "Stripe",
                  card: "4242 4242 4242 4242",
                  color: "border-indigo-100",
                  accent: "bg-indigo-50 text-indigo-600",
                },
                {
                  name: "Lemon Squeezy",
                  card: "4242 4242 4242 4242",
                  color: "border-yellow-100",
                  accent: "bg-yellow-50 text-yellow-700",
                },
                {
                  name: "Paddle",
                  card: "4111 1111 1111 1111",
                  color: "border-blue-100",
                  accent: "bg-blue-50 text-blue-600",
                },
              ].map(({ name, card, color, accent }) => (
                <Card key={name} className={`border ${color}`}>
                  <CardContent className="p-5">
                    <div className={`text-xs font-semibold px-2 py-1 rounded w-fit mb-3 ${accent}`}>
                      {name}
                    </div>
                    <CreditCard className="h-5 w-5 text-muted-foreground mb-2" />
                    <p className="text-sm font-mono text-foreground">{card}</p>
                    <p className="text-xs text-muted-foreground mt-1">Test card filled automatically</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── Feedback ── */}
        <section id="feedback" className="w-full py-20 md:py-28 bg-muted/30 scroll-mt-16">
          <div className="container mx-auto px-4 md:px-6 max-w-lg">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Share your feedback
              </h2>
              <p className="mt-3 text-muted-foreground">
                Got a feature idea or something not working? Let me know — I read every message.
              </p>
            </div>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <form
                  action="https://airform.io/hello@abdulsamad.dev"
                  method="POST"
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-sm font-medium">
                        Name
                      </label>
                      <Input
                        id="name"
                        type="text"
                        name="Name"
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        name="Email"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="feedback" className="text-sm font-medium">
                      Message
                    </label>
                    <Textarea
                      id="feedback"
                      name="Feedback"
                      placeholder="What would you like to see improved?"
                      rows={4}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    Send feedback
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t py-8 bg-white">
        <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="icon192.png" alt="FillMatic" width={20} />
            <p className="text-sm text-muted-foreground">
              © 2026 Fill<span className="italic">M</span>atic. All rights reserved.
            </p>
          </div>
          <nav className="flex gap-6">
            <a
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              href="/demo"
            >
              Demo
            </a>
            <a
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              href="/privacy"
            >
              Privacy
            </a>
            <a
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              href={STORE_URL}
              target="_blank"
              rel="noopener"
            >
              Chrome Web Store
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
