interface PageHeaderProps {
  title: string;
  rightContent?: React.ReactNode;
}

export function PageHeader({ title, rightContent }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E0E0E0] shadow-sm">
      <span className="text-base font-semibold text-[#242424]">{title}</span>
      {rightContent ? <div className="flex items-center gap-2">{rightContent}</div> : null}
    </header>
  );
}
