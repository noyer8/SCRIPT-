import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { scheduleAllUnscheduled, assignBestSlot } from '../utils/callSlots';

// --- Types ---

export type FieldType = 'text' | 'number' | 'email' | 'phone' | 'select' | 'date' | 'textarea' | 'url' | 'checkbox';

export interface CustomField {
  id: string;
  name: string;
  type: FieldType;
  options?: string[]; // for select
  required?: boolean;
  defaultValue?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
  missedCallsEnabled?: boolean;
  missedCallsMax?: number;
}

export interface Activity {
  id: string;
  contactId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  content: string;
  date: string;
  done?: boolean;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  facebookUrl: string;
  civilite: string;
  site: string;
  logo: string;
  ficheBien: string;
  img1: string;
  img2: string;
  img3: string;
  img4: string;
  img5: string;
  couleur1: string;
  couleur2: string;
  couleur3: string;
  zone: string;
  fermeture: string;
  stageId: string;
  customFields: Record<string, string>;
  tags: string[];
  missedCalls: number;
  lastCalledDate: string;
  callbackDate: string;
  callbackTime: string;
  callbackNote: string;
  createdAt: string;
  updatedAt: string;
}

// --- Default Data ---

const DEFAULT_STAGES: PipelineStage[] = [
  { id: 'new', name: 'Nouveau', color: '#6366f1', order: 0 },
  { id: 'contacted', name: 'Contacté', color: '#3b82f6', order: 1 },
  { id: 'qualified', name: 'Qualifié', color: '#8b5cf6', order: 2 },
  { id: 'proposal', name: 'Proposition', color: '#f59e0b', order: 3 },
  { id: 'negotiation', name: 'Négociation', color: '#f97316', order: 4 },
  { id: 'won', name: 'Gagné', color: '#22c55e', order: 5 },
  { id: 'lost', name: 'Perdu', color: '#ef4444', order: 6 },
];

const DEFAULT_FIELDS: CustomField[] = [
  { id: 'sector', name: 'Secteur', type: 'text' },
  { id: 'source', name: 'Source', type: 'select', options: ['Site web', 'Appel entrant', 'Recommandation', 'LinkedIn', 'Salon', 'Autre'] },
  { id: 'budget', name: 'Budget', type: 'text' },
  { id: 'decision_date', name: 'Date de décision', type: 'date' },
  { id: 'notes', name: 'Notes', type: 'textarea' },
];

// --- Store ---

interface CrmState {
  contacts: Contact[];
  stages: PipelineStage[];
  customFields: CustomField[];
  activities: Activity[];
  selectedContactId: string | null;
  pinnedContactId: string | null;
  searchQuery: string;
  filterStageId: string | null;
  filterTag: string | null;
  view: 'pipeline' | 'list' | 'daily';
  showOnlyCallable: boolean;

  // Contacts
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'customFields' | 'tags' | 'missedCalls' | 'lastCalledDate' | 'callbackDate' | 'callbackTime' | 'callbackNote' | 'civilite' | 'site' | 'logo' | 'ficheBien' | 'img1' | 'img2' | 'img3' | 'img4' | 'img5' | 'couleur1' | 'couleur2' | 'couleur3' | 'zone' | 'fermeture'> & Partial<Pick<Contact, 'civilite' | 'site' | 'logo' | 'ficheBien' | 'img1' | 'img2' | 'img3' | 'img4' | 'img5' | 'couleur1' | 'couleur2' | 'couleur3' | 'zone' | 'fermeture'>>) => string;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  moveContact: (id: string, stageId: string) => void;
  setSelectedContact: (id: string | null) => void;
  setPinnedContact: (id: string | null) => void;
  addTagToContact: (id: string, tag: string) => void;
  removeTagFromContact: (id: string, tag: string) => void;

  // Stages
  addStage: (name: string, color: string) => void;
  updateStage: (id: string, updates: Partial<PipelineStage>) => void;
  deleteStage: (id: string) => void;
  reorderStages: (stages: PipelineStage[]) => void;

  // Custom Fields
  addCustomField: (field: Omit<CustomField, 'id'>) => void;
  updateCustomField: (id: string, updates: Partial<CustomField>) => void;
  deleteCustomField: (id: string) => void;

  // Activities
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  getContactActivities: (contactId: string) => Activity[];

  // Filters
  setSearchQuery: (query: string) => void;
  setFilterStage: (stageId: string | null) => void;
  setFilterTag: (tag: string | null) => void;
  setView: (view: 'pipeline' | 'list' | 'daily') => void;
  setShowOnlyCallable: (v: boolean) => void;
  getFilteredContacts: () => Contact[];
  getAllTags: () => string[];

  // Scheduling
  scheduleUnscheduled: () => number;

  // Sync
  replaceData: (data: { contacts?: Contact[]; stages?: PipelineStage[]; customFields?: CustomField[]; activities?: Activity[] }) => void;
}

