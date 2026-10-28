// Optional integrations, configured per user in Settings > Intégrations.
// Stored in localStorage only: nothing user-specific is hardcoded in the source.

const INTEGRATIONS_KEY = 'scriptflow-integrations';

export interface IntegrationsConfig {
  /** Webhook called (POST JSON) for each imported contact landing in a "warm-up" stage. Empty = disabled. */
  importWebhookUrl: string;
  /**
   * Booking link template used by the "Invitation" button. Empty = button hidden.
   * Placeholders: {firstName} {lastName} {company} {email} {phone}
   */
  bookingUrlTemplate: string;
}

const DEFAULT_CONFIG: IntegrationsConfig = {
  importWebhookUrl: '',
  bookingUrlTemplate: '',
};

export function getIntegrations(): IntegrationsConfig {
  try {
    const raw = localStorage.getItem(INTEGRATIONS_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_CONFIG };
}

export function saveIntegrations(config: IntegrationsConfig): void {
  try {
    localStorage.setItem(INTEGRATIONS_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

interface BookingContact {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
}

/** Returns the booking URL for a contact, or null if no template is configured. */
export function buildBookingUrl(contact: BookingContact): string | null {
  const template = getIntegrations().bookingUrlTemplate.trim();
  if (!template) return null;
  const values: Record<string, string> = {
    firstName: contact.firstName || '',
    lastName: contact.lastName || '',
    company: contact.company || '',
    email: contact.email || '',
    phone: contact.phone || '',
  };
  return template.replace(/\{(firstName|lastName|company|email|phone)\}/g, (_, key: string) =>
    encodeURIComponent(values[key])
  );
}
