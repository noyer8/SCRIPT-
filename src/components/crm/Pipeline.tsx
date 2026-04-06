import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCrmStore } from '../../store/useCrmStore';
import type { Contact } from '../../store/useCrmStore';
import ContactCard from './ContactCard';
import AddContactModal from './AddContactModal';

export default function Pipeline() {
  const { stages, contacts, moveContact } = useCrmStore();
  const [addToStage, setAddToStage] = useState<string | null>(null);
  const [draggedContact, setDraggedContact] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  const getStageContacts = (stageId: string): Contact[] => {
    return contacts
      .filter((c) => c.stageId === stageId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  };

  const handleDragStart = (contactId: string) => {
    setDraggedContact(contactId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (stageId: string) => {
    if (draggedContact) {
      moveContact(draggedContact, stageId);
    }
    setDraggedContact(null);
    setDragOverStage(null);
  };

  return (
    <>
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-max">
          {sortedStages.map((stage) => {
            const stageContacts = getStageContacts(stage.id);
            const isDragOver = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                className={`w-72 flex flex-col bg-gray-50 rounded-xl border-2 transition-colors ${
                  isDragOver ? 'border-blue-400 bg-blue-50' : 'border-transparent'
                }`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(stage.id)}
              >
                {/* Stage header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-semibold text-sm text-gray-800">{stage.name}</h3>
                    <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                      {stageContacts.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setAddToStage(stage.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {stageContacts.map((contact) => (
                    <div
                      key={contact.id}
                      draggable
                      onDragStart={() => handleDragStart(contact.id)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <ContactCard contact={contact} isFirstStage={stage.id === sortedStages[0]?.id} stageName={stage.name} />
                    </div>
                  ))}
                  {stageContacts.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Aucun contact
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {addToStage && (
        <AddContactModal
          defaultStageId={addToStage}
          onClose={() => setAddToStage(null)}
        />
      )}
    </>
  );
}
