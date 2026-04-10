import { useState, useMemo } from 'react';
import { X, Upload, FileText, AlertCircle, Check, ArrowRight } from 'lucide-react';
import { useCrmStore } from '../../store/useCrmStore';
import { getTodayStr } from '../../utils/dateUtils';
import { assignBestSlot } from '../../utils/callSlots';

type Step = 'input' | 'mapping' | 'preview' | 'done';

interface ParsedData {
  headers: string[];
  rows: string[][];
}

interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  text: string;
}

const WEBHOOK_URL = 'https://pierre07.app.n8n.cloud/webhook/cfa0fd5e-ad41-462a-9fe4-a8d0eafe5fd8';

// CRM target fields
const CRM_FIELDS = [
  { key: 'firstName', label: 'Prénom' },
  { key: 'lastName', label: 'Nom' },
  { key: 'company', label: 'Entreprise' },
  { key: 'civilite', label: 'Civilité' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'facebookUrl', label: 'Page Facebook' },
  { key: 'site', label: 'Site web' },
  { key: 'logo', label: 'Logo (URL)' },
  { key: 'ficheBien', label: 'Fiche bien (URL)' },
  { key: 'img1', label: 'Image 1 (URL)' },
  { key: 'img2', label: 'Image 2 (URL)' },
  { key: 'img3', label: 'Image 3 (URL)' },
  { key: 'img4', label: 'Image 4 (URL)' },
  { key: 'img5', label: 'Image 5 (URL)' },
  { key: 'couleur1', label: 'Couleur 1' },
  { key: 'couleur2', label: 'Couleur 2' },
  { key: 'couleur3', label: 'Couleur 3' },
  { key: 'zone', label: 'Zone de vacances (A/B/C)' },
  { key: 'fermeture', label: 'Horaire' },
  { key: 'stage', label: 'Étape du pipeline' },
  { key: 'tags', label: 'Tags (séparés par virgules)' },
  { key: '_skip', label: '-- Ignorer cette colonne --' },
];

function parseInput(text: string): ParsedData {
  const lines = text.trim().split('\n').filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const firstLine = lines[0];
  let separator = ',';
  if (firstLine.includes('\t')) separator = '\t';
  else if (firstLine.split(';').length > firstLine.split(',').length) separator = ';';

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);

  return { headers, rows };
}

function autoMapColumns(headers: string[], _stageNames: string[], customFieldNames: string[]): Record<number, string> {
  const mapping: Record<number, string> = {};

  const patterns: Record<string, RegExp[]> = {
    firstName: [/pr[eé]nom/i, /first\s*name/i, /^prenom$/i],
    lastName: [/^nom$/i, /last\s*name/i, /family/i, /surname/i],
    company: [/entreprise/i, /soci[eé]t[eé]/i, /company/i, /org/i],
    civilite: [/civilit[eé]/i, /titre/i, /gender/i],
    email: [/e-?mail/i, /courriel/i, /mail/i],
    phone: [/t[eé]l[eé]phone/i, /phone/i, /mobile/i, /num[eé]ro/i, /tel/i],
    facebookUrl: [/facebook/i, /fb/i, /page\s*facebook/i],
    site: [/site/i, /website/i, /url.*agence/i],
    logo: [/logo/i],
    ficheBien: [/fiche.?bien/i, /fiche_bien/i],
    img1: [/img\s*1/i, /image\s*1/i],
    img2: [/img\s*2/i, /image\s*2/i],
    img3: [/img\s*3/i, /image\s*3/i],
    img4: [/img\s*4/i, /image\s*4/i],
    img5: [/img\s*5/i, /image\s*5/i],
    couleur1: [/couleur\s*1/i, /color\s*1/i],
    couleur2: [/couleur\s*2/i, /color\s*2/i],
    couleur3: [/couleur\s*3/i, /color\s*3/i],
    zone: [/zone/i],
    fermeture: [/fermeture/i, /horaire/i, /closing/i, /heure.*ferm/i],
    stage: [/[eé]tape/i, /stage/i, /statut/i, /status/i, /phase/i, /pipeline/i],
    tags: [/tags?/i, /[eé]tiquettes?/i, /labels?/i, /cat[eé]gorie/i],
  };

  headers.forEach((header, index) => {
    const h = header.trim();
    for (const [field, regexes] of Object.entries(patterns)) {
      if (regexes.some((r) => r.test(h))) {
        mapping[index] = field;
        return;
      }
    }
    const matchedCustom = customFieldNames.find(
      (cf) => cf.toLowerCase() === h.toLowerCase()
    );
    if (matchedCustom) {
      mapping[index] = `custom:${matchedCustom}`;
    }
  });

  return mapping;
}