export const useCrmStore = create<CrmState>()(
  persist(
    (set, get) => ({
      contacts: [],
      stages: DEFAULT_STAGES,
      customFields: DEFAULT_FIELDS,
      activities: [],
      selectedContactId: null,
      pinnedContactId: null,
      searchQuery: '',
      filterStageId: null,
      filterTag: null,
      view: 'pipeline',
      showOnlyCallable: false,

      // --- Contacts ---
      addContact: (data) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const contact: Contact = {
          ...data,
          id,
          civilite: data.civilite || '',
          site: data.site || '',
          logo: data.logo || '',
          ficheBien: data.ficheBien || '',
          img1: data.img1 || '',
          img2: data.img2 || '',
          img3: data.img3 || '',
          img4: data.img4 || '',
          img5: data.img5 || '',
          couleur1: data.couleur1 || '',
          couleur2: data.couleur2 || '',
          couleur3: data.couleur3 || '',
          zone: data.zone || '',
          fermeture: data.fermeture || '',
          customFields: {},
          tags: [],
          missedCalls: 0,
          lastCalledDate: '',
          callbackDate: '',
          callbackTime: '',
          callbackNote: '',
          createdAt: now,
          updatedAt: now,
        };
        // Auto-assign a time slot if in first 2 columns
        const sortedStages = [...get().stages].sort((a, b) => a.order - b.order);
        const first3StageIds = new Set(sortedStages.slice(0, 2).map((s) => s.id));
        if (first3StageIds.has(contact.stageId) && !contact.callbackTime) {
          const slot = assignBestSlot(contact.fermeture, get().contacts);
          if (slot) contact.callbackTime = slot.start;
        }
        set((s) => ({ contacts: [...s.contacts, contact] }));
        return id;
      },

      updateContact: (id, updates) => {
        set((s) => ({
          contacts: s.contacts.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      deleteContact: (id) => {
        set((s) => ({
          contacts: s.contacts.filter((c) => c.id !== id),
          activities: s.activities.filter((a) => a.contactId !== id),
          selectedContactId: s.selectedContactId === id ? null : s.selectedContactId,
        }));
      },

      moveContact: (id, stageId) => {
        get().updateContact(id, { stageId });
      },

      setSelectedContact: (id) => set({ selectedContactId: id }),
      setPinnedContact: (id) => set({ pinnedContactId: id }),

      addTagToContact: (id, tag) => {
        const contact = get().contacts.find((c) => c.id === id);
        if (!contact || contact.tags.includes(tag)) return;
        get().updateContact(id, { tags: [...contact.tags, tag] });
      },

      removeTagFromContact: (id, tag) => {
        const contact = get().contacts.find((c) => c.id === id);
        if (!contact) return;
        get().updateContact(id, { tags: contact.tags.filter((t) => t !== tag) });
      },

      // --- Stages ---
      addStage: (name, color) => {
        const maxOrder = Math.max(...get().stages.map((s) => s.order), -1);
        set((s) => ({
          stages: [...s.stages, { id: uuidv4(), name, color, order: maxOrder + 1 }],
        }));
      },

      updateStage: (id, updates) => {
        set((s) => ({
          stages: s.stages.map((st) => (st.id === id ? { ...st, ...updates } : st)),
        }));
      },

      deleteStage: (id) => {
        const firstStage = get().stages.find((s) => s.id !== id);
        if (!firstStage) return;
        set((s) => ({
          stages: s.stages.filter((st) => st.id !== id),
          contacts: s.contacts.map((c) =>
            c.stageId === id ? { ...c, stageId: firstStage.id } : c
          ),
        }));
      },

      reorderStages: (stages) => set({ stages }),

      // --- Custom Fields ---
      addCustomField: (field) => {
        set((s) => ({
          customFields: [...s.customFields, { ...field, id: uuidv4() }],
        }));
      },

      updateCustomField: (id, updates) => {
        set((s) => ({
          customFields: s.customFields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        }));
      },

      deleteCustomField: (id) => {
        set((s) => ({
          customFields: s.customFields.filter((f) => f.id !== id),
          contacts: s.contacts.map((c) => {
            const cf = { ...c.customFields };
            delete cf[id];
            return { ...c, customFields: cf };
          }),
        }));
      },

      // --- Activities ---
      addActivity: (activity) => {
        set((s) => ({
          activities: [...s.activities, { ...activity, id: uuidv4() }],
        }));
      },

      updateActivity: (id, updates) => {
        set((s) => ({
          activities: s.activities.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        }));
      },

      deleteActivity: (id) => {
        set((s) => ({ activities: s.activities.filter((a) => a.id !== id) }));
      },

      getContactActivities: (contactId) => {
        return get()
          .activities.filter((a) => a.contactId === contactId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },

      // --- Filters ---
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterStage: (stageId) => set({ filterStageId: stageId }),
      setFilterTag: (tag) => set({ filterTag: tag }),
      setView: (view) => set({ view }),
      setShowOnlyCallable: (v) => set({ showOnlyCallable: v }),

      getFilteredContacts: () => {
        const { contacts, searchQuery, filterStageId, filterTag } = get();
        return contacts.filter((c) => {
          if (filterStageId && c.stageId !== filterStageId) return false;
          if (filterTag && !c.tags.includes(filterTag)) return false;
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
              c.firstName.toLowerCase().includes(q) ||
              c.lastName.toLowerCase().includes(q) ||
              c.company.toLowerCase().includes(q) ||
              c.email.toLowerCase().includes(q) ||
              c.phone.includes(q) ||
              c.facebookUrl.toLowerCase().includes(q)
            );
          }
          return true;
        });
      },

      getAllTags: () => {
        const tags = new Set<string>();
        get().contacts.forEach((c) => c.tags.forEach((t) => tags.add(t)));
        return Array.from(tags).sort();
      },

      // --- Scheduling ---
      scheduleUnscheduled: () => {
        const { contacts, stages } = get();
        const updates = scheduleAllUnscheduled(contacts, stages);
        updates.forEach(({ id, callbackTime }) => {
          get().updateContact(id, { callbackTime });
        });
        return updates.length;
      },

      // --- Sync ---
      replaceData: (data) => {
        set({
          contacts: data.contacts ?? get().contacts,
          stages: data.stages ?? get().stages,
          customFields: data.customFields ?? get().customFields,
          activities: data.activities ?? get().activities,
        });
      },
    }),
    {
      name: 'noyer-crm-storage',
      version: 5,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version === 0) {
          // Migration: set zone B on all existing contacts
          const contacts = (state.contacts as Contact[]) || [];
          state.contacts = contacts.map((c) => ({ ...c, zone: c.zone || 'B' }));
        }
        if (version < 2) {
          // Migration: add lastCalledDate to existing contacts
          const contacts = (state.contacts as Contact[]) || [];
          state.contacts = contacts.map((c) => ({ ...c, lastCalledDate: (c as Contact).lastCalledDate || '' }));
        }
        if (version < 3) {
          // Migration: clear callbackDate on gatekeeper contacts
          const contacts = (state.contacts as Contact[]) || [];
          const stages = (state.stages as PipelineStage[]) || [];
          const gkIds = new Set(
            stages.filter((s) => s.name.toLowerCase().includes('gatekeeper')).map((s) => s.id)
          );
          state.contacts = contacts.map((c) =>
            gkIds.has(c.stageId) ? { ...c, callbackDate: '' } : c
          );
        }
        if (version < 4) {
          // Migration: clear callbackDate on all first-3-column contacts
          // The slot system uses callbackTime only, callbackDate is for manual reminders
          const contacts = (state.contacts as Contact[]) || [];
          const stages = (state.stages as PipelineStage[]) || [];
          const sorted = [...stages].sort((a, b) => a.order - b.order);
          const first3Ids = new Set(sorted.slice(0, 3).map((s) => s.id));
          state.contacts = contacts.map((c) =>
            first3Ids.has(c.stageId) ? { ...c, callbackDate: '' } : c
          );
        }
        if (version < 5) {
          const stages = (state.stages as PipelineStage[]) || [];
          const sorted = [...stages].sort((a, b) => a.order - b.order);
          state.stages = sorted.map((s, i) => ({
            ...s,
            missedCallsEnabled: i < 3,
            missedCallsMax: i === 0 ? 2 : 3,
          }));
        }
        return state as unknown as CrmState;
      },
      partialize: (state) => ({
        contacts: state.contacts,
        stages: state.stages,
        customFields: state.customFields,
        activities: state.activities,
      }),
    }
  )
);
