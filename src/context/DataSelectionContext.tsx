import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type DataSelectionContextValue = {
  selectedFileName: string | null;
  setSelectedFileName: (fileName: string | null) => void;
};

const DataSelectionContext = createContext<DataSelectionContextValue | null>(
  null,
);

export function DataSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const value = useMemo(
    (): DataSelectionContextValue => ({
      selectedFileName,
      setSelectedFileName,
    }),
    [selectedFileName],
  );
  return (
    <DataSelectionContext.Provider value={value}>
      {children}
    </DataSelectionContext.Provider>
  );
}

export function useDataSelection(): DataSelectionContextValue {
  const ctx = useContext(DataSelectionContext);
  if (!ctx) {
    throw new Error("useDataSelection must be used within DataSelectionProvider");
  }
  return ctx;
}
