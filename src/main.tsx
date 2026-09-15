import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Automatically recover from stale chunks after a new deployment
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(<App />);
