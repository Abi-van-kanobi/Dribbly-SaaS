"use client";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="mkt-dialog-backdrop" onClick={onClose}>
      <div className="mkt-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="mkt-dialog-title">{title}</div>
        {children}
      </div>
    </div>
  );
}
