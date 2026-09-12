export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="flex-1 flex flex-col bg-clay-deep/30 min-h-screen">{children}</div>;
}
