import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Overview from "./pages/Overview";
import Sessions from "./pages/Sessions";
import SessionDetail from "./pages/SessionDetail";
import Analytics from "./pages/Analytics";
import ToolAnalytics from "./pages/ToolAnalytics";
import Projects from "./pages/Projects";
import GitCorrelation from "./pages/GitCorrelation";
import ChangeTimeline from "./pages/ChangeTimeline";
import Activity from "./pages/Activity";
import History from "./pages/History";
import ExportImport from "./pages/ExportImport";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/sessions/:id" element={<SessionDetail />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/tools" element={<ToolAnalytics />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/git" element={<GitCorrelation />} />
        <Route path="/changes" element={<ChangeTimeline />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/history" element={<History />} />
        <Route path="/export" element={<ExportImport />} />
      </Routes>
    </Layout>
  );
}
