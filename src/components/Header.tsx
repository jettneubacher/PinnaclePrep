import { Moon, Sun } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="app-header">
      <nav className="app-header__nav" aria-label="Main">
        <NavLink
          to="/files"
          className={({ isActive }) =>
            `app-header__link${isActive ? " app-header__link--active" : ""}`
          }
          end
        >
          Files
        </NavLink>
        <NavLink
          to="/data"
          className={({ isActive }) =>
            `app-header__link${isActive ? " app-header__link--active" : ""}`
          }
          end
        >
          Data
        </NavLink>
        <NavLink
          to="/stats"
          className={({ isActive }) =>
            `app-header__link${isActive ? " app-header__link--active" : ""}`
          }
          end
        >
          Stats
        </NavLink>
      </nav>
      <div className="app-header__actions">
        <button
          type="button"
          className="app-header__theme-btn"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? (
            <Moon size={20} strokeWidth={2} aria-hidden />
          ) : (
            <Sun size={20} strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>
    </header>
  );
}
