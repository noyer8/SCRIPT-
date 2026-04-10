import { Building2, Phone, Mail, Pin, Globe, Check, CalendarClock } from 'lucide-react';
import { useState } from 'react';
import { useCrmStore } from '../../store/useCrmStore';
import type { Contact } from '../../store/useCrmStore';
import { openProspectPopout } from '../../utils/openProspectPopout';
import { isToday, isPast, formatDateFr } from '../../utils/dateUtils';
import { getValidSlots } from '../../utils/callSlots';

function getFermetureColor(fermeture: string): string {
  switch (fermeture) {
    case '17': return '#000000';
    case '18': return '#ef4444';
    case '18:30': return '#eab308';
    case '19': return '#22c55e';
    default: return '';
  }
}

function getMissedCallsMax(stageName: string): number {
  const name = stageName.toLowerCase();
  if (name.includes('gatekeeper')) return 2;
  if (name.includes('froid')) return 3;
  return 0;
}

export default function ContactCard({ contact, stageName = '', stageIndex = -1, showStageBadge = false }: { contact: Contact; isFirstStage?: boolean; stageName?: string; stageIndex?: number; showStageBadge?: boolean }) {
  const { setSelectedContact, setPinnedContact, pinnedContactId, stages, updateContact, deleteContact } = useCrmStore();
  const [phoneCopied, setPhoneCopied] = useState(false);
  const stageColor = stages.find((s) => s.id === contact.stageId)?.color || '#6b7280';

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
  const callbackIsFuture = !!contact.callbackDate && !callbackIsToday && !callbackIsPast;
  const showRedOutline = stageIndex === 1 && callbackIsFuture;

  return (
    <div
      onClick={() => setSelectedContact(contact.id)}
      className={`group bg-white rounded-lg border p-3 hover:shadow-md transition-all cursor-pointer ${
        callbackIsToday
          ? 'border-yellow-400 bg-yellow-50 shadow-[0_0_12px_rgba(250,204,21,0.4)]'
          : callbackIsPast
            ? 'border-red-300 bg-red-50'
            : showRedOutline
              ? 'border-red-200'
              : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {showStageBadge && stageName && (
        <span
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white uppercase inline-block mb-1.5"
          style={{ backgroundColor: stageColor }}
        >
          {stageName}
        </span>
      )}
      <div className="flex items-start justify-between mb-2">
        <div className="font-medium text-sm text-gray-900">
          {contact.firstName} {contact.lastName}
        </div>
        <div className="flex items-center gap-1">
          {stageIndex >= 0 && stageIndex < 3 && (contact.zone || contact.fermeture) && (
            <div className="flex items-center gap-1">
              {contact.fermeture && (
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getFermetureColor(contact.fermeture) }}
                  title={`Horaire ${contact.fermeture}h`}
                />
              )}
              {contact.zone && (
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 rounded px-1 py-0.5 leading-none">
                  {contact.zone}
                </span>
              )}
            </div>
          )}
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
      </div>

      {/* Missed calls tracker */}
      {(() => {
        const maxDots = getMissedCallsMax(stageName);
        if (maxDots === 0 || !contact.phone) return null;
        return (
          <div className="relative flex items-center gap-1 mb-2" onClick={(e) => e.stopPropagation()}>
            <Phone className="w-3 h-3 text-gray-400 mr-0.5" />
            {Array.from({ length: maxDots }, (_, i) => {
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
                      if (newCount >= maxDots) {
                        if (confirm(`${contact.firstName} ${contact.lastName} — ${maxDots} appels sans réponse. Supprimer ce prospect ?`)) {
                          deleteContact(contact.id);
                        }
                      } else {
                        // Move to a different valid slot
                        const validSlots = getValidSlots(contact.fermeture);
                        const otherSlots = validSlots.filter((s) => s.start !== contact.callbackTime);
                        const nextSlot = otherSlots.length > 0 ? otherSlots[Math.floor(Math.random() * otherSlots.length)] : null;
                        updateContact(contact.id, {
                          missedCalls: newCount,
                          ...(nextSlot ? { callbackTime: nextSlot.start } : {}),
                        });
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
            <span className="text-[10px] text-gray-400 ml-1">{contact.missedCalls || 0}/{maxDots}</span>
          </div>
        );
      })()}

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

      {/* Callback info */}
      {contact.callbackDate && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-[10px]">
            <CalendarClock className={`w-3 h-3 flex-shrink-0 ${callbackIsToday ? 'text-yellow-600' : callbackIsPast ? 'text-red-500' : 'text-gray-400'}`} />
            {callbackIsToday && <span className="font-bold text-yellow-700">Rappeler aujourd'hui{contact.callbackTime ? ` à ${contact.callbackTime}` : ''}</span>}
            {callbackIsPast && <span className="font-bold text-red-600">En retard ! ({formatDateFr(contact.callbackDate)})</span>}
            {!callbackIsToday && !callbackIsPast && <span className="text-gray-400">Rappel le {formatDateFr(contact.callbackDate)}{contact.callbackTime ? ` à ${contact.callbackTime}` : ''}</span>}
          </div>
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