function normalizeFermeture(val: string): string {
  const v = val.trim().toLowerCase().replace('h', ':').replace(/:$/, '');
  if (v === '17') return '17';
  if (v === '18') return '18';
  if (v === '18:30') return '18:30';
  if (v === '19') return '19';
  return val.trim();
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface Props {
  onClose: () => void;
}

export default function ImportModal({ onClose }: Props) {
  const { addContact, stages, customFields, addTagToContact, updateContact } = useCrmStore();

  const [step, setStep] = useState<Step>('input');
  const [rawInput, setRawInput] = useState('');
  const [parsed, setParsed] = useState<ParsedData>({ headers: [], rows: [] });
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [importedCount, setImportedCount] = useState(0);
  const [hasHeaders, setHasHeaders] = useState(true);
  const [targetStageId, setTargetStageId] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [webhookSending, setWebhookSending] = useState(false);

  const addToast = (type: 'success' | 'error', text: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const allFields = useMemo(() => {
    const fields = [...CRM_FIELDS];
    customFields.forEach((cf) => {
      fields.push({ key: `custom:${cf.id}`, label: `[Perso] ${cf.name}` });
    });
    return fields;
  }, [customFields]);

  const handleParse = () => {
    const data = parseInput(rawInput);
    if (data.headers.length === 0) return;

    if (!hasHeaders) {
      const generated = data.headers.map((_, i) => `Colonne ${i + 1}`);
      data.rows.unshift(data.headers);
      data.headers = generated;
    }

    setParsed(data);
    const autoMap = autoMapColumns(
      data.headers,
      stages.map((s) => s.name),
      customFields.map((cf) => cf.name)
    );
    setMapping(autoMap);
    setStep('mapping');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawInput(ev.target?.result as string);
    };
    reader.readAsText(file);
  };

  const previewRows = useMemo(() => {
    return parsed.rows.slice(0, 5).map((row) => {
      const contact: Record<string, string> = {};
      Object.entries(mapping).forEach(([colIndex, field]) => {
        if (field && field !== '_skip') {
          contact[field] = row[parseInt(colIndex)] || '';
        }
      });
      return contact;
    });
  }, [parsed.rows, mapping]);

  const isPrechauffeStage = (stageId: string): boolean => {
    const stage = stages.find((s) => s.id === stageId);
    return stage?.name.toLowerCase().includes('prechauf') || stage?.name.toLowerCase().includes('préchauff') || false;
  };

  const sendWebhook = async (data: Record<string, string>) => {
    const payload = {
      entreprise: data.company || '',
      civilite: data.civilite || '',
      prenom: data.firstName || '',
      nom: data.lastName || '',
      email: data.email || '',
      site: data.site || '',
      facebook: data.facebookUrl || '',
      logo: data.logo || '',
      fiche_bien: data.ficheBien || '',
      img1: data.img1 || '',
      img2: data.img2 || '',
      img3: data.img3 || '',
      img4: data.img4 || '',
      img5: data.img5 || '',
      couleur1: data.couleur1 || '',
      couleur2: data.couleur2 || '',
      couleur3: data.couleur3 || '',
      zone: data.zone || '',
      fermeture: normalizeFermeture(data.fermeture || ''),
    };

    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  };

  const handleImport = async () => {
    let count = 0;
    const contactsToWebhook: Record<string, string>[] = [];

    parsed.rows.forEach((row) => {
      const data: Record<string, string> = {};
      Object.entries(mapping).forEach(([colIndex, field]) => {
        if (field && field !== '_skip') {
          data[field] = row[parseInt(colIndex)] || '';
        }
      });

      if (!data.firstName && !data.lastName && !data.company) return;

      // Determine stage
      let stageId = targetStageId || stages[0]?.id || '';
      if (!targetStageId && data.stage) {
        const match = stages.find(
          (s) => s.name.toLowerCase() === data.stage.toLowerCase()
        );
        if (match) stageId = match.id;
      }

      const contactId = addContact({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        company: data.company || '',
        email: data.email || '',
        phone: data.phone || '',
        facebookUrl: data.facebookUrl || '',
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
        fermeture: normalizeFermeture(data.fermeture || ''),
        stageId,
      });

      // Auto-assign call slot based on fermeture + load balancing
      const ferm = normalizeFermeture(data.fermeture || '');
      const allContacts = useCrmStore.getState().contacts;
      const bestSlot = assignBestSlot(ferm, allContacts);
      if (bestSlot) {
        updateContact(contactId, { callbackDate: getTodayStr(), callbackTime: bestSlot.start });
      }

      // Tags
      if (data.tags) {
        data.tags.split(',').map((t) => t.trim()).filter(Boolean).forEach((tag) => {
          addTagToContact(contactId, tag);
        });
      }

      // Custom fields
      const customFieldUpdates: Record<string, string> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith('custom:')) {
          const cfId = key.replace('custom:', '');
          customFieldUpdates[cfId] = value;
        }
      });
      if (Object.keys(customFieldUpdates).length > 0) {
        updateContact(contactId, { customFields: customFieldUpdates });
      }

      // Queue for webhook if PRÉCHAUFFÉ
      if (isPrechauffeStage(stageId)) {
        contactsToWebhook.push(data);
      }

      count++;
    });

    setImportedCount(count);
    setStep('done');

    // Send webhooks with delay
    if (contactsToWebhook.length > 0) {
      setWebhookSending(true);
      for (const data of contactsToWebhook) {
        try {
          await sendWebhook(data);
          addToast('success', `Préchauffage lancé ✓ ${data.company || data.firstName || 'Contact'}`);
        } catch {
          addToast('error', `Erreur préchauffage ✗ ${data.company || data.firstName || 'Contact'}`);
        }
        await delay(500);
      }
      setWebhookSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Upload className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-900">Importer des contacts</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border-b text-sm">
          {(['input', 'mapping', 'preview', 'done'] as Step[]).map((s, i) => {
            const labels = ['Données', 'Mapping', 'Aperçu', 'Terminé'];
            const isActive = s === step;
            const isDone = ['input', 'mapping', 'preview', 'done'].indexOf(step) > i;
            return (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <ArrowRight className="w-4 h-4 text-gray-300" />}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {labels[i]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Input */}
          {step === 'input' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">Comment importer ?</p>
                <ul className="space-y-1 text-blue-700">
                  <li>1. Copiez votre tableau depuis Notion (Ctrl+A puis Ctrl+C)</li>
                  <li>2. Collez-le dans la zone ci-dessous</li>
                  <li>3. Ou uploadez un fichier CSV</li>
                </ul>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={hasHeaders}
                    onChange={(e) => setHasHeaders(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  La première ligne contient les en-têtes
                </label>

                <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-sm transition-colors">
                  <FileText className="w-4 h-4" />
                  Charger un fichier CSV
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Target stage selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importer dans la colonne (facultatif)
                </label>
                <select
                  value={targetStageId}
                  onChange={(e) => setTargetStageId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">-- Détection auto depuis le CSV --</option>
                  {stages.sort((a, b) => a.order - b.order).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {targetStageId && isPrechauffeStage(targetStageId) && (
                  <p className="mt-1 text-xs text-orange-600">
                    Les prospects importés dans PRÉCHAUFFÉ seront envoyés automatiquement au webhook n8n.
                  </p>
                )}
              </div>

              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Collez vos données ici...\n\nExemple CSV :\nENTREPRISE,CIVILITE,PRENOM,NOM,EMAIL,SITE,FACEBOOK,LOGO,FICHE_BIEN,IMG1,IMG2,IMG3,IMG4,IMG5`}
              />

              <p className="text-xs text-gray-400">
                Formats supportés : texte tabulé (copie Notion), CSV (virgule), CSV (point-virgule)
              </p>
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Associez chaque colonne à un champ du CRM. Les colonnes reconnues sont pré-remplies.
              </p>

              <div className="space-y-3">
                {parsed.headers.map((header, index) => {
                  const sampleValues = parsed.rows
                    .slice(0, 3)
                    .map((r) => r[index])
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{header}</p>
                        <p className="text-xs text-gray-400 truncate">Ex: {sampleValues || '(vide)'}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <select
                        value={mapping[index] || '_skip'}
                        onChange={(e) =>
                          setMapping({ ...mapping, [index]: e.target.value })
                        }
                        className={`w-52 px-3 py-2 border rounded-lg text-sm ${
                          mapping[index] && mapping[index] !== '_skip'
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-300'
                        }`}
                      >
                        {allFields.map((f) => (
                          <option key={f.key} value={f.key}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4" />
                <span>Aperçu des {Math.min(5, parsed.rows.length)} premières lignes sur {parsed.rows.length} total</span>
              </div>

              {targetStageId && (
                <div className="text-sm text-gray-600">
                  Colonne cible : <strong>{stages.find((s) => s.id === targetStageId)?.name}</strong>
                  {isPrechauffeStage(targetStageId) && (
                    <span className="ml-2 text-orange-600 text-xs">(webhook n8n activé)</span>
                  )}
                </div>
              )}

              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      {Object.values(mapping)
                        .filter((v) => v !== '_skip')
                        .map((field) => {
                          const f = allFields.find((af) => af.key === field);
                          return (
                            <th key={field} className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                              {f?.label || field}
                            </th>
                          );
                        })}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewRows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {Object.entries(mapping)
                          .filter(([, v]) => v !== '_skip')
                          .map(([, field]) => (
                            <td key={field} className="px-3 py-2 text-gray-700">
                              {row[field] || <span className="text-gray-300">--</span>}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-gray-500">
                {parsed.rows.length} contacts seront importés.
              </p>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 'done' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Import terminé
              </h3>
              <p className="text-gray-600">
                {importedCount} contact{importedCount > 1 ? 's' : ''} importé{importedCount > 1 ? 's' : ''} avec succès.
              </p>
              {webhookSending && (
                <p className="text-orange-600 text-sm mt-2 animate-pulse">
                  Envoi des webhooks en cours...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div>
            {step !== 'input' && step !== 'done' && (
              <button
                onClick={() =>
                  setStep(step === 'mapping' ? 'input' : step === 'preview' ? 'mapping' : 'input')
                }
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Retour
              </button>
            )}
          </div>
          <div>
            {step === 'input' && (
              <button
                onClick={handleParse}
                disabled={!rawInput.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Analyser
              </button>
            )}
            {step === 'mapping' && (
              <button
                onClick={() => setStep('preview')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Aperçu
              </button>
            )}
            {step === 'preview' && (
              <button
                onClick={handleImport}
                className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Importer {parsed.rows.length} contacts
              </button>
            )}
            {step === 'done' && (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Fermer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[60] space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-[slideIn_0.3s_ease] ${
                toast.type === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {toast.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
