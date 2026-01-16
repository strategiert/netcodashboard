import { useState } from 'react';
import { ChevronRight, ChevronDown, Users, FileText, Video, Calculator, BookOpen, Mic, Image, Mail, Target, CheckCircle2, Circle, Clock, Zap, HardHat, Building, Briefcase, ShoppingCart, UserCheck, Eye, EyeOff, Download, Globe, Linkedin, Youtube, Calendar, Flame, TrendingUp } from 'lucide-react';

const phases = [
  { id: 0, name: 'Chaos & Schmerz', short: 'Chaos', color: 'bg-red-600', lightColor: 'bg-red-500/20 text-red-400 border-red-500/30', mindset: '„Es läuft schon… irgendwie." – Risiken sichtbar machen, KEIN Produktbezug.' },
  { id: 1, name: 'Problembewusstsein & Ordnung', short: 'Problem', color: 'bg-amber-500', lightColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30', mindset: '„So kann es nicht weitergehen." – BauTV+ als Helfer, nicht Anbieter.' },
  { id: 2, name: 'Lösungsraum öffnen', short: 'Lösung', color: 'bg-sky-600', lightColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30', mindset: '„Es gibt Systeme dafür." – Experte für Baustellenorganisation.' },
  { id: 3, name: 'Produktnahe Aufklärung', short: 'Produkt', color: 'bg-emerald-600', lightColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', mindset: '„Portal vs. Kamera?" – Sanft aufklären, Kamera ent-emotionalisieren.' },
  { id: 4, name: 'Entscheidung & Conversion', short: 'Conversion', color: 'bg-purple-600', lightColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30', mindset: '„Wie läuft das mit euch?" – Abschluss ermöglichen.' },
];

const leadmagnets = [
  // Phase 0 – Chaos
  { id: 1, phase: 0, title: 'Baustellen-Chaos-Check', format: 'PDF + Score', goal: 'Schmerz sichtbar machen', status: 'planned' },
  { id: 2, phase: 0, title: 'Die 10 häufigsten Streitpunkte auf Baustellen', format: 'PDF', goal: 'Wiedererkennung', status: 'planned' },
  { id: 3, phase: 0, title: 'Warum Baustellen eskalieren (Ursachenanalyse)', format: 'PDF', goal: 'Vertrauen', status: 'planned' },
  { id: 4, phase: 0, title: 'Versteckte Kosten schlechter Kommunikation', format: 'PDF', goal: 'Kostenbewusstsein', status: 'planned' },
  { id: 5, phase: 0, title: 'Bauleiter-Stress-Test', format: 'Online-Check', goal: 'Emotionaler Einstieg', status: 'in-progress', priority: 'high' },
  // Phase 1 – Problem
  { id: 6, phase: 1, title: 'Welche Informationen Bauleiter wirklich brauchen', format: 'PDF', goal: 'Klarheit', status: 'planned' },
  { id: 7, phase: 1, title: 'Die perfekte Baustellen-Informationsbasis', format: 'PDF', goal: 'Struktur', status: 'planned' },
  { id: 8, phase: 1, title: 'Entscheidungsfindung auf Baustellen', format: 'Leitfaden', goal: 'Autorität', status: 'planned' },
  { id: 9, phase: 1, title: 'Wetter & Bauentscheidungen – Fakten statt Bauchgefühl', format: 'PDF', goal: 'Praxisnähe', status: 'planned' },
  { id: 10, phase: 1, title: 'Checkliste: Streit sachlich lösen', format: 'PDF', goal: 'Alltagshilfe', status: 'planned' },
  // Phase 2 – Lösung
  { id: 11, phase: 2, title: 'Digitale Baustellenorganisation – der Überblick', format: 'PDF', goal: 'Systemdenken', status: 'in-progress', priority: 'high' },
  { id: 12, phase: 2, title: 'Dokumentationsmethoden im Vergleich', format: 'Vergleichs-PDF', goal: 'Neutralität', status: 'planned' },
  { id: 13, phase: 2, title: 'Warum Fotos allein nicht reichen', format: 'PDF', goal: 'Perspektivwechsel', status: 'planned' },
  { id: 14, phase: 2, title: 'Baustellen-Transparenz-Framework', format: 'PDF', goal: 'Thought Leadership', status: 'planned' },
  { id: 15, phase: 2, title: 'Tools für Projektsteuerer – was wirklich hilft', format: 'PDF', goal: 'Zielgruppenfokus', status: 'planned' },
  // Phase 3 – Produkt
  { id: 16, phase: 3, title: 'Portal vs. Kamera – der große Unterschied', format: 'PDF', goal: 'Reframing', status: 'in-progress', priority: 'high' },
  { id: 17, phase: 3, title: 'Was kostet schlechte Dokumentation wirklich?', format: 'ROI-Rechner', goal: 'ROI', status: 'planned' },
  { id: 18, phase: 3, title: 'Demo-Baustelle mit Musterdaten', format: 'Portal-Demo', goal: 'Aha-Moment', status: 'in-progress' },
  // Phase 4 – Conversion
  { id: 19, phase: 4, title: 'Projektpreis-Rechner', format: 'Rechner', goal: 'Kaufreife', status: 'planned' },
  { id: 20, phase: 4, title: 'Welche BauTV+ Lösung passt zu meinem Projekt?', format: 'Entscheidungs-Guide', goal: 'Abschluss', status: 'planned' },
];

const contentClusters = [
  { id: 'A', name: 'Baustellenprobleme & Realität', proximity: 'neutral', desc: 'Konflikte, Kommunikation, Psychologie – 100% Zielgruppe, 0% Produkt',
    topics: ['Typische Baustellenkonflikte', 'Kommunikation zwischen Gewerken', 'Bauleiter zwischen allen Fronten', 'Warum Missverständnisse teuer sind', 'Verantwortung & Schuldfragen'] },
  { id: 'B', name: 'Baustellenorganisation', proximity: 'adjacent', desc: 'Organisation, Methoden, Informationsfluss',
    topics: ['Projektsteuerung vs. Bauleitung', 'Informationsfluss auf Baustellen', 'Entscheidungsfindung im Bau', 'Best Practices Bauleitung'] },
  { id: 'C', name: 'Dokumentation & Daten', proximity: 'nah', desc: 'Bautagesbericht, Fotos, Beweissicherung – BauTV+ wird natürlich relevant',
    topics: ['Bautagesbericht erstellen', 'Fotos richtig nutzen', 'Zeitraffer auf Baustellen', 'Dokumentationspflichten', 'Haftung & Dokumentation'] },
  { id: 'D', name: 'Wetter & Entscheidungen', proximity: 'nah', desc: 'Starker USP – Wetter als Differenzierung',
    topics: ['Wetter als Streitpunkt', 'Temperaturgrenzen Bau', 'Wetterdokumentation', 'Winterbau Entscheidungen', 'Rechtssicherheit Wetterdaten'] },
  { id: 'E', name: 'Digitale Baustelle 2026', proximity: 'adjacent', desc: 'Zukunft, Trends, Thought Leadership',
    topics: ['Digitalisierung Bau', 'Baustelle der Zukunft', 'Portale im Bau', 'Software für Bauleiter', 'Warum Hardware allein nicht reicht'] },
  { id: 'F', name: 'BauTV+ erklärt', proximity: 'sehr nah', desc: 'Produktnahe Inhalte für Conversion',
    topics: ['BauTV+ vs Baustellenkamera', 'BauTV+ vs Oculai', 'Kosten Baustellenkamera', 'BauTV+ Erfahrungen', 'BauTV+ Portal erklärt'] },
];

const journeys = [
  { id: 'bauleiter', icon: HardHat, name: 'Der gestresste Bauleiter', role: 'Bauleiter GU', situation: '„Ich hab keine Zeit für neue Tools"', color: 'orange',
    steps: [
      { phase: 0, trigger: 'Streit mit Dachdecker, WhatsApp-Chaos', search: '„Streit Baustelle Wetter"', content: ['Cluster A'], insight: '„Endlich sagt es mal jemand."' },
      { phase: 1, trigger: 'Liest Artikel „Warum Fotos nicht reichen"', content: ['LM 2', 'LM 6'], insight: '„Fehlende Daten, fehlende Historie."' },
      { phase: 2, trigger: 'Newsletter, Downloads', content: ['LM 11', 'LM 7'], insight: '„Wir brauchen Struktur – egal wie."' },
      { phase: 3, trigger: 'Artikel Portal vs. Kamera', content: ['LM 16'], insight: 'Aha-Moment: Kamera ≠ Produkt' },
      { phase: 4, trigger: 'Demo-Baustelle, Sales-Gespräch', content: ['LM 18', 'LM 19'], insight: '→ Pro-Paket, Kamera = logische Konsequenz' },
    ]
  },
  { id: 'gf', icon: Briefcase, name: 'Der Geschäftsführer', role: 'GF Bauunternehmen', situation: '„Kameras sind unnötige Kosten"', color: 'blue',
    steps: [
      { phase: 0, trigger: 'Streit eskaliert, Anwalt droht', search: '„Kosten Baustellenstreit"', content: ['LM 4'], insight: 'Rechnet innerlich mit.' },
      { phase: 1, trigger: 'Download Ursachenanalyse', content: ['LM 3'], insight: '„Das ist ein Führungsproblem."' },
      { phase: 2, trigger: 'PDF Dokumentationsmethoden', content: ['LM 12', 'LM 14'], insight: 'Versteht Systemdenken.' },
      { phase: 3, trigger: 'ROI-Rechner', content: ['LM 17'], insight: 'Sieht 5-stellige Beträge.' },
      { phase: 4, trigger: 'Beratungsgespräch', content: ['LM 20'], insight: '→ Enterprise / Projektpaket' },
    ]
  },
  { id: 'projektsteuerer', icon: UserCheck, name: 'Projektsteuerer / Architekt', role: 'Externer, mehrere Projekte', situation: '„Ich will Fakten, keine Diskussion"', color: 'teal',
    steps: [
      { phase: 0, trigger: 'Projektverzug, Bauherr misstraut', search: '„Baustellendokumentation Projektsteuerung"', content: ['Cluster C'], insight: 'Braucht neutrale Daten.' },
      { phase: 1, trigger: 'Artikel für Projektsteuerer', content: ['LM 15'], insight: 'Erkennt zentrale Datenbasis fehlt.' },
      { phase: 2, trigger: 'Framework Transparenz', content: ['LM 14'], insight: 'Versteht Lösungsraum.' },
      { phase: 3, trigger: 'Artikel Hardware allein reicht nicht', content: ['LM 16'], insight: 'Sieht Portal-Denke.' },
      { phase: 4, trigger: 'Demo, Empfehlung an Bauherrn', content: ['LM 18'], insight: '→ Multiplikator-Effekt' },
    ]
  },
  { id: 'einkauf', icon: ShoppingCart, name: 'Einkäufer / Vergabe', role: 'Einkauf / Vergabe', situation: '„Vergleichbarkeit & Preis"', color: 'purple',
    steps: [
      { phase: 3, trigger: 'Sucht „Baustellenkamera Vergleich"', content: ['LM 16', 'Cluster F'], insight: 'Sieht neutralen Vergleich.' },
      { phase: 4, trigger: 'Projektpreis-Rechner', content: ['LM 19', 'LM 20'], insight: '→ Entscheidung Pro / Projektpaket' },
    ]
  },
  { id: 'skeptiker', icon: EyeOff, name: 'Der Skeptiker', role: 'Typischer Marktfehler', situation: '„Wir brauchen das nicht"', color: 'slate',
    steps: [
      { phase: 0, trigger: 'Sieht LinkedIn-Post, ignoriert', content: ['Cluster A'], insight: 'Kein Interesse.' },
      { phase: 1, trigger: 'Wochen später: Newsletter „Der +3° Streit"', content: ['LM 9'], insight: 'Klickt erstmals.' },
      { phase: 0, trigger: 'Monate später: Streit eskaliert real', content: [], insight: '→ Erinnert sich an BauTV+ (Brand Memory)' },
    ]
  },
];

const redaktionsplan = {
  quarters: [
    { id: 'Q1', name: 'Q1 2026', title: 'Kaufnahe Inhalte', subtitle: 'Conversion & Entscheidung', color: 'bg-red-500', heat: 5, mindset: '„Wir brauchen jetzt eine Lösung"', goal: 'Pipeline füllen, Abschluss erleichtern' },
    { id: 'Q2', name: 'Q2 2026', title: 'Lösungsraum & Systemdenken', subtitle: 'Mid Funnel', color: 'bg-amber-500', heat: 3, mindset: '„Wir brauchen bessere Organisation"', goal: 'Reframing → „Es geht nicht um Kamera"' },
    { id: 'Q3', name: 'Q3 2026', title: 'Problembewusstsein & Alltag', subtitle: 'Early Funnel', color: 'bg-yellow-500', heat: 2, mindset: '„Warum ist das alles so anstrengend?"', goal: 'Früher auftauchen' },
    { id: 'Q4', name: 'Q4 2026', title: 'Reichweite, Marke & Zukunft', subtitle: 'Exposure', color: 'bg-emerald-500', heat: 1, mindset: '„Wie wird das in Zukunft laufen?"', goal: 'Thought Leadership, Brand Memory' },
  ],
  months: [
    { month: 'Januar', quarter: 'Q1', theme: 'Preis, Vergleich, Entscheidung', leadmagnet: 'Projektpreis-Rechner', content: ['BauTV+ vs. klassische Baustellenkamera', 'Was kostet eine Baustellenkamera wirklich?', 'Portal vs. Kamera – der große Unterschied'], cluster: 'Produktnah / Vergleich / Kosten', cta: 'Angebot / Beratung / Demo' },
    { month: 'Februar', quarter: 'Q1', theme: 'ROI & Wirtschaftlichkeit', leadmagnet: 'Was kostet schlechte Baustellendokumentation wirklich? (ROI-Rechner)', content: ['Die versteckten Kosten von Baustellenstreit', 'Warum ein vermiedener Streit BauTV+ bezahlt', 'Dokumentation als Risikomanagement'], cluster: 'Kosten, Risiko, Wirtschaftlichkeit', cta: 'ROI berechnen' },
    { month: 'März', quarter: 'Q1', theme: 'Projektstart & Hochsaison', leadmagnet: 'Welche BauTV+ Lösung passt zu meinem Projekt? (Entscheidungsguide)', content: ['Saisonstart: Was jetzt vorbereitet werden muss', 'Welche Lösung für welches Bauprojekt?', 'Typische Fehler beim Projektstart'], cluster: 'Projektstart, Entscheidungsfindung', cta: 'Beratung buchen' },
    { month: 'April', quarter: 'Q2', theme: 'Dokumentation richtig machen', leadmagnet: 'Baustellendokumentation richtig machen (Leitfaden)', content: ['Bautagesbericht vs. Projektbericht', 'Beweissicherung auf Baustellen', 'Dokumentationspflichten im Bau'], cluster: 'Dokumentation, Recht, Haftung', cta: 'Leitfaden laden' },
    { month: 'Mai', quarter: 'Q2', theme: 'Digitale Baustellenorganisation', leadmagnet: 'Digitale Baustellenorganisation – der Überblick', content: ['Wie moderne Baustellen organisiert sind', 'Projektsteuerung vs. Bauleitung', 'Informationsfluss im Bau'], cluster: 'Organisation, Prozesse, Methoden', cta: 'Überblick laden' },
    { month: 'Juni', quarter: 'Q2', theme: 'Transparenz & Kontrolle', leadmagnet: 'Baustellen-Transparenz-Framework', content: ['Transparenz ohne Mikromanagement', 'Warum Kontrolle Vertrauen schafft', 'Fakten statt Bauchgefühl'], cluster: 'Transparenz, Führung, Steuerung', cta: 'Framework laden' },
    { month: 'Juli', quarter: 'Q3', theme: 'Streit & Konflikte', leadmagnet: 'Die 10 häufigsten Streitpunkte auf Baustellen', content: ['Warum Baustellen eskalieren', 'Psychologie auf Baustellen', 'Schuldfragen & Missverständnisse'], cluster: 'Konflikte, Kommunikation', cta: 'Checkliste laden' },
    { month: 'August', quarter: 'Q3', theme: 'Bauleiter & Stress', leadmagnet: 'Bauleiter-Stress-Test', content: ['Alltag eines Bauleiters', 'Warum Bauleiter zwischen allen Fronten stehen', 'Entscheidungsdruck im Bau'], cluster: 'Rolle Bauleiter, Stress, Verantwortung', cta: 'Stress-Test starten' },
    { month: 'September', quarter: 'Q3', theme: 'Wetter & Entscheidungen', leadmagnet: 'Wetter & Bauentscheidungen – Fakten statt Bauchgefühl', content: ['Wetter als Streitpunkt', 'Temperaturgrenzen im Bau', 'Winterbau vorbereiten'], cluster: 'Wetter, Entscheidungen, Praxis', cta: 'Wetter-Guide laden' },
    { month: 'Oktober', quarter: 'Q4', theme: 'Digitale Baustelle', leadmagnet: 'Digitale Baustelle 2027', content: ['Baustelle der Zukunft', 'Warum Hardware allein nicht reicht', 'Portale im Bauwesen'], cluster: 'Digitalisierung Bau', cta: 'Whitepaper laden' },
    { month: 'November', quarter: 'Q4', theme: 'Rückblick & Learnings', leadmagnet: 'Die größten Baustellenfehler 2026', content: ['Top 5 Fehler aus echten Projekten', 'Was 2026 schiefging', 'Was Bauunternehmen gelernt haben'], cluster: 'Learnings, Best Practices', cta: 'Report laden' },
    { month: 'Dezember', quarter: 'Q4', theme: 'Strategie & Planung', leadmagnet: 'Baustellen-Strategie-Check 2027', content: ['Planung für 2027', 'Budget, Organisation, Tools', 'Was Bauunternehmen jetzt vorbereiten sollten'], cluster: 'Strategie, Planung', cta: 'Check starten' },
  ]
};

const proximityColors = {
  'sehr nah': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'nah': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  'adjacent': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'neutral': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const statusConfig = {
  'planned': { label: 'Geplant', icon: Circle, color: 'text-slate-400' },
  'in-progress': { label: 'In Arbeit', icon: Clock, color: 'text-amber-400' },
  'done': { label: 'Fertig', icon: CheckCircle2, color: 'text-emerald-400' },
};

export default function BauTVMarketingPlan() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [expandedCluster, setExpandedCluster] = useState(null);
  const [expandedQuarter, setExpandedQuarter] = useState('Q1');
  const [expandedMonth, setExpandedMonth] = useState(null);

  const getPhaseById = (id) => phases.find(p => p.id === id);
  
  const stats = {
    total: leadmagnets.length,
    priority: leadmagnets.filter(l => l.priority === 'high').length,
    planned: leadmagnets.filter(l => l.status === 'planned').length,
    inProgress: leadmagnets.filter(l => l.status === 'in-progress').length,
    done: leadmagnets.filter(l => l.status === 'done').length,
    clusters: contentClusters.length,
  };

  const filteredLeadmagnets = selectedPhase !== null
    ? leadmagnets.filter(l => l.phase === selectedPhase)
    : leadmagnets;

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#003366' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold" style={{ color: '#003366' }}>Bau</span>
            <span className="text-3xl font-bold" style={{ color: '#ff6600' }}>TV+</span>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <h1 className="text-2xl font-bold">Marketing-Plan</h1>
            <p className="text-sky-200/70 text-sm">Content-Strategie entlang der Customer Journey</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
          <div className="p-4 rounded-xl border" style={{ backgroundColor: '#004d99', borderColor: '#004d99' }}>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-sky-200/70">Leadmagnete</div>
          </div>
          <div className="p-4 rounded-xl border" style={{ backgroundColor: '#004d99', borderColor: '#ff6600' }}>
            <div className="text-3xl font-bold flex items-center gap-2" style={{ color: '#ff6600' }}>{stats.priority} <Zap className="w-5 h-5" /></div>
            <div className="text-sm text-sky-200/70">High Priority</div>
          </div>
          <div className="p-4 rounded-xl border" style={{ backgroundColor: '#004d99', borderColor: '#004d99' }}>
            <div className="text-3xl font-bold text-slate-300">{stats.planned}</div>
            <div className="text-sm text-sky-200/70">Geplant</div>
          </div>
          <div className="p-4 rounded-xl border" style={{ backgroundColor: '#004d99', borderColor: '#004d99' }}>
            <div className="text-3xl font-bold text-amber-400">{stats.inProgress}</div>
            <div className="text-sm text-sky-200/70">In Arbeit</div>
          </div>
          <div className="p-4 rounded-xl border" style={{ backgroundColor: '#004d99', borderColor: '#004d99' }}>
            <div className="text-3xl font-bold text-emerald-400">{stats.done}</div>
            <div className="text-sm text-sky-200/70">Fertig</div>
          </div>
          <div className="p-4 rounded-xl border" style={{ backgroundColor: '#004d99', borderColor: '#004d99' }}>
            <div className="text-3xl font-bold text-sky-300">{stats.clusters}</div>
            <div className="text-sm text-sky-200/70">SEO-Cluster</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-sky-800 pb-4 overflow-x-auto">
          {[
            { id: 'overview', label: 'Funnel-Übersicht' },
            { id: 'redaktion', label: 'Redaktionsplan 2026' },
            { id: 'leadmagnets', label: 'Leadmagnete (20)' },
            { id: 'clusters', label: 'SEO-Cluster' },
            { id: 'journeys', label: 'Customer Journeys' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg font-medium transition whitespace-nowrap"
              style={{ 
                backgroundColor: activeTab === tab.id ? '#ff6600' : '#004d99',
                color: 'white'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Funnel Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {phases.map(phase => {
              const phaseLeadmagnets = leadmagnets.filter(l => l.phase === phase.id);
              const phaseCluster = contentClusters.filter(c => 
                (phase.id === 0 && c.proximity === 'neutral') ||
                (phase.id === 1 && c.proximity === 'adjacent') ||
                (phase.id === 2 && (c.proximity === 'adjacent' || c.proximity === 'nah')) ||
                (phase.id === 3 && c.proximity === 'nah') ||
                (phase.id === 4 && c.proximity === 'sehr nah')
              );
              return (
                <div key={phase.id} className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#004d99', borderColor: '#003366' }}>
                  <div className="p-4 border-b flex items-center gap-4" style={{ borderColor: '#003366' }}>
                    <div className={`w-2 h-12 rounded-full ${phase.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-sky-300/70">Phase {phase.id}</span>
                        <h3 className="font-semibold">{phase.name}</h3>
                        <span className="text-xs px-2 py-1 rounded-full text-sky-200/70" style={{ backgroundColor: '#003366' }}>
                          {phaseLeadmagnets.length} Leadmagnete
                        </span>
                      </div>
                      <p className="text-sm text-sky-200/70 mt-1">{phase.mindset}</p>
                    </div>
                  </div>
                  <div className="p-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {phaseLeadmagnets.map(lm => {
                      const StatusIcon = statusConfig[lm.status].icon;
                      return (
                        <div key={lm.id} className="p-3 rounded-lg border transition hover:border-sky-500" style={{ backgroundColor: '#003366', borderColor: '#004d99' }}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-sky-300/70">#{lm.id}</span>
                              {lm.priority === 'high' && <Zap className="w-3 h-3" style={{ color: '#ff6600' }} />}
                            </div>
                            <StatusIcon className={`w-4 h-4 ${statusConfig[lm.status].color}`} />
                          </div>
                          <h4 className="font-medium text-sm mb-1">{lm.title}</h4>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#004d99' }}>{lm.format}</span>
                            <span className="text-xs px-2 py-0.5 rounded text-sky-300/70" style={{ backgroundColor: '#004d99' }}>{lm.goal}</span>
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

        {/* Redaktionsplan 2026 */}
        {activeTab === 'redaktion' && (
          <div className="space-y-6">
            {/* Quarterly Overview */}
            <div className="grid md:grid-cols-4 gap-4">
              {redaktionsplan.quarters.map(q => (
                <button
                  key={q.id}
                  onClick={() => setExpandedQuarter(q.id)}
                  className={`p-4 rounded-xl border text-left transition ${expandedQuarter === q.id ? 'ring-2 ring-orange-500' : ''}`}
                  style={{ backgroundColor: '#004d99', borderColor: expandedQuarter === q.id ? '#ff6600' : '#003366' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${q.color} text-white`}>{q.id}</span>
                    <div className="flex">
                      {[...Array(q.heat)].map((_, i) => (
                        <Flame key={i} className="w-4 h-4" style={{ color: '#ff6600' }} />
                      ))}
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm">{q.title}</h3>
                  <p className="text-xs text-sky-200/70">{q.subtitle}</p>
                </button>
              ))}
            </div>

            {/* Quarter Detail */}
            {expandedQuarter && (
              <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#004d99', borderColor: '#003366' }}>
                {(() => {
                  const quarter = redaktionsplan.quarters.find(q => q.id === expandedQuarter);
                  const quarterMonths = redaktionsplan.months.filter(m => m.quarter === expandedQuarter);
                  return (
                    <>
                      <div className="p-4 border-b flex items-center gap-4" style={{ borderColor: '#003366' }}>
                        <div className={`w-2 h-12 rounded-full ${quarter.color}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg">{quarter.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded ${quarter.color} text-white`}>{quarter.title}</span>
                          </div>
                          <p className="text-sm text-sky-200/70 mt-1">
                            <strong>Ziel:</strong> {quarter.goal} · <strong>Mindset:</strong> {quarter.mindset}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-sky-300/70 mr-2">Nähe zum Kauf:</span>
                          {[...Array(5)].map((_, i) => (
                            <Flame key={i} className={`w-4 h-4 ${i < quarter.heat ? '' : 'opacity-20'}`} style={{ color: '#ff6600' }} />
                          ))}
                        </div>
                      </div>
                      
                      <div className="divide-y" style={{ borderColor: '#003366' }}>
                        {quarterMonths.map(month => {
                          const isExpanded = expandedMonth === month.month;
                          return (
                            <div key={month.month}>
                              <button
                                onClick={() => setExpandedMonth(isExpanded ? null : month.month)}
                                className="w-full p-4 flex items-center gap-4 hover:bg-sky-900/20 transition text-left"
                              >
                                <Calendar className="w-5 h-5 text-sky-400" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <h4 className="font-semibold">{month.month}</h4>
                                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#003366' }}>{month.theme}</span>
                                  </div>
                                  <p className="text-sm text-sky-200/70 mt-1">
                                    <span style={{ color: '#ff6600' }}>📥</span> {month.leadmagnet}
                                  </p>
                                </div>
                                {isExpanded ? <ChevronDown className="w-5 h-5 text-sky-300" /> : <ChevronRight className="w-5 h-5 text-sky-300" />}
                              </button>
                              
                              {isExpanded && (
                                <div className="px-4 pb-4 pl-14">
                                  <div className="rounded-lg p-4" style={{ backgroundColor: '#003366' }}>
                                    <div className="grid md:grid-cols-2 gap-4">
                                      <div>
                                        <h5 className="text-xs font-semibold text-sky-300/70 uppercase mb-2">Content-Themen</h5>
                                        <ul className="space-y-1">
                                          {month.content.map((c, i) => (
                                            <li key={i} className="text-sm flex items-start gap-2">
                                              <FileText className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                                              {c}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div>
                                        <h5 className="text-xs font-semibold text-sky-300/70 uppercase mb-2">SEO-Cluster</h5>
                                        <p className="text-sm mb-3">{month.cluster}</p>
                                        
                                        <h5 className="text-xs font-semibold text-sky-300/70 uppercase mb-2">CTA</h5>
                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium" style={{ backgroundColor: '#ff6600' }}>
                                          <TrendingUp className="w-4 h-4" />
                                          {month.cta}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Strategie-Hinweis */}
            <div className="rounded-xl p-4 border" style={{ backgroundColor: '#004d99', borderColor: '#ff6600' }}>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" style={{ color: '#ff6600' }} />
                Warum dieser Plan stark ist
              </h4>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div><strong className="text-red-400">Q1:</strong> Vertrieb bekommt früh Leads</div>
                <div><strong className="text-amber-400">Q2:</strong> Marketing baut Tiefe & Vertrauen</div>
                <div><strong className="text-yellow-400">Q3:</strong> SEO wächst nachhaltig</div>
                <div><strong className="text-emerald-400">Q4:</strong> Marke wird gesetzt</div>
              </div>
              <p className="text-sm text-sky-200/70 mt-3">→ Alle Inhalte verlinken zurück zu: Demo, Rechner, Entscheidungsguide, Newsletter</p>
            </div>
          </div>
        )}

        {/* Leadmagnets List */}
        {activeTab === 'leadmagnets' && (
          <div>
            {/* Phase Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedPhase(null)}
                className="px-3 py-1.5 rounded-lg text-sm transition"
                style={{ 
                  backgroundColor: selectedPhase === null ? '#ff6600' : '#004d99',
                  color: 'white'
                }}
              >
                Alle Phasen
              </button>
              {phases.map(phase => (
                <button
                  key={phase.id}
                  onClick={() => setSelectedPhase(phase.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2 ${
                    selectedPhase === phase.id ? `${phase.color} text-white` : ''
                  }`}
                  style={{ 
                    backgroundColor: selectedPhase === phase.id ? undefined : '#004d99',
                    color: 'white'
                  }}
                >
                  <span className={`w-2 h-2 rounded-full ${selectedPhase === phase.id ? 'bg-white' : phase.color}`} />
                  {phase.short}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#004d99', borderColor: '#003366' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-sky-200/70" style={{ borderColor: '#003366' }}>
                    <th className="p-4">#</th>
                    <th className="p-4">Leadmagnet</th>
                    <th className="p-4">Format</th>
                    <th className="p-4">Ziel</th>
                    <th className="p-4">Phase</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeadmagnets.map(lm => {
                    const phase = getPhaseById(lm.phase);
                    const StatusIcon = statusConfig[lm.status].icon;
                    return (
                      <tr key={lm.id} className="border-b transition hover:bg-sky-900/20" style={{ borderColor: '#003366' }}>
                        <td className="p-4 font-mono text-sm text-sky-300/70">
                          <span className="flex items-center gap-1">
                            {lm.id}
                            {lm.priority === 'high' && <Zap className="w-3 h-3" style={{ color: '#ff6600' }} />}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-sm">{lm.title}</div>
                        </td>
                        <td className="p-4 text-sm text-sky-200/70">{lm.format}</td>
                        <td className="p-4 text-sm text-sky-200/70">{lm.goal}</td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded border ${phase.lightColor}`}>
                            {phase.short}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className={`flex items-center gap-2 text-sm ${statusConfig[lm.status].color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusConfig[lm.status].label}
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

        {/* SEO Clusters */}
        {activeTab === 'clusters' && (
          <div className="space-y-4">
            {contentClusters.map(cluster => {
              const isExpanded = expandedCluster === cluster.id;
              return (
                <div key={cluster.id} className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#004d99', borderColor: '#003366' }}>
                  <button
                    onClick={() => setExpandedCluster(isExpanded ? null : cluster.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-sky-900/20 transition text-left"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl" style={{ backgroundColor: '#003366' }}>
                      {cluster.id}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{cluster.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded border ${proximityColors[cluster.proximity]}`}>
                          {cluster.proximity}
                        </span>
                      </div>
                      <p className="text-sm text-sky-200/70 mt-1">{cluster.desc}</p>
                    </div>
                    <div className="text-sm text-sky-300/70">{cluster.topics.length} Themen</div>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-sky-300" /> : <ChevronRight className="w-5 h-5 text-sky-300" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="border-t p-4" style={{ borderColor: '#003366' }}>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {cluster.topics.map((topic, i) => (
                          <div key={i} className="p-3 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: '#003366' }}>
                            <Globe className="w-4 h-4 text-sky-400" />
                            {topic}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t flex gap-2" style={{ borderColor: '#003366' }}>
                        <span className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ backgroundColor: '#003366' }}>
                          <FileText className="w-3 h-3" /> Blog
                        </span>
                        <span className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ backgroundColor: '#003366' }}>
                          <Linkedin className="w-3 h-3" /> LinkedIn
                        </span>
                        <span className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ backgroundColor: '#003366' }}>
                          <Youtube className="w-3 h-3" /> YouTube
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Customer Journeys */}
        {activeTab === 'journeys' && (
          <div className="space-y-4">
            {journeys.map(journey => {
              const Icon = journey.icon;
              const isExpanded = selectedJourney === journey.id;
              return (
                <div key={journey.id} className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#004d99', borderColor: '#003366' }}>
                  <button
                    onClick={() => setSelectedJourney(isExpanded ? null : journey.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-sky-900/20 transition text-left"
                  >
                    <div className="p-3 rounded-xl" style={{ backgroundColor: '#003366' }}>
                      <Icon className="w-6 h-6" style={{ color: '#ff6600' }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{journey.name}</h3>
                      <p className="text-sm text-sky-200/70">{journey.role}</p>
                    </div>
                    <div className="text-right mr-4 hidden md:block">
                      <p className="text-xs text-sky-300/70">Mindset</p>
                      <p className="text-sm text-sky-200">{journey.situation}</p>
                    </div>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-sky-300" /> : <ChevronRight className="w-5 h-5 text-sky-300" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="border-t p-4" style={{ borderColor: '#003366' }}>
                      <div className="relative">
                        <div className="absolute left-6 top-8 bottom-8 w-0.5" style={{ backgroundColor: '#003366' }} />
                        
                        {journey.steps.map((step, i) => {
                          const phase = getPhaseById(step.phase);
                          return (
                            <div key={i} className="relative pl-16 pb-6 last:pb-0">
                              <div className={`absolute left-4 w-5 h-5 rounded-full ${phase.color} border-4`} style={{ borderColor: '#004d99' }} />
                              
                              <div className="rounded-lg p-4" style={{ backgroundColor: '#003366' }}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-xs px-2 py-0.5 rounded ${phase.lightColor}`}>
                                    Phase {step.phase}: {phase.short}
                                  </span>
                                </div>
                                
                                {step.trigger && (
                                  <p className="text-sm mb-2">
                                    <span className="text-sky-300/70">Auslöser:</span> {step.trigger}
                                  </p>
                                )}
                                
                                {step.search && (
                                  <p className="text-sm mb-2 text-sky-300 italic">
                                    🔍 Sucht: {step.search}
                                  </p>
                                )}
                                
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {step.content.map((c, j) => (
                                    <span key={j} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#004d99' }}>
                                      {c}
                                    </span>
                                  ))}
                                </div>
                                
                                {step.insight && (
                                  <p className="text-sm italic" style={{ color: '#ff8533' }}>
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
