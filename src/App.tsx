import {
  createHashRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import { CsvDataProvider } from "./context/CsvDataContext";
import { CsvLibraryProvider } from "./context/CsvLibraryContext";
import { ThemeProvider } from "./context/ThemeContext";
import Header from "./components/Header";
import DataPage from "./pages/data";
import FilesPage from "./pages/files";
import StatsPage from "./pages/stats";

function RootLayout() {
  return (
    <div className="app-shell">
      <Header />
      <div className="app-shell__main">
        <Outlet />
      </div>
    </div>
  );
}

const router = createHashRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/files" replace /> },
      { path: "files", element: <FilesPage /> },
      { path: "data", element: <DataPage /> },
      { path: "stats", element: <StatsPage /> },
    ],
  },
]);

export default function App() {
  return (
    <ThemeProvider>
      <CsvLibraryProvider>
        <CsvDataProvider>
          <div className="app-mount">
            <RouterProvider router={router} />
          </div>
        </CsvDataProvider>
      </CsvLibraryProvider>
    </ThemeProvider>
  );
}
