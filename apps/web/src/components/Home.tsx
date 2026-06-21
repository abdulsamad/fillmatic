import {
  Zap,
  Target,
  Keyboard,
  CreditCard,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  type LucideProps,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const FEATURES: { Icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>; title: string; description: string }[] = [
  {
    Icon: Target,
    title: "Smart Field Detection",
    description:
      "Detects field purpose from autocomplete attributes, name, ID, placeholder, and label text — fills the right data every time.",
  },
  {
    Icon: Sparkles,
    title: "Realistic Fake Data",
    description:
      "Generates proper names, emails, phone numbers, addresses, and more. Data looks real enough to pass validation without touching production.",
  },
  {
    Icon: Keyboard,
    title: "Natural Typing Simulation",
    description:
      "Simulates human typing at a configurable speed, firing focus, input, change, and blur events so React, Vue, and Angular forms respond correctly.",
  },
  {
    Icon: CreditCard,
    title: "Site-Specific Rules",
    description:
      "Built-in rules for Stripe, Lemon Squeezy, and Paddle automatically fill valid test card numbers — no memorising test credentials.",
  },
  {
    Icon: Zap,
    title: "One Keyboard Shortcut",
    description:
      "Trigger a full form fill without lifting your hands from the keyboard. Works on any form, on any site.",
  },
  {
    Icon: SlidersHorizontal,
    title: "Fully Customisable",
    description:
      "Control typing speed, email provider (Mailinator, YOPmail, mailsac), ignored fields, shared password, and always-checked checkboxes.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Install the extension",
    description: "Add FillMatic from the Chrome Web Store in one click. No account required.",
  },
  {
    number: "02",
    title: "Open any web form",
    description: "Navigate to a registration page, checkout form, or any form you need to test.",
  },
  {
    number: "03",
    title: "Fill with one click",
    description:
      "Click the FillMatic icon or press the keyboard shortcut. Every field fills instantly.",
  },
];

const STORE_URL =
  "https://chromewebstore.google.com/detail/fillmatic/mpkjmebmnkhpfomlopbehcpmgmfndfje";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <a className="flex items-center gap-2" href="#">
            <img src="icon192.png" alt="FillMatic" width={30} />
            <span className="text-xl font-bold">
              Fill
              <span className="italic bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Matic
              </span>
            </span>
          </a>
          <nav className="flex gap-6">
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
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="w-full py-20 md:py-32 bg-violet-50">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <Badge className="mb-6 bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100">
              Chrome Extension
            </Badge>
            <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl lg:text-7xl max-w-4xl mx-auto leading-[1.1]">
              Stop filling test forms{" "}
              <span className="bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                by hand
              </span>
            </h1>
            <p className="mt-6 mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
              FillMatic detects every field on a form and fills it with realistic
              data in milliseconds. Built for developers who test forms every
              single day.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-8"
              >
                <a href={STORE_URL} target="_blank" rel="noopener">
                  Add to Chrome — it's free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="ghost" size="lg" className="rounded-full">
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="w-full py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                Everything you need to test forms fast
              </h2>
              <p className="mt-4 text-muted-foreground md:text-lg max-w-2xl mx-auto">
                FillMatic goes beyond random text. It understands what each field
                expects and fills it correctly.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ Icon, title, description }) => (
                <Card
                  key={title}
                  className="border-border/60 hover:border-violet-200 hover:shadow-md transition-all duration-200"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-lg bg-violet-50 p-2 shrink-0">
                        <Icon className="h-5 w-5 text-violet-600" />
                      </div>
                      <h3 className="font-semibold text-base">{title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="w-full py-20 md:py-28 bg-violet-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                From install to filled in 60 seconds
              </h2>
            </div>
            <div className="grid gap-10 md:grid-cols-3 max-w-4xl mx-auto">
              {STEPS.map(({ number, title, description }) => (
                <div key={number} className="flex flex-col items-center text-center">
                  <span className="text-7xl font-black text-violet-200 mb-4 leading-none select-none">
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
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-8"
              >
                <a href={STORE_URL} target="_blank" rel="noopener">
                  Get FillMatic free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Feedback ── */}
        <section id="feedback" className="w-full py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6 max-w-lg">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Share your feedback
              </h2>
              <p className="mt-4 text-muted-foreground">
                Got a feature idea or something not working? Let me know.
              </p>
            </div>
            <Card>
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
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Fill<span className="italic">M</span>atic. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <a
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              href="/privacy"
            >
              Privacy
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
