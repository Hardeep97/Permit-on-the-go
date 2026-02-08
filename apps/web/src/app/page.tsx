import Link from "next/link";
import {
  ClipboardCheck,
  BrainCircuit,
  Store,
  ArrowRight,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: ClipboardCheck,
    title: "Permit Tracking",
    description:
      "Track every permit across all your properties in one centralized dashboard. Never miss a deadline or renewal date again.",
  },
  {
    icon: BrainCircuit,
    title: "AI Guidance",
    description:
      "Get intelligent recommendations on which permits you need, step-by-step filing instructions, and automated compliance checks.",
  },
  {
    icon: Store,
    title: "Vendor Marketplace",
    description:
      "Connect with licensed contractors, expeditors, and inspectors. Compare quotes and hire trusted professionals instantly.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-neutral-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-neutral-900">
                Permits on the Go
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-50/30" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              Permits on the Go
            </h1>
            <p className="mt-6 text-lg leading-8 text-neutral-600 sm:text-xl">
              The all-in-one permit management platform for landlords and
              property managers. Track permits, stay compliant, and connect with
              trusted vendors — all from a single dashboard.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-primary-700 transition-colors"
              >
                Get Started — $250/year
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-6 py-3 text-base font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition-colors"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Everything you need to manage permits
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              Stop juggling spreadsheets and missed deadlines. We handle the
              complexity so you can focus on your properties.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="relative rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-neutral-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary-600 px-8 py-16 shadow-xl sm:px-16 sm:py-24">
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to simplify permit management?
              </h2>
              <p className="mt-4 text-lg text-primary-100">
                Join hundreds of landlords who save time and stay compliant with
                Permits on the Go.
              </p>
              <div className="mt-8">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-primary-600 shadow-md hover:bg-primary-50 transition-colors"
                >
                  Get Started — $250/year
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary-600" />
              <span className="text-sm font-semibold text-neutral-900">
                Permits on the Go
              </span>
            </div>
            <p className="text-sm text-neutral-500">
              &copy; {new Date().getFullYear()} Permits on the Go. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
