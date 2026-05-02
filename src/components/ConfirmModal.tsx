import type { ReactNode } from "react";
import Modal from "./Modal";

export type ConfirmModalProps = {
  open: boolean;
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Called when the user confirms (primary action). */
  onConfirm: () => void;
  /** Called when the user cancels or closes via backdrop / Escape. */
  onCancel: () => void;
  confirmVariant?: "primary" | "danger";
};

export default function ConfirmModal({
  open,
  title = "Confirm",
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmVariant = "primary",
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="confirm-modal__message">{message}</div>
      <div className="confirm-modal__actions">
        <button type="button" className="btn" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={
            confirmVariant === "danger" ? "btn btn--danger" : "btn btn--primary"
          }
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
