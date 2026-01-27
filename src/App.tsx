import Sidebar from './components/sidebar/Sidebar';
import Header from './components/Header';
import FlowEditor from './components/editor/FlowEditor';
import PropertiesPanel from './components/editor/PropertiesPanel';
import Player from './components/player/Player';

function App() {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Editor area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Flow editor */}
          <FlowEditor />

          {/* Properties panel */}
          <PropertiesPanel />
        </div>
      </div>

      {/* Player overlay */}
      <Player />
    </div>
  );
}

export default App;
