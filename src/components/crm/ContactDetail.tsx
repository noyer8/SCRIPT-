import { useState } from 'react';
import {
  X,
  Trash2,
  Save,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  CheckSquare,
  Plus,
  Tag,
  Building2,
  Check,
  Globe,
  Pin,
  CalendarClock,
} from 'lucide-react';
import { useCrmStore } from '../../store/useCrmStore';
import type { Activity } from '../../store/useCrmStore';
import { openProspectPopout } from '../../utils/openProspectPopout';

const ACTIVITY_ICONS: Record<Activity['type'], React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: MessageSquare,
  task: CheckSquare,
};

const ACTIVITY_LABELS: Record<Activity['type'], string> = {
  call: 'Appel',
  email: 'Email',
  meeting: 'Rendez-vous',
  note: 'Note',
  task: 'Tâche',
};

export default function ContactDetail() {
  const {
    contacts,
    selectedContactId,
    setSelectedContact,
    updateContact,
    deleteContact,
    stages,
    customFields,
    addActivity,
    updateActivity,
    getContactActivities,
    addTagToContact,
    removeTagFromContact,
    setPinnedContact,
    pinnedContactId,
  } = useCrmStore();

  const contact = contacts.find((c) => c.id === selectedContactId);
  const [activeTab, setActiveTab] = useState<'info' | 'activity' | 'custom'>('info');
  const [newTag, setNewTag] = useState('');
  const [newActivity, setNewActivity] = useState({ type: 'note' as Activity['type'], content: '' });
  const [editMode, setEditMode] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', company: '', email: '', phone: '', facebookUrl: '', civilite: '', site: '', logo: '', ficheBien: '', img1: '', img2: '', img3: '', img4: '', img5: '', stageId: '' });

  if (!contact) return null;

  const activities = getContactActivities(contact.id);
  const stage = stages.find((s) => s.id === contact.stageId);

  const startEdit = () => {
    setEditForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      company: contact.company,
      email: contact.email,
      phone: contact.phone,
      facebookUrl: contact.facebookUrl,
      civilite: contact.civilite || '',
      site: contact.site || '',
      logo: contact.logo || '',
      ficheBien: contact.ficheBien || '',
      img1: contact.img1 || '',
      img2: contact.img2 || '',
      img3: contact.img3 || '',
      img4: contact.img4 || '',
      img5: contact.img5 || '',
      stageId: contact.stageId,
    });
    setEditMode(true);
  };

  const saveEdit = () => {
    updateContact(contact.id, editForm);
    setEditMode(false);
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTagToContact(contact.id, newTag.trim());
      setNewTag('');
    }
  };

  const handleAddActivity = () => {
    if (newActivity.content.trim()) {
      addActivity({
        contactId: contact.id,
        type: newActivity.type,
        content: newActivity.content,
        date: new Date().toISOString(),
      });
      setNewActivity({ type: 'note', content: '' });
    }
  };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    updateContact(contact.id, {
      customFields: { ...contact.customFields, [fieldId]: value },
    });
  };

  const handleDelete = () => {
    if (confirm(`Supprimer ${contact.firstName} ${contact.lastName} ?`)) {
      deleteContact(contact.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            {editMode ? (
              <div className="flex gap-2">
                <input
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="px-2 py-1 border rounded text-sm font-semibold"
                  placeholder="Prénom"
                />
                <input
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="px-2 py-1 border rounded text-sm font-semibold"
                  placeholder="Nom"
                />
              </div>
            ) : (
              <h2 className="font-bold text-lg text-gray-900">
                {contact.firstName} {contact.lastName}
              </h2>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: stage?.color }}
              >
                {stage?.name}
              </span>
              <span className="text-xs text-gray-400">
                Créé le {new Date(contact.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (pinnedContactId === contact.id) {
                  setPinnedContact(null);
                } else {
                  setPinnedContact(contact.id);
                  const s = stages.find((st) => st.id === contact.stageId);
                  openProspectPopout(contact, s);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                pinnedContactId === contact.id
                  ? 'text-amber-700 bg-amber-100'
                  : 'text-amber-600 hover:bg-amber-50'
              }`}
              title="Épingler en overlay"
            >
              <Pin className="w-4 h-4" />
              {pinnedContactId === contact.id ? 'Désépingler' : 'Épingler'}
            </button>
            {editMode ? (
              <button onClick={saveEdit} className="p-2 hover:bg-green-50 rounded-lg text-green-600">
                <Save className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={startEdit} className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">
                Modifier
              </button>
            )}
            <button onClick={() => setSelectedContact(null)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          {(['info', 'activity', 'custom'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'info' ? 'Infos' : tab === 'activity' ? 'Activités' : 'Champs perso'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Contact info */}
              <div className="space-y-3">
                {editMode ? (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Entreprise</label>
                      <input
                        value={editForm.company}
                        onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Email</label>
                      <input
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Téléphone</label>
                      <input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Page Facebook</label>
                      <input
                        value={editForm.facebookUrl}
                        onChange={(e) => setEditForm({ ...editForm, facebookUrl: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Civilité</label>
                      <select
                        value={editForm.civilite}
                        onChange={(e) => setEditForm({ ...editForm, civilite: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                      >
                        <option value="">--</option>
                        <option value="M.">M.</option>
                        <option value="Mme">Mme</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Site web</label>
                      <input
                        value={editForm.site}
                        onChange={(e) => setEditForm({ ...editForm, site: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Logo (URL)</label>
                      <input
                        value={editForm.logo}
                        onChange={(e) => setEditForm({ ...editForm, logo: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Fiche bien (URL)</label>
                      <input
                        value={editForm.ficheBien}
                        onChange={(e) => setEditForm({ ...editForm, ficheBien: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">Images du bien (URLs)</label>
                      {([1, 2, 3, 4, 5] as const).map((n) => {
                        const key = `img${n}` as keyof typeof editForm;
                        return (
                          <input
                            key={n}
                            value={editForm[key]}
                            onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            placeholder={`Image ${n} — https://...`}
                          />
                        );
                      })}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Étape</label>
                      <select
                        value={editForm.stageId}
                        onChange={(e) => setEditForm({ ...editForm, stageId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                      >
                        {stages.sort((a, b) => a.order - b.order).map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    {contact.company && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{contact.company}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-green-50 transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(contact.phone);
                          setPhoneCopied(true);
                          setTimeout(() => setPhoneCopied(false), 1500);
                        }}
                        title="Cliquer pour copier"
                      >
                        {phoneCopied ? <Check className="w-4 h-4 text-green-500" /> : <Phone className="w-4 h-4 text-gray-400" />}
                        <span className="text-sm">{phoneCopied ? 'Copié !' : contact.phone}</span>
                      </div>
                    )}
                    {contact.facebookUrl && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Globe className="w-4 h-4 text-blue-500" />
                        <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">
                          {contact.facebookUrl}
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Callback / Rappel */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Rappel</h3>
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="date"
                      value={contact.callbackDate || ''}
                      onChange={(e) => updateContact(contact.id, { callbackDate: e.target.value })}
                      className="px-3 py-1.5 border rounded-lg text-sm flex-1"
                    />
                    <input
                      type="time"
                      value={contact.callbackTime || ''}
                      onChange={(e) => updateContact(contact.id, { callbackTime: e.target.value })}
                      className="px-3 py-1.5 border rounded-lg text-sm w-28"
                    />
                    {(contact.callbackDate || contact.callbackTime || contact.callbackNote) && (
                      <button
                        onClick={() => updateContact(contact.id, { callbackDate: '', callbackTime: '', callbackNote: '' })}
                        className="p-1 text-gray-300 hover:text-red-400"
                        title="Supprimer le rappel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-2 flex-shrink-0" />
                    <textarea
                      value={contact.callbackNote || ''}
                      onChange={(e) => updateContact(contact.id, { callbackNote: e.target.value })}
                      placeholder="Notes de l'appel..."
                      rows={2}
                      className="flex-1 px-3 py-1.5 border rounded-lg text-sm resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {contact.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button
                        onClick={() => removeTagFromContact(contact.id, tag)}
                        className="hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                    placeholder="Nouveau tag..."
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* Add activity */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex gap-2 mb-3">
                  {(Object.keys(ACTIVITY_LABELS) as Activity['type'][]).map((type) => {
                    const Icon = ACTIVITY_ICONS[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setNewActivity({ ...newActivity, type })}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                          newActivity.type === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {ACTIVITY_LABELS[type]}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={newActivity.content}
                    onChange={(e) => setNewActivity({ ...newActivity, content: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm resize-none"
                    rows={2}
                    placeholder="Détails de l'activité..."
                  />
                  <button
                    onClick={handleAddActivity}
                    className="self-end px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Activity list */}
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">Aucune activité</p>
                ) : (
                  activities.map((activity) => {
                    const Icon = ACTIVITY_ICONS[activity.type];
                    return (
                      <div
                        key={activity.id}
                        className="flex gap-3 p-3 bg-white border rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-700">
                              {ACTIVITY_LABELS[activity.type]}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(activity.date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {activity.content}
                          </p>
                        </div>
                        {activity.type === 'task' && (
                          <button
                            onClick={() => updateActivity(activity.id, { done: !activity.done })}
                            className={`p-1 rounded ${
                              activity.done ? 'text-green-600' : 'text-gray-300 hover:text-gray-500'
                            }`}
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-4">
              {customFields.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">
                  Aucun champ personnalisé. Configurez-les dans les paramètres.
                </p>
              ) : (
                customFields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.name}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={contact.customFields[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="">-- Sélectionner --</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={contact.customFields[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                        rows={3}
                      />
                    ) : field.type === 'checkbox' ? (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={contact.customFields[field.id] === 'true'}
                          onChange={(e) => handleCustomFieldChange(field.id, String(e.target.checked))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-600">Oui</span>
                      </label>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                        value={contact.customFields[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer ce contact
          </button>
        </div>
      </div>
    </div>
  );
}
