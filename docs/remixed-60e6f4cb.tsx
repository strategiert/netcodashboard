import { useState } from 'react';
import { ChevronRight, ChevronDown, Users, FileText, Video, Calculator, BookOpen, Mic, Image, Mail, Target, CheckCircle2, Circle, Clock, Zap, Filter, LayoutGrid, List, Factory, Cog, Battery, Building2, ShoppingCart } from 'lucide-react';

const phases = [
  { id: 1, name: 'Not Aware → Problem Aware', short: 'Problem Aware', color: 'bg-red-500', lightColor: 'bg-red-500/20 text-red-400 border-red-500/30', mindset: '„Es läuft schon… irgendwie." – Risiken sichtbar machen, ohne CT zu erwähnen.' },
  { id: 2, name: 'Problem Aware → Solution Aware', short: 'Solution Aware', color: 'bg-amber-500', lightColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30', mindset: '„Wir haben ein Problem – aber noch keinen Plan." – Lösungsräume öffnen.' },
  { id: 3, name: 'Solution Aware → Trust', short: 'Trust', color: 'bg-blue-500', lightColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30', mindset: '„Wem kann ich vertrauen?" – Echte Hilfe im Alltag bieten.' },
  { id: 4, name: 'Trust → Decision Support', short: 'Decision', color: 'bg-green-500', lightColor: 'bg-green-500/20 text-green-400 border-green-500/30', mindset: '„Ich muss intern argumentieren." – Entscheidungshilfen liefern.' },
  { id: 5, name: 'Decision → Customer', short: 'Customer', color: 'bg-purple-500', lightColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30', mindset: '„Wie läuft das mit euch?" – Einstieg leicht machen.' },
];

const contentPieces = [
  // Phase 1
  { id: '1.1', phase: 1, title: 'Produktionsrisiko-Report', format: 'PDF + Artikel', proximity: 'nah/adjacent', desc: '7–10 unsichtbare Risiken in Gießerei/Automotive', status: 'planned' },
  { id: '1.2', phase: 1, title: 'Frühwarnsignale im Serienanlauf', format: 'Checkliste', proximity: 'adjacent', desc: '12 Frühwarnsignale für instabile Linien', status: 'planned' },
  { id: '1.3', phase: 1, title: 'Risiko-Selbsttest Produktionsstabilität', format: 'Online-Tool + PDF', proximity: 'adjacent', desc: '10 Fragen → Score → 3 Sofortmaßnahmen', status: 'in-progress', priority: 'high' },
  { id: '1.4', phase: 1, title: 'Fehlerbibliothek (Fehler-Wiki)', format: 'Wiki + PDF', proximity: 'sehr nah', desc: 'Lunker, Kaltlauf, Porosität – alle Fehlerbilder', status: 'in-progress' },
  { id: '1.5', phase: 1, title: 'Ein Tag im Leben eines Produktionsleiters', format: 'Story + Carousel', proximity: 'neutral', desc: 'Narrative Story mit typischen Störungen', status: 'planned' },
  // Phase 2
  { id: '2.1', phase: 2, title: 'Produktionsstabilitäts-Guide', format: 'PDF (20-30 S.)', proximity: 'adjacent', desc: 'Leitfaden zu stabilen Linien', status: 'in-progress', priority: 'high' },
  { id: '2.2', phase: 2, title: 'Fehlerursachen-Navigator', format: 'Decision-Tree', proximity: 'nah', desc: 'Symptom → Ursache → Analyseoption', status: 'planned' },
  { id: '2.3', phase: 2, title: 'Videoserie „Wie Fehler entstehen"', format: '5 Videos', proximity: 'sehr nah', desc: 'Lunker, Kaltlauf, Kernversatz, Luft, Risse', status: 'planned' },
  { id: '2.4', phase: 2, title: 'SOP-Risiko-Simulator', format: 'Online-Tool', proximity: 'adjacent', desc: 'Bewertung des SOP-Risikos → Score', status: 'planned' },
  { id: '2.5', phase: 2, title: 'Messmethoden vs. Realität', format: 'Artikel + LinkedIn', proximity: 'nah', desc: 'Neutraler Vergleich aller Prüfverfahren', status: 'planned' },
  // Phase 3
  { id: '3.1', phase: 3, title: 'SOP 25-Punkte-Plan', format: 'PDF + Poster', proximity: 'adjacent', desc: 'Checkliste für sauberen Serienanlauf', status: 'in-progress', priority: 'high' },
  { id: '3.2', phase: 3, title: 'Whitepaper „Fehlerkultur"', format: 'PDF + Artikel', proximity: 'neutral', desc: 'Fehler melden ohne Schuldzuweisung', status: 'planned' },
  { id: '3.3', phase: 3, title: 'Fehler-Review Talk', format: 'Video/Podcast', proximity: 'neutral/adjacent', desc: 'Gespräche mit Produktionsleitern', status: 'planned' },
  { id: '3.4', phase: 3, title: 'Process-Map Poster', format: 'Poster', proximity: 'adjacent', desc: 'Produktionsprozess mit Risikozonen', status: 'planned' },
  { id: '3.5', phase: 3, title: '10 Missverständnisse Fehleranalyse', format: 'Artikel + Carousel', proximity: 'nah', desc: 'Mythen aufräumen, Klartext sprechen', status: 'planned' },
  // Phase 4
  { id: '4.1', phase: 4, title: 'Entscheidungsnavigator', format: 'PDF/Tool', proximity: 'nah', desc: 'Brauchen wir externe Analyse?', status: 'planned' },
  { id: '4.2', phase: 4, title: 'Rückläufer systematisch verhindern', format: 'Guide (15-20 S.)', proximity: 'adjacent', desc: 'Schritt-für-Schritt zur Reduktion', status: 'planned' },
  { id: '4.3', phase: 4, title: 'SOP-Notfallplan', format: 'PDF (1-3 S.)', proximity: 'adjacent', desc: 'Was tun wenn OEM morgen droht?', status: 'planned' },
  { id: '4.4', phase: 4, title: 'Messmethoden-Vergleichsmatrix', format: 'One-Pager', proximity: 'nah', desc: 'Matrix für interne Präsentationen', status: 'planned' },
  { id: '4.5', phase: 4, title: 'OEM-Reporting-Checkliste', format: 'PDF', proximity: 'adjacent', desc: 'Welche Nachweise OEMs erwarten', status: 'planned' },
  // Phase 5
  { id: '5.1', phase: 5, title: 'CT-Software Demo & Probe-Report', format: 'Demo + Report', proximity: 'sehr nah', desc: 'Interaktive Demo + Beispielbericht', status: 'in-progress' },
  { id: '5.2', phase: 5, title: 'Fallstudien aus Kundensicht', format: 'PDF + Artikel', proximity: 'nah', desc: 'Erfolgsgeschichten der Kunden', status: 'planned' },
  { id: '5.3', phase: 5, title: 'Bauteil-Guides', format: '3-5 Kurz-Guides', proximity: 'sehr nah', desc: 'E-Motor, Batterie, Strukturteile', status: 'planned' },
  { id: '5.4', phase: 5, title: 'Workshop „Serienanlauf absichern"', format: 'Online-Workshop', proximity: 'adjacent/nah', desc: '45-60 Min mit Q&A', status: 'planned' },
  { id: '5.5', phase: 5, title: 'Onboarding-Kit', format: 'E-Mail + PDF', proximity: 'sehr nah', desc: 'Schritt-für-Schritt für neue Kunden', status: 'planned' },
];

const journeys = [
  { id: 'automotive', icon: Factory, name: 'Automotive OEM', role: 'Qualitätsleiter Serienproduktion', situation: 'Rückläuferquote steigt, OEM stellt kritische Fragen', color: 'blue',
    steps: [
      { phase: 1, trigger: 'OEM meldet Qualitätsstreuung', search: '„Fehler im Druckguss erkennen"', content: ['1.4', '1.5'], insight: '„Das passt exakt zu unseren Symptomen."' },
      { phase: 2, trigger: 'Sucht tiefere Prüfmethoden', search: '„Welche Prüfmethoden sehen Innenfehler?"', content: ['2.1', '2.5', '2.3'], insight: '„Wir brauchen etwas Tiefergehendes."' },
      { phase: 3, trigger: 'Sucht Ursachenklarheit', search: '„Wie finde ich die Ursache sicher?"', content: ['2.2', '3.1', '3.5', '3.2'], insight: '„Die sprechen wie wir."' },
      { phase: 4, trigger: 'Muss intern argumentieren', content: ['4.5', '4.4', '4.3', '4.1'], insight: 'Hat Argumente für Budget & Dringlichkeit.' },
      { phase: 5, trigger: 'Entscheidung treffen', content: ['5.1', '5.2'], insight: '→ Erstgespräch → Testanalyse → Kunde' },
    ]
  },
  { id: 'giesserei', icon: Cog, name: 'Gießerei', role: 'Werkzeugbauleiter / Prozessingenieur', situation: 'Werkzeugverschleiß produziert sporadische Fehler', color: 'orange',
    steps: [
      { phase: 1, trigger: 'Sieht LinkedIn Carousel', content: ['1.4'], insight: '„Genau unser Problem."' },
      { phase: 2, trigger: 'Sucht Ursachen', content: ['2.3', '2.2', '2.5'], insight: 'Versteht thermische Ungleichgewichte.' },
      { phase: 3, trigger: 'Will Vertrauen', content: ['3.4', '3.1', '3.2'], insight: 'Folgt auf LinkedIn.' },
      { phase: 4, trigger: 'Braucht Entscheidungshilfe', content: ['4.4', '4.2'], insight: '„Wir brauchen Klarheit im Inneren."' },
      { phase: 5, trigger: 'Test durchführen', content: ['5.1', '5.2'], insight: '→ Testanalyse bestellen' },
    ]
  },
  { id: 'emotor', icon: Battery, name: 'E-Motor / Powertrain', role: 'Projektleiter Serienanlauf', situation: 'E-Motor in Serie, innere Risse am Gehäuse', color: 'green',
    steps: [
      { phase: 1, trigger: 'Googelt Risse', search: '„Innenrisse Aluminium E-Motor"', content: ['1.4'], insight: 'Meldet sich für Newsletter an.' },
      { phase: 2, trigger: 'Sucht Lösungen', content: ['2.1', '2.3'], insight: 'Versteht Temperaturgradienten.' },
      { phase: 3, trigger: 'Braucht Prozess', content: ['3.1', '2.2'], insight: 'Sieht anonymisiertes Interview.' },
      { phase: 4, trigger: 'OEM-Meetings vorbereiten', content: ['4.5', '4.4', '4.1'], insight: '„Müssen CT evaluieren."' },
      { phase: 5, trigger: 'Workshop buchen', content: ['5.1', '5.3', '5.4'], insight: '→ Workshop → Projekt' },
    ]
  },
  { id: 'maschinenbau', icon: Building2, name: 'Maschinenbau Mittelstand', role: 'Geschäftsführer', situation: 'Kunde reklamiert, intern Ratlosigkeit', color: 'purple',
    steps: [
      { phase: 1, trigger: 'Google Ads / SEO', content: ['1.3'], insight: 'Erhält Score per PDF.' },
      { phase: 2, trigger: 'Liest weiter', content: ['2.1'], insight: 'Versteht Baugruppen-Fehler.' },
      { phase: 3, trigger: 'Erkennt Wissenslücke', content: ['3.4', '3.2'], insight: '„Die haben Wissen, das wir nicht haben."' },
      { phase: 4, trigger: 'Braucht externen Blick', content: ['4.2', '4.1'], insight: '„Brauchen neutralen Blick."' },
      { phase: 5, trigger: 'Testet', content: ['5.1'], insight: '→ Testanalyse buchen' },
    ]
  },
  { id: 'einkauf', icon: ShoppingCart, name: 'Einkauf / Procurement', role: 'Budget-Owner', situation: 'Qualitätsleiter bittet um Budget', color: 'teal',
    steps: [
      { phase: 4, trigger: 'Braucht Argumente', content: ['4.4', '4.5', '4.3', '4.1'], insight: 'Versteht Kosten-Nutzen.' },
      { phase: 5, trigger: 'Prüft Angebot', content: ['5.1'], insight: '→ Gibt Budget frei' },
    ]
  },
];

const formatIcons = {
  'PDF': FileText, 'Artikel': FileText, 'Checkliste': CheckCircle2, 'Online-Tool': Calculator,
  'Wiki': BookOpen, 'Story': FileText, 'Carousel': Image, 'Decision-Tree': Target,
  'Video': Video, 'Poster': Image, 'Podcast': Mic, 'One-Pager': FileText,
  'Guide': FileText, 'Demo': Video, 'Report': FileText, 'Workshop': Users, 'E-Mail': Mail
};

const statusConfig = {
  'planned': { label: 'Geplant', icon: Circle, color: 'text-slate-400' },
  'in-progress': { label: 'In Arbeit', icon: Clock, color: 'text-amber-400' },
  'done': { label: 'Fertig', icon: CheckCircle2, color: 'text-green-400' },
};

const proximityColors = {
  'sehr nah': 'bg-green-500/20 text-green-400 border-green-500/30',
  'nah': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'nah/adjacent': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'adjacent': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'adjacent/nah': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'neutral': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  'neutral/adjacent': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function MarketingPlanDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const getContentById = (id) => contentPieces.find(c => c.id === id);
  const getPhaseById = (id) => phases.find(p => p.id === id);

  const stats = {
    total: contentPieces.length,
    priority: contentPieces.filter(c => c.priority === 'high').length,
    planned: contentPieces.filter(c => c.status === 'planned').length,
    inProgress: contentPieces.filter(c => c.status === 'in-progress').length,
    done: contentPieces.filter(c => c.status === 'done').length,
  };

  const filteredContent = selectedPhase 
    ? contentPieces.filter(c => c.phase === selectedPhase)
    : contentPieces;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Microvista Marketing-Plan</h1>
          <p className="text-slate-400">Content-Strategie entlang der Customer Journey</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-slate-500">Content Pieces</div>
          </div>
          <div className="p-4 bg-slate-900 rounded-xl border border-amber-500/30">
            <div className="text-3xl font-bold text-amber-400 flex items-center gap-2">{stats.priority} <Zap className="w-5 h-5" /></div>
            <div className="text-sm text-slate-500">High Priority</div>
          </div>
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <div className="text-3xl font-bold text-slate-400">{stats.planned}</div>
            <div className="text-sm text-slate-500">Geplant</div>
          </div>
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <div className="text-3xl font-bold text-amber-400">{stats.inProgress}</div>
            <div className="text-sm text-slate-500">In Arbeit</div>
          </div>
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <div className="text-3xl font-bold text-green-400">{stats.done}</div>
            <div className="text-sm text-slate-500">Fertig</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-800 pb-4">
          {[
            { id: 'overview', label: 'Funnel-Übersicht' },
            { id: 'content', label: 'Content-Pieces' },
            { id: 'journeys', label: 'Customer Journeys' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Funnel Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {phases.map(phase => {
              const phaseContent = contentPieces.filter(c => c.phase === phase.id);
              return (
                <div key={phase.id} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex items-center gap-4">
                    <div className={`w-2 h-12 rounded-full ${phase.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-500">Phase {phase.id}</span>
                        <h3 className="font-semibold">{phase.name}</h3>
                        <span className="text-xs px-2 py-1 bg-slate-800 rounded-full text-slate-400">
                          {phaseContent.length} Assets
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{phase.mindset}</p>
                    </div>
                  </div>
                  <div className="p-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {phaseContent.map(content => {
                      const StatusIcon = statusConfig[content.status].icon;
                      return (
                        <div key={content.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-slate-500">{content.id}</span>
                              {content.priority === 'high' && <Zap className="w-3 h-3 text-amber-400" />}
                            </div>
                            <StatusIcon className={`w-4 h-4 ${statusConfig[content.status].color}`} />
                          </div>
                          <h4 className="font-medium text-sm mb-1">{content.title}</h4>
                          <p className="text-xs text-slate-500 mb-2">{content.desc}</p>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs px-2 py-0.5 bg-slate-700 rounded">{content.format}</span>
                            <span className={`text-xs px-2 py-0.5 rounded border ${proximityColors[content.proximity]}`}>
                              {content.proximity}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Content Pieces List */}
        {activeTab === 'content' && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedPhase(null)}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  !selectedPhase ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Alle Phasen
              </button>
              {phases.map(phase => (
                <button
                  key={phase.id}
                  onClick={() => setSelectedPhase(phase.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2 ${
                    selectedPhase === phase.id ? `${phase.color} text-white` : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${selectedPhase === phase.id ? 'bg-white' : phase.color}`} />
                  {phase.short}
                </button>
              ))}
            </div>

            {/* Content Table */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-sm text-slate-500">
                    <th className="p-4">ID</th>
                    <th className="p-4">Titel</th>
                    <th className="p-4">Format</th>
                    <th className="p-4">Nähe</th>
                    <th className="p-4">Phase</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContent.map(content => {
                    const phase = getPhaseById(content.phase);
                    const StatusIcon = statusConfig[content.status].icon;
                    return (
                      <tr key={content.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                        <td className="p-4 font-mono text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          {content.id}
                          {content.priority === 'high' && <Zap className="w-3 h-3 text-amber-400" />}
                        </span>
                      </td>
                        <td className="p-4">
                          <div className="font-medium text-sm">{content.title}</div>
                          <div className="text-xs text-slate-500">{content.desc}</div>
                        </td>
                        <td className="p-4 text-sm text-slate-400">{content.format}</td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded border ${proximityColors[content.proximity]}`}>
                            {content.proximity}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded border ${phase.lightColor}`}>
                            {phase.short}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className={`flex items-center gap-2 text-sm ${statusConfig[content.status].color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusConfig[content.status].label}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customer Journeys */}
        {activeTab === 'journeys' && (
          <div className="space-y-4">
            {journeys.map(journey => {
              const Icon = journey.icon;
              const isExpanded = selectedJourney === journey.id;
              return (
                <div key={journey.id} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                  <button
                    onClick={() => setSelectedJourney(isExpanded ? null : journey.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-slate-800/50 transition text-left"
                  >
                    <div className={`p-3 rounded-xl bg-${journey.color}-500/20`}>
                      <Icon className={`w-6 h-6 text-${journey.color}-400`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{journey.name}</h3>
                      <p className="text-sm text-slate-500">{journey.role}</p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="text-xs text-slate-500">Situation</p>
                      <p className="text-sm text-slate-400">{journey.situation}</p>
                    </div>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="border-t border-slate-800 p-4">
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-700" />
                        
                        {journey.steps.map((step, i) => {
                          const phase = getPhaseById(step.phase);
                          return (
                            <div key={i} className="relative pl-16 pb-6 last:pb-0">
                              {/* Timeline dot */}
                              <div className={`absolute left-4 w-5 h-5 rounded-full ${phase.color} border-4 border-slate-900`} />
                              
                              <div className="bg-slate-800/50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-xs px-2 py-0.5 rounded ${phase.lightColor}`}>
                                    Phase {step.phase}: {phase.short}
                                  </span>
                                </div>
                                
                                {step.trigger && (
                                  <p className="text-sm mb-2">
                                    <span className="text-slate-500">Auslöser:</span> {step.trigger}
                                  </p>
                                )}
                                
                                {step.search && (
                                  <p className="text-sm mb-2 text-slate-400 italic">
                                    🔍 Sucht: {step.search}
                                  </p>
                                )}
                                
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {step.content.map(id => {
                                    const content = getContentById(id);
                                    return content ? (
                                      <span key={id} className="text-xs px-2 py-1 bg-slate-700 rounded flex items-center gap-1">
                                        <span className="text-slate-500">{id}</span>
                                        <span className="text-slate-300">{content.title}</span>
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                                
                                {step.insight && (
                                  <p className="text-sm text-green-400/80 italic">
                                    💡 {step.insight}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
