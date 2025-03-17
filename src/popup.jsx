import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./options.css";
import { Options } from "./Options.jsx";
import { Toaster } from "sonner";
import "sonner/dist/styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Toaster richColors />
    <Options mini={true} />
  </StrictMode>,
);
