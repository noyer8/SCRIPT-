import Sidebar from './sidebar/Sidebar';
import Header from './Header';
import FlowEditor from './editor/FlowEditor';
import PropertiesPanel from './editor/PropertiesPanel';
import Player from './player/Player';

export default function ScriptFlowPage() {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 flex overflow-hidden">
          <FlowEditor />
          <PropertiesPanel />
        </div>
      </div>

      <Player />
    </div>
  );
}
