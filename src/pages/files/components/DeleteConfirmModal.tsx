import ConfirmModal from "../../../components/ConfirmModal";
import type { CsvMetadata } from "../../../lib/csvStorage";

type Props = {
  meta: CsvMetadata | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmModal({ meta, onCancel, onConfirm }: Props) {
  return (
    <ConfirmModal
      open={meta !== null}
      title="Delete CSV?"
      message={
        meta ? (
          <>
            Remove <strong>{meta.displayName}</strong> from this app? The file will be
            removed from storage. This cannot be undone.
          </>
        ) : null
      }
      confirmLabel="Delete"
      cancelLabel="Cancel"
      confirmVariant="danger"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
