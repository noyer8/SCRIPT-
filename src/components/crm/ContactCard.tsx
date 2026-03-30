import { Building2, Phone, Mail, Pin, Globe, Check, CalendarClock, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useCrmStore } from '../../store/useCrmStore';
import type { Contact } from '../../store/useCrmStore';
import { openProspectPopout } from '../../utils/openProspectPopout';

function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
}

function isPast(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + 'T00:00:00');
  return date < today;
}

function formatDateFr(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export default function ContactCard({ contact, isFirstStage = false, isCallbackStage = false }: { contact: Contact; isFirstStage?: boolean; isCallbackStage?: boolean }) {
  const { setSelectedContact, setPinnedContact, pinnedContactId, stages, updateContact, deleteContact } = useCrmStore();
  const [phoneCopied, setPhoneCopied] = useState(false);

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pinnedContactId === contact.id) {
      setPinnedContact(null);
    } else {
      setPinnedContact(contact.id);
      const stage = stages.find((s) => s.id === contact.stageId);
      openProspectPopout(contact, stage);
    }
  };

  const callbackIsToday = isToday(contact.callbackDate);
  const callbackIsPast = isPast(contact.callbackDate) && !callbackIsToday;

  return (
    <div
      onClick={() => setSelectedContact(contact.id)}
      className={`group bg-white rounded-lg border p-3 hover:shadow-md transition-all cursor-pointer ${
        callbackIsToday
          ? 'border-yellow-400 bg-yellow-50 shadow-[0_0_12px_rgba(250,204,21,0.4)]'
          : callbackIsPast
            ? 'border-red-300 bg-red-50'
            : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="font-medium text-sm text-gray-900">
          {contact.firstName} {contact.lastName}
        </div>
        <button
          onClick={handlePin}
          className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${
            pinnedContactId === contact.id
              ? 'opacity-100 bg-amber-100 text-amber-600'
              : 'hover:bg-amber-50 text-amber-500'
          }`}
          title="Épingler en overlay"
        >
          <Pin className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Missed calls tracker - only in first stage */}
      {isFirstStage && contact.phone && (
        <div className="flex items-center gap-1 mb-2" onClick={(e) => e.stopPropagation()}>
          <Phone className="w-3 h-3 text-gray-400 mr-0.5" />
          {[0, 1, 2].map((i) => {
            const current = contact.missedCalls || 0;
            const isFilled = i < current;
            return (
              <button
                key={i}
                onClick={() => {
                  if (isFilled && i === current - 1) {
                    updateContact(contact.id, { missedCalls: i });
                  } else if (!isFilled) {
                    const newCount = i + 1;
                    if (newCount >= 3) {
                      if (confirm(`${contact.firstName} ${contact.lastName} — 3 appels sans réponse. Supprimer ce prospect ?`)) {
                        deleteContact(contact.id);
                      }
                    } else {
                      updateContact(contact.id, { missedCalls: newCount });
                    }
                  }
                }}
                className="transition-all"
                title={isFilled ? 'Cliquer pour décocher' : `Appel ${i + 1} sans réponse`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                    isFilled
                      ? 'bg-red-400 border-red-400'
                      : 'border-gray-300 hover:border-red-300'
                  }`}
                />
              </button>
            );
          })}
          <span className="text-[10px] text-gray-400 ml-1">{contact.missedCalls || 0}/3</span>
        </div>
      )}

      {contact.company && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <Building2 className="w-3 h-3" />
          <span>{contact.company}</span>
        </div>
      )}
      {contact.phone && (
        <div
          className="flex items-center gap-1.5 text-xs text-gray-500 mb-1 cursor-pointer hover:text-green-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(contact.phone);
            setPhoneCopied(true);
            setTimeout(() => setPhoneCopied(false), 1500);
          }}
          title="Cliquer pour copier"
        >
          {phoneCopied ? <Check className="w-3 h-3 text-green-500" /> : <Phone className="w-3 h-3" />}
          <span>{phoneCopied ? 'Copié !' : contact.phone}</span>
        </div>
      )}
      {contact.email && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <Mail className="w-3 h-3" />
          <span className="truncate">{contact.email}</span>
        </div>
      )}
      {contact.facebookUrl && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <Globe className="w-3 h-3 text-blue-500" />
          <a
            href={contact.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-blue-500 hover:underline truncate"
          >
            {contact.facebookUrl.replace(/^https?:\/\/(www\.)?/, '')}
          </a>
        </div>
      )}

      {/* Callback section - only in A RECONTACTER stage */}
      {isCallbackStage && (
        <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            <CalendarClock className={`w-3 h-3 flex-shrink-0 ${callbackIsToday ? 'text-yellow-600' : callbackIsPast ? 'text-red-500' : 'text-gray-400'}`} />
            <input
              type="date"
              value={contact.callbackDate || ''}
              onChange={(e) => updateContact(contact.id, { callbackDate: e.target.value })}
              className={`text-xs px-1.5 py-0.5 border rounded w-[120px] ${
                callbackIsToday
                  ? 'border-yellow-400 bg-yellow-100 font-semibold text-yellow-800'
                  : callbackIsPast
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-gray-200'
              }`}
            />
            <input
              type="time"
              value={contact.callbackTime || ''}
              onChange={(e) => updateContact(contact.id, { callbackTime: e.target.value })}
              className="text-xs px-1.5 py-0.5 border border-gray-200 rounded w-[80px]"
            />
          </div>
          {(contact.callbackNote || callbackIsToday || callbackIsPast) && (
            <div className="flex items-start gap-1.5">
              <MessageSquare className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
              <textarea
                value={contact.callbackNote || ''}
                onChange={(e) => updateContact(contact.id, { callbackNote: e.target.value })}
                placeholder="Notes de l'appel..."
                rows={2}
                className="text-xs px-1.5 py-0.5 border border-gray-200 rounded w-full resize-none"
              />
            </div>
          )}
          {!contact.callbackNote && !callbackIsToday && !callbackIsPast && (
            <button
              onClick={() => updateContact(contact.id, { callbackNote: ' ' })}
              className="text-[10px] text-gray-400 hover:text-gray-600"
            >
              + Ajouter une note
            </button>
          )}
          {contact.callbackDate && (
            <div className="text-[10px] text-gray-400">
              {callbackIsToday && <span className="font-bold text-yellow-700">Rappeler aujourd'hui{contact.callbackTime ? ` a ${contact.callbackTime}` : ''}</span>}
              {callbackIsPast && <span className="font-bold text-red-600">En retard ! ({formatDateFr(contact.callbackDate)})</span>}
              {!callbackIsToday && !callbackIsPast && <span>Rappel le {formatDateFr(contact.callbackDate)}{contact.callbackTime ? ` a ${contact.callbackTime}` : ''}</span>}
            </div>
          )}
        </div>
      )}

      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {contact.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
