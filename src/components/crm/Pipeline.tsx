import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCrmStore } from '../../store/useCrmStore';
import type { Contact } from '../../store/useCrmStore';
import ContactCard from './ContactCard';
import AddContactModal from './AddContactModal';
import { isToday, isPast, isFuture } from '../../utils/dateUtils';

export default function Pipeline() {
  const { stages, contacts, moveContact, showOnlyCallable } = useCrmStore();
  const [addToStage, setAddToStage] = useState<string | null>(null);
  const [draggedContact, setDraggedContact] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  const getStageContacts = (stageId: string, stageIndex: number): Contact[] => {
    let filtered = contacts.filter((c) => c.stageId === stageId);

    // "À appeler" mode: hide already called today + future callbacks + non-first-3-columns
    if (showOnlyCallable) {
      const todayStr = new Date().toISOString().split('T')[0];
      const hasCallbackToday = (c: Contact) => c.callbackDate && isToday(c.callbackDate);

      filtered = filtered.filter((c) => {
        // Hide if called today
        if (c.lastCalledDate === todayStr) return false;
        // Hide if callback is in the future (but keep today and overdue)
        if (c.callbackDate && isFuture(c.callbackDate)) return false;
        // Hide prospects not in the first 3 columns, unless they have a callback today
        if (stageIndex >= 3 && !hasCallbackToday(c)) return false;
        return true;
      });
    }

    // Columns 2 and 3 (index 1,2): callback today/overdue on top, future callback at bottom
    if (stageIndex === 1 || stageIndex === 2) {
      return filtered.sort((a, b) => {
        const aHasCb = !!a.callbackDate;
        const bHasCb = !!b.callbackDate;
        const aTodayOrPast = aHasCb && (isToday(a.callbackDate) || isPast(a.callbackDate));
        const bTodayOrPast = bHasCb && (isToday(b.callbackDate) || isPast(b.callbackDate));
        const aFuture = aHasCb && !aTodayOrPast;
        const bFuture = bHasCb && !bTodayOrPast;

        // Today/overdue first
        if (aTodayOrPast && !bTodayOrPast) return -1;
        if (!aTodayOrPast && bTodayOrPast) return 1;
        // Future callback last
        if (aFuture && !bFuture) return 1;
        if (!aFuture && bFuture) return -1;
        // Same group: sort by updatedAt
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }

    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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
          {sortedStages.map((stage, stageIdx) => {
            const stageContacts = getStageContacts(stage.id, stageIdx);
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
                      <ContactCard contact={contact} stageName={stage.name} stageIndex={stageIdx} />
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
