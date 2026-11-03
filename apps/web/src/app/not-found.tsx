import Link from "next/link";

const NotFoundPage = () => (
  <div className="grid min-h-screen place-items-center bg-paper px-6">
    <div className="max-w-md text-center">
      <p className="font-serif text-5xl">404</p>
      <p className="mt-3 text-sm text-ink-soft">That page is not part of the AgentVault workspace.</p>
      <Link href="/dashboard" className="mt-6 inline-block text-sm text-copper-deep underline">
        Back to the dashboard
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
