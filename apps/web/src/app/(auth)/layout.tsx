import Link from "next/link";
import { Shield } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold text-neutral-900">
            Permits on the Go
          </span>
        </Link>
      </div>
      {children}
    </div>
  );
}
