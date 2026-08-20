import { useEffect } from "react";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { AppLayout } from "./components/Layout";
import { HomePage } from "./pages/Home";
import { StudentDashboardPage } from "./pages/StudentDashboard";
import { AnalyticsPage } from "./pages/Analytics";
import { IssuesPage } from "./pages/Issues";
import { AboutPage } from "./pages/About";
import { NotFoundPage } from "./pages/NotFound";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/student/:rollNo" element={<StudentDashboardPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/issues" element={<IssuesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
}