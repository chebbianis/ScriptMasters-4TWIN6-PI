import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./protected.route";
import AuthRoute from "./auth.route";
import {
  authenticationRoutePaths,
  baseRoutePaths,
  protectedRoutePaths,
} from "./common/routes";
import AppLayout from "@/layout/app.layout";
import BaseLayout from "@/layout/base.layout";
import NotFound from "@/page/errors/NotFound";

function AppRoutes() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route element={<BaseLayout />}>
        {baseRoutePaths.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Route>

      {/* Routes d'authentification */}
      <Route path="/" element={<AuthRoute />}>
        <Route element={<BaseLayout />}>
          {authenticationRoutePaths.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={route.element}
            />
          ))}
        </Route>
      </Route>

      {/* Routes protégées */}
      <Route path="/" element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {protectedRoutePaths.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={route.element}
            />
          ))}
        </Route>
      </Route>

      {/* Route 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;