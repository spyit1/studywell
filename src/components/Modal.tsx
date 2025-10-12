// Modal.tsx（例）
export default function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-[min(640px,92vw)] max-h-[85vh] overflow-auto rounded-2xl p-4 shadow-2xl
          bg-white text-gray-900 border border-gray-200
          dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700
        "
      >
        {title ? (
          <div className="mb-3 flex items-start justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              className="rounded-md bg-gray-100 hover:bg-gray-200 px-3 py-1 text-sm
                         dark:bg-gray-800 dark:hover:bg-gray-700"
              onClick={onClose}
            >
              閉じる
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
