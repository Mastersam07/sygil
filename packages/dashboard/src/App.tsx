import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Overview from "./pages/Overview";
import Sessions from "./pages/Sessions";
import SessionDetail from "./pages/SessionDetail";
import Analytics from "./pages/Analytics";
import Projects from "./pages/Projects";
import Activity from "./pages/Activity";
import History from "./pages/History";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/sessions/:id" element={<SessionDetail />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Layout>
  );
}
