import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { NuqsAdapter } from "nuqs/adapters/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/auth-provider";

import "./index.css";
import App from "./App.tsx";
import QueryProvider from "./context/query-provider.tsx";
import { Toaster } from "./components/ui/toaster.tsx";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <NuqsAdapter>
            <App />
            <Toaster />
          </NuqsAdapter>
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  </StrictMode>
);
