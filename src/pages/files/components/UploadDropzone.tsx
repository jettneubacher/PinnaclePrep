import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { isTauri } from "@tauri-apps/api/core";
import { useCsvLibrary } from "../../../context/CsvLibraryContext";

export default function UploadDropzone() {
  const { busy, uploadCsvFiles } = useCsvLibrary();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inTauri = isTauri();

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (!inTauri) return;
      try {
        await uploadCsvFiles(fileList);
      } catch {
        /* error in context */
      }
      if (inputRef.current) inputRef.current.value = "";
    },
    [inTauri, uploadCsvFiles],
  );

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      if (list && list.length > 0) void handleFiles(list);
    },
    [handleFiles],
  );

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inTauri && !busy) setIsDragging(true);
  }, [inTauri, busy]);

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (!inTauri || busy) return;
      const dropped = e.dataTransfer.files;
      if (dropped.length > 0) void handleFiles(dropped);
    },
    [inTauri, busy, handleFiles],
  );

  return (
    <div className="upload-dropzone-wrap">
      <div
        className={`upload-dropzone${isDragging ? " upload-dropzone--active" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        role="region"
        aria-label="Drop CSV files here"
      >
        <input
          ref={inputRef}
          type="file"
          className="upload-dropzone__input"
          accept=".csv,text/csv,application/csv"
          multiple
          disabled={!inTauri || busy}
          onChange={onInputChange}
        />
        <button
          type="button"
          className="btn btn--primary upload-dropzone__btn"
          disabled={!inTauri || busy}
          onClick={openFileDialog}
        >
          Select file(s)
        </button>
      </div>
      <p className="upload-dropzone__hint">CSV files only · drag and drop or use the button</p>
    </div>
  );
}
