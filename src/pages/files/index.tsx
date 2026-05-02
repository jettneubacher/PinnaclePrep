import { isTauri } from "@tauri-apps/api/core";
import { useCsvLibrary } from "../../context/CsvLibraryContext";
import UploadDropzone from "./components/UploadDropzone";
import UploadedCsvsList from "./components/UploadedCsvsList";

export default function FilesPage() {
  const { error } = useCsvLibrary();
  const inTauri = isTauri();

  return (
    <div className="files-page">
      {!inTauri && (
        <p className="files-page__banner">
          Run with <code>bun run tauri dev</code> so CSVs can be saved to app data.
        </p>
      )}

      {error ? <p className="files-page__error">{error}</p> : null}

      <UploadDropzone />
      <UploadedCsvsList />
    </div>
  );
}
