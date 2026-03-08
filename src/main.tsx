import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { startKeepAlive } from "./lib/keep-alive";

// Boot the app
createRoot(document.getElementById("root")!).render(<App />);

// Keep backend server awake — ping every 4 min
startKeepAlive();
