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
import TaskTracker from "./pages/TaskTracker";
import Memory from "./pages/Memory";
import History from "./pages/History";
import Diagnostics from "./pages/Diagnostics";
import ConfigViewer from "./pages/ConfigViewer";
import Extensions from "./pages/Extensions";
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
        <Route path="/tasks" element={<TaskTracker />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/history" element={<History />} />
        <Route path="/diagnostics" element={<Diagnostics />} />
        <Route path="/config" element={<ConfigViewer />} />
        <Route path="/extensions" element={<Extensions />} />
        <Route path="/export" element={<ExportImport />} />
      </Routes>
    </Layout>
  );
}
