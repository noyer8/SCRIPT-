import { HashRouter, Routes, Route } from 'react-router-dom';
import ScriptFlowPage from './components/ScriptFlowPage';
import CrmPage from './components/crm/CrmPage';
import ProspectOverlay from './components/ProspectOverlay';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ScriptFlowPage />} />
        <Route path="/crm" element={<CrmPage />} />
      </Routes>
      <ProspectOverlay />
    </HashRouter>
  );
}

export default App;
