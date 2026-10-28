import { useCrmStore } from '../store/useCrmStore';
import { getTodayStr, getTomorrowStr } from './dateUtils';

// Fictional sample contacts so first-time visitors can try the CRM right away.
const DEMO_CONTACTS = [
  { firstName: 'Claire', lastName: 'Martin', company: 'Boulangerie Martin', phone: '+32 470 00 00 01', email: 'claire@example.com', fermeture: '18:30', tags: ['commerce'], callback: 'today', note: 'Intéressée, rappeler après 14h' },
  { firstName: 'Lucas', lastName: 'Dubois', company: 'Garage Dubois', phone: '+32 470 00 00 02', email: 'lucas@example.com', fermeture: '18', tags: ['auto'], callback: 'today', note: 'Pas joignable ce matin' },
  { firstName: 'Sophie', lastName: 'Lambert', company: 'Cabinet Lambert', phone: '+32 470 00 00 03', email: 'sophie@example.com', fermeture: '17', tags: ['services'], callback: 'tomorrow', note: 'Demande une démo' },
  { firstName: 'Thomas', lastName: 'Leroy', company: 'Leroy Immobilier', phone: '+32 470 00 00 04', email: 'thomas@example.com', fermeture: '18', tags: ['immobilier'], callback: '', note: 'Devis envoyé' },
  { firstName: 'Emma', lastName: 'Petit', company: 'Fleurs Petit', phone: '+32 470 00 00 05', email: 'emma@example.com', fermeture: '19', tags: ['commerce'], callback: '', note: '' },
  { firstName: 'Hugo', lastName: 'Moreau', company: 'Moreau Travaux', phone: '+32 470 00 00 06', email: 'hugo@example.com', fermeture: '17', tags: ['bâtiment'], callback: '', note: 'Signé' },
  { firstName: 'Léa', lastName: 'Simon', company: 'Studio Simon', phone: '+32 470 00 00 07', email: 'lea@example.com', fermeture: '18', tags: ['services'], callback: '', note: '' },
];

// Stage position (by order) for each demo contact, spread across the pipeline.
const STAGE_POSITIONS = [0, 1, 2, 3, 0, 5, 1];

export const DEMO_TAG = 'démo';

export function loadDemoData(): number {
  const store = useCrmStore.getState();
  const stages = [...store.stages].sort((a, b) => a.order - b.order);
  if (stages.length === 0) return 0;

  DEMO_CONTACTS.forEach((demo, i) => {
    const stage = stages[Math.min(STAGE_POSITIONS[i], stages.length - 1)];
    const id = store.addContact({
      firstName: demo.firstName,
      lastName: demo.lastName,
      company: demo.company,
      email: demo.email,
      phone: demo.phone,
      facebookUrl: '',
      fermeture: demo.fermeture,
      stageId: stage.id,
    });

    const callbackDate = demo.callback === 'today' ? getTodayStr() : demo.callback === 'tomorrow' ? getTomorrowStr() : '';
    if (callbackDate) {
      store.updateContact(id, { callbackDate, callbackNote: demo.note });
    }

    [...demo.tags, DEMO_TAG].forEach((tag) => store.addTagToContact(id, tag));

    if (demo.note) {
      store.addActivity({ contactId: id, type: 'call', content: demo.note, date: new Date().toISOString(), done: true });
    }
  });

  return DEMO_CONTACTS.length;
}

/** Removes every contact tagged as demo. */
export function clearDemoData(): void {
  const store = useCrmStore.getState();
  store.contacts.filter((c) => c.tags.includes(DEMO_TAG)).forEach((c) => store.deleteContact(c.id));
}
