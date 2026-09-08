"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export function Modal({
  className = "",
  title,
  onClose,
  children,
}: {
  className?: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`ovr-modal ${className}`}
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <header>
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
