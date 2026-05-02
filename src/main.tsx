import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CsvLibraryProvider } from "./context/CsvLibraryContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <CsvLibraryProvider>
      <App />
    </CsvLibraryProvider>
  </React.StrictMode>,
);
