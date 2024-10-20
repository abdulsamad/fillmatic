import { Zap, Code, Clock, type LucideProps } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Textarea } from "@/components/ui/textarea";
import AnimatedGradientText from "@/components/ui/animated-gradient-text";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <div className="container mx-auto flex justify-between items-center">
          <a className="flex items-center justify-center" href="#">
            <img
              src="icon192.png"
              alt="FillMatic Logo"
              width={35}
              className=""
            />
            <h1 className="text-3xl ml-2">
              <span className="-skew-x-2">Fill</span>
              <span className="text-gradient italic">Matic</span>
            </h1>
            <AnimatedGradientText className="h-4 ml-2">
              <span
                className={cn(
                  `inline animate-gradient bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent`,
                )}
              >
                Beta
              </span>
            </AnimatedGradientText>
          </a>
          <nav className="flex gap-4 sm:gap-6">
            <a
              className="text-sm font-medium hover:text-purple-600 transition-colors"
              href="#features"
            >
              Features
            </a>
            <a
              className="text-sm font-medium hover:text-purple-600 transition-colors"
              href="#feedback"
            >
              Feedback
            </a>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-purple-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                  Automate Form Filling for Developers
                </h1>
                <p className="mx-auto max-w-[700px] md:text-xl lg:text-2xl">
                  Save time and boost productivity with Fill
                  <span className="italic">M</span>atic. The smart Chrome
                  extension for developers to handle repetitive form tasks.
                </p>
              </div>
              <div className="pt-4">
                <div className="flex justify-center">
                  <Button variant="link" size="lg" asChild>
                    <a
                      href="https://chromewebstore.google.com/detail/fillmatic/mpkjmebmnkhpfomlopbehcpmgmfndfje"
                      target="_blank"
                      rel="noopener"
                    >
                      <img
                        src="webstore.png"
                        alt="Available in the Chrome Web Store"
                        className="rounded-xl"
                        width={220}
                      />
                      <span className="text-sm font-medium sr-only">
                        Install from Chrome Web Store
                      </span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-8 md:py-20 lg:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-12">
              Why Developers Choose Fill
              <span className="italic">M</span>atic
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                Icon={Zap}
                title="Lightning Fast"
                description="Automate form filling in milliseconds. Focus on coding, not data entry."
              />
              <FeatureCard
                Icon={Code}
                title="Developer-Friendly"
                description="Easily customizable with JavaScript. Integrate with your existing workflows."
              />
              <FeatureCard
                Icon={Clock}
                title="Time-Saving Patterns"
                description="Create and save form-filling patterns. Reuse them across multiple projects."
              />
            </div>
          </div>
        </section>
        <section
          id="feedback"
          className="w-full py-12 md:py-24 lg:py-32 bg-purple-50"
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center max-w-2xl mx-auto">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-10">
                  Help Shape Fill
                  <span className="italic">M</span>atic
                </h2>
                <p className="text-gray-500 md:text-xl">
                  Your input drives our development. Share your ideas and
                  feature requests.
                </p>
              </div>
              <Card className="w-full p-4">
                <CardContent className="pt-6">
                  <form
                    action="https://airform.io/hello@abdulsamad.dev"
                    method="POST"
                    className="flex flex-col text-left space-y-4"
                  >
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Name
                      </label>
                      <Input
                        id="name"
                        type="text"
                        name="Name"
                        placeholder="Your Name"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        name="Email"
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="feedback"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Feedback
                      </label>
                      <Textarea
                        id="feedback"
                        placeholder="Share your thoughts..."
                        name="Feeback"
                        rows={4}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Send Feedback
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:h-24">
            <p className="text-sm text-gray-500">
              © 2024 Fill
              <span className="italic">M</span>atic. All rights reserved.
            </p>
            <nav className="flex gap-4 sm:gap-6">
              <a
                className="text-sm hover:underline underline-offset-4"
                href="/terms"
              >
                Terms of Service
              </a>
              <a
                className="text-sm hover:underline underline-offset-4"
                href="/privacy"
              >
                Privacy
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  Icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  title: string;
  description: string;
}

const FeatureCard = ({ Icon, title, description }: FeatureCardProps) => {
  return (
    <Card className="flex flex-col items-center text-center">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">
          <div className="flex items-center gap-4 text-xl">
            <Icon className="h-12 w-12 text-purple-600" />
            {title}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-lg my-4">{description}</CardContent>
    </Card>
  );
};
