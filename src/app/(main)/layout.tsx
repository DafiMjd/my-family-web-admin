import { Sidebar } from '@/app/components/Sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-[#F5F5F5]">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
