export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 w-full flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
