import React, { useState } from 'react';
import { Camera, Users, Target, TrendingUp, FileText, AlertTriangle, CheckCircle, Clock, Building, Shield, Truck, ChevronRight, BarChart3, Lightbulb, MessageSquare, Zap, Award, Heart, DollarSign, Scale, Monitor, Phone, Mail, Calendar, ArrowRight, Play, BookOpen, PieChart } from 'lucide-react';

const NetCoBodyCamDashboard = () => {
  const [activeTab, setActiveTab] = useState('phasen');
  const [activePhase, setActivePhase] = useState(1);
  const [activeSzenario, setActiveSzenario] = useState('oepnv');
  const [activeStakeholder, setActiveStakeholder] = useState(null);

  // Brand Colors
  const colors = {
    primary: '#003366',
    secondary: '#ff6600',
    accent: '#1a365d',
    light: '#f1f5f9',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  // Phasen-Daten
  const phasen = [
    {
      id: 1,
      name: 'Unbewusstes Problem',
      zeitraum: 'Monate 1-3',
      bewusstsein: '"Ist halt so"',
      hauptakteure: 'Mitarbeiter leiden still',
      kernAktivitaet: 'Status Quo akzeptieren',
      icon: AlertTriangle,
      color: '#94a3b8',
      marketing: ['Display-Ads (Awareness)', 'Newsletter im Hintergrund', 'Social Proof Posts'],
      content: ['Branchenstatistiken', 'Studien zu Übergriffszahlen', 'Best Practice anderer Städte'],
      touchpoints: ['Remarketing-Pixel setzen', 'LinkedIn Awareness', 'Fachzeitschriften']
    },
    {
      id: 2,
      name: 'Problem-Bewusstsein',
      zeitraum: 'Monate 4-5',
      bewusstsein: '"So kanns nicht weitergehen"',
      hauptakteure: 'BR/Führung diskutiert',
      kernAktivitaet: 'Problem artikulieren',
      icon: Target,
      color: '#f59e0b',
      marketing: ['Remarketing aktivieren', 'News-Jacking', 'Case Studies pushen'],
      content: ['Whitepaper: DSGVO-Leitfaden', 'ROI-Kalkulator', 'Praxisbeispiele (Hamburg, Wien)'],
      touchpoints: ['LinkedIn-Posts zu aktuellen Vorfällen', 'Newsletter-Anmeldung', 'Webinar-Einladungen']
    },
    {
      id: 3,
      name: 'Lösungssuche',
      zeitraum: 'Monat 6',
      bewusstsein: '"Was gibt es für Optionen?"',
      hauptakteure: 'Task Force recherchiert',
      kernAktivitaet: 'Möglichkeiten erkunden',
      icon: FileText,
      color: '#3b82f6',
      marketing: ['Webinare anbieten', 'Vergleichsrechner', 'Tech-Dokumentation'],
      content: ['Case Study: Deutsche Bahn', 'Muster-Betriebsvereinbarung', 'Tech-Specs für IT'],
      touchpoints: ['Webinar-Follow-up', 'Persönliche Beratung', 'ROI-Rechner-Tool']
    },
    {
      id: 4,
      name: 'Anbieter-Evaluation',
      zeitraum: 'Monate 7-8',
      bewusstsein: '"Wer ist der Richtige?"',
      hauptakteure: 'Buying Center prüft',
      kernAktivitaet: 'Anbieter vergleichen',
      icon: Scale,
      color: '#8b5cf6',
      marketing: ['Persönlicher Berater', 'Vor-Ort-Demos', 'Referenzbesuche'],
      content: ['Individuelles Angebot', 'TCO-Rechner', 'Zertifikate & Prüfberichte'],
      touchpoints: ['Demo-Termin', 'Testgeräte', 'Referenzgespräche arrangieren']
    },
    {
      id: 5,
      name: 'Kaufentscheidung',
      zeitraum: 'Monat 9',
      bewusstsein: '"NetCo ist es"',
      hauptakteure: 'Alle unterschreiben',
      kernAktivitaet: 'Implementierung starten',
      icon: CheckCircle,
      color: '#22c55e',
      marketing: ['Account Manager vor Ort', 'CEO-Letter', 'Pressepaket'],
      content: ['Implementierungs-Roadmap', 'Schulungspaket', 'PR-Vorlagen'],
      touchpoints: ['Vertragsabschluss', '30-Tage-Testphase', 'Rollout-Planung']
    }
  ];

  // Szenarien-Daten
  const szenarien = {
    oepnv: {
      name: 'ÖPNV / Verkehrsbetriebe',
      beispiel: 'Stadtwerke Münsterland',
      mitarbeiter: '450 MA, 120 Kontrolldienst',
      icon: Truck,
      besonderheiten: ['Hohe öffentliche Wahrnehmung', 'Betriebsrat-Einbindung', 'DSGVO-Sensibilität'],
      trigger: 'Schwerer Übergriff mit Medienecho',
      entscheider: ['Geschäftsführung', 'Betriebsrat', 'HR', 'IT', 'Datenschutz'],
      zeitraum: '9 Monate',
      erfolg: '-67% Übergriffe, ROI nach 4 Monaten'
    },
    sicherheit: {
      name: 'Sicherheitsdienstleister',
      beispiel: 'SecureRail GmbH',
      mitarbeiter: '850 MA in 5 Bundesländern',
      icon: Shield,
      besonderheiten: ['Hohe Fluktuation (40%)', 'Margin-Druck', 'Ausschreibungswettbewerb'],
      trigger: 'Verlorene Ausschreibung wegen Beschwerden',
      entscheider: ['Geschäftsführung', 'Einsatzleitung', 'Kunden', 'Mitarbeiter'],
      zeitraum: '6-8 Monate',
      erfolg: 'Ausschreibung gewonnen, -55% Fluktuation'
    },
    feuerwehr: {
      name: 'Feuerwehr / Rettungsdienst',
      beispiel: 'Berufsfeuerwehr Frankfurt',
      mitarbeiter: '1.450 Einsatzkräfte',
      icon: Heart,
      besonderheiten: ['Helden-Image', 'Extreme Einsatzbedingungen', 'Politische Dimension'],
      trigger: 'Virales Video eines Angriffs',
      entscheider: ['Branddirektion', 'Personalrat', 'Politik', 'Öffentlichkeit'],
      zeitraum: '4-5 Monate (schneller wg. Politik)',
      erfolg: '-72% Gewalt, Landesweite Einführung'
    },
    polizei: {
      name: 'Polizei / Ordnungsamt',
      beispiel: 'Ordnungsamt Duisburg',
      mitarbeiter: 'Variabel',
      icon: Building,
      besonderheiten: ['Behördliche Beschaffung', 'Lange Entscheidungswege', 'Rechtliche Komplexität'],
      trigger: 'Politische Vorgabe oder schwerer Vorfall',
      entscheider: ['Amtsleitung', 'Personalrat', 'Kämmerer', 'Politik'],
      zeitraum: '12-18 Monate',
      erfolg: '-60% Konflikte, Deeskalation in 75% der Fälle'
    }
  };

  // Stakeholder-Daten
  const stakeholder = [
    {
      id: 'klaus',
      name: 'Klaus',
      rolle: 'Kontrolleur / Einsatzkraft',
      alter: '45-55',
      typ: 'Praktiker',
      icon: Users,
      pain: ['Tägliche Übergriffe', 'Fühlt sich ungeschützt', 'Überlegt zu kündigen'],
      gain: ['Sicherheit', 'Beweismittel bei Vorwürfen', 'Deeskalation'],
      content: ['Praxisvideos', 'Kollegen-Testimonials', 'Einfache Bedienung zeigen'],
      kanal: ['WhatsApp-Gruppen', 'Kollegen-Empfehlung', 'Messen'],
      zitat: '"Hätten wir schon früher machen sollen"'
    },
    {
      id: 'sandra',
      name: 'Sandra',
      rolle: 'Teamleitung / Einsatzleitung',
      alter: '35-45',
      typ: 'Organisator',
      icon: Target,
      pain: ['Krankmeldungen steigen', 'Kündigungen häufen sich', 'Muss Lösungen finden'],
      gain: ['Messbare Verbesserung', 'Weniger Ausfälle', 'Karrierechance'],
      content: ['ROI-Rechner', 'Case Studies', 'Implementierungspläne'],
      kanal: ['LinkedIn', 'Fachzeitschriften', 'Webinare'],
      zitat: '"Die Zahlen sprechen für sich"'
    },
    {
      id: 'thomas',
      name: 'Thomas',
      rolle: 'Geschäftsführung',
      alter: '50-60',
      typ: 'Entscheider',
      icon: Building,
      pain: ['Presseanfragen', 'Politischer Druck', 'Haftungsrisiko'],
      gain: ['Reputation', 'Risikominimierung', 'Employer Branding'],
      content: ['Business Case', 'Pressepaket', 'CEO-Testimonials'],
      kanal: ['Persönliche Beziehungen', 'Vorstand-Netzwerk', 'Referenzen'],
      zitat: '"Beste Entscheidung des Jahres"'
    },
    {
      id: 'ralf',
      name: 'Ralf',
      rolle: 'Betriebsrat',
      alter: '45-55',
      typ: 'Mitarbeiter-Vertreter',
      icon: Shield,
      pain: ['Mitarbeiter fordern Schutz', 'Datenschutz-Bedenken', 'Betriebsvereinbarung nötig'],
      gain: ['Erfolg für Belegschaft', 'Kontrolle über Nutzung', 'Klare Regeln'],
      content: ['Muster-Betriebsvereinbarung', 'DSGVO-Leitfaden', 'Mitarbeiter-Umfragen'],
      kanal: ['Gewerkschaft', 'Personalversammlung', 'Interne Kommunikation'],
      zitat: '"89% der Belegschaft sind dafür"'
    },
    {
      id: 'stefan',
      name: 'Stefan',
      rolle: 'IT-Leitung',
      alter: '35-50',
      typ: 'Techniker (skeptisch)',
      icon: Monitor,
      pain: ['Datenschutz-Risiken', 'Integration in bestehende Systeme', 'Support-Aufwand'],
      gain: ['Deutsche Server', 'API-Anbindung', 'Zuverlässiger Support'],
      content: ['Tech-Specs', 'API-Dokumentation', 'Zertifikate'],
      kanal: ['Tech-Blogs', 'Persönlicher Support', 'Demo-Zugang'],
      zitat: '"Endlich mal was, das funktioniert"'
    },
    {
      id: 'frank',
      name: 'Frank',
      rolle: 'Einkauf / Finanzen',
      alter: '40-55',
      typ: 'Kostenoptimierer',
      icon: DollarSign,
      pain: ['Budget-Druck', 'ROI-Nachweis nötig', 'Verhandlungsmacht'],
      gain: ['Mietmodell statt Investition', 'TCO-Transparenz', 'VBG-Förderung'],
      content: ['TCO-Rechner', 'Mietmodell-Erklärung', 'Fördermittel-Guide'],
      kanal: ['Angebotsvergleich', 'Verhandlungsgespräche', 'Rahmenverträge'],
      zitat: '"Keine Investition, nur Betriebskosten!"'
    }
  ];

  // Content-Formate nach Phase
  const contentFormateNachPhase = {
    1: [
      { format: 'Awareness Ads', beschreibung: 'Display-Kampagnen ohne Kaufdruck', ziel: 'Markenbekanntheit' },
      { format: 'Branchenstatistiken', beschreibung: 'Daten zu Übergriffszahlen im ÖPNV/Sicherheit', ziel: 'Problem bewusst machen' },
      { format: 'Social Media Posts', beschreibung: 'Best Practice Stories (Hamburg, Wien)', ziel: 'Social Proof aufbauen' }
    ],
    2: [
      { format: 'News-Jacking', beschreibung: 'Reaktion auf aktuelle Vorfälle', ziel: 'Relevanz zeigen' },
      { format: 'Whitepaper', beschreibung: 'DSGVO-Leitfaden, Rechtssicherheit', ziel: 'Expertise beweisen' },
      { format: 'Case Studies', beschreibung: 'Hamburg ÖPNV, Wiener Linien', ziel: 'Erfolgsnachweis' }
    ],
    3: [
      { format: 'Webinare', beschreibung: 'Live-Demos mit Q&A', ziel: 'Interaktion & Vertrauen' },
      { format: 'ROI-Rechner', beschreibung: 'Interaktives Tool zur Kostenberechnung', ziel: 'Business Case erstellen' },
      { format: 'Vergleichstabellen', beschreibung: 'Bodycam vs. Alternativen', ziel: 'Entscheidungshilfe' }
    ],
    4: [
      { format: 'Vor-Ort-Demos', beschreibung: 'Persönliche Produktvorführung', ziel: 'Hands-on Erlebnis' },
      { format: 'Referenzbesuche', beschreibung: 'Besuch bei bestehenden Kunden', ziel: 'Vertrauensaufbau' },
      { format: 'Individuelles Angebot', beschreibung: 'Maßgeschneiderte Lösung', ziel: 'Konkretisierung' }
    ],
    5: [
      { format: 'Implementierungsplan', beschreibung: 'Detaillierte Rollout-Roadmap', ziel: 'Sicherheit geben' },
      { format: 'Schulungspaket', beschreibung: 'Training für Mitarbeiter', ziel: 'Erfolgreicher Start' },
      { format: 'PR-Paket', beschreibung: 'Pressemitteilung, Social Media', ziel: 'Positive Kommunikation' }
    ]
  };

  // KPIs und Erfolgsmetriken
  const erfolgsmetriken = [
    { label: 'Übergriffe reduziert', wert: '67-75%', icon: TrendingUp, color: '#22c55e' },
    { label: 'Deeskalation durch Display', wert: '50-75%', icon: Target, color: '#3b82f6' },
    { label: 'ROI erreicht nach', wert: '4 Monate', icon: DollarSign, color: '#f59e0b' },
    { label: 'Mitarbeiterzufriedenheit', wert: '95%', icon: Heart, color: '#ec4899' },
    { label: 'Krankenstand reduziert', wert: '30%', icon: CheckCircle, color: '#22c55e' },
    { label: 'Bewerber-Anstieg', wert: '+45%', icon: Users, color: '#8b5cf6' }
  ];

  // Render-Funktionen
  const renderPhasenOverview = () => (
    <div className="space-y-6">
      {/* Phase Timeline */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Clock className="w-6 h-6 text-orange-500" />
          Customer Journey Timeline
        </h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {phasen.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setActivePhase(phase.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                activePhase === phase.id 
                  ? 'bg-blue-900 text-white shadow-lg scale-105' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <phase.icon className="w-5 h-5" />
              <span className="font-medium">Phase {phase.id}</span>
            </button>
          ))}
        </div>

        {/* Active Phase Details */}
        {phasen.filter(p => p.id === activePhase).map(phase => (
          <div key={phase.id} className="border-l-4 pl-6 py-4" style={{ borderColor: phase.color }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full" style={{ backgroundColor: phase.color + '20' }}>
                <phase.icon className="w-8 h-8" style={{ color: phase.color }} />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-800">{phase.name}</h4>
                <p className="text-gray-500">{phase.zeitraum}</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Bewusstsein</p>
                <p className="font-semibold text-gray-800">{phase.bewusstsein}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Hauptakteure</p>
                <p className="font-semibold text-gray-800">{phase.hauptakteure}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Kern-Aktivität</p>
                <p className="font-semibold text-gray-800">{phase.kernAktivitaet}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  Marketing-Aktivitäten
                </h5>
                <ul className="space-y-2">
                  {phase.marketing.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <ChevronRight className="w-4 h-4 text-orange-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Content-Formate
                </h5>
                <ul className="space-y-2">
                  {phase.content.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <ChevronRight className="w-4 h-4 text-blue-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  Touchpoints
                </h5>
                <ul className="space-y-2">
                  {phase.touchpoints.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <ChevronRight className="w-4 h-4 text-green-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content-Formate Details */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-500" />
          Content-Formate für Phase {activePhase}
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {contentFormateNachPhase[activePhase]?.map((content, idx) => (
            <div key={idx} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-blue-100">
              <h4 className="font-bold text-gray-800 mb-2">{content.format}</h4>
              <p className="text-sm text-gray-600 mb-3">{content.beschreibung}</p>
              <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-100 rounded-full px-3 py-1 w-fit">
                <Target className="w-3 h-3" />
                {content.ziel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSzenarien = () => (
    <div className="space-y-6">
      {/* Szenario Auswahl */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Building className="w-6 h-6 text-blue-900" />
          Branchen-Szenarien
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(szenarien).map(([key, szenario]) => (
            <button
              key={key}
              onClick={() => setActiveSzenario(key)}
              className={`p-4 rounded-xl border-2 transition-all ${
                activeSzenario === key 
                  ? 'border-orange-500 bg-orange-50 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <szenario.icon className={`w-8 h-8 mb-2 ${activeSzenario === key ? 'text-orange-500' : 'text-gray-400'}`} />
              <p className={`font-semibold text-sm ${activeSzenario === key ? 'text-gray-800' : 'text-gray-600'}`}>
                {szenario.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Active Szenario Details */}
      {szenarien[activeSzenario] && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-6 text-white">
            <div className="flex items-center gap-4">
              {React.createElement(szenarien[activeSzenario].icon, { className: "w-12 h-12" })}
              <div>
                <h3 className="text-2xl font-bold">{szenarien[activeSzenario].name}</h3>
                <p className="text-blue-200">Beispiel: {szenarien[activeSzenario].beispiel}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  Unternehmenskontext
                </h4>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-sm text-gray-500">Größe:</span>
                    <p className="font-semibold text-gray-800">{szenarien[activeSzenario].mitarbeiter}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-sm text-gray-500">Typischer Zeitraum:</span>
                    <p className="font-semibold text-gray-800">{szenarien[activeSzenario].zeitraum}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <span className="text-sm text-orange-600">Trigger-Event:</span>
                    <p className="font-semibold text-gray-800">{szenarien[activeSzenario].trigger}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Besonderheiten
                </h4>
                <ul className="space-y-2">
                  {szenarien[activeSzenario].besonderheiten.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 bg-yellow-50 rounded-lg p-3">
                      <ChevronRight className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Entscheider / Buying Center
                </h4>
                <div className="flex flex-wrap gap-2">
                  {szenarien[activeSzenario].entscheider.map((person, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {person}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-500" />
                  Typischer Erfolg
                </h4>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="font-semibold text-green-800">{szenarien[activeSzenario].erfolg}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStakeholder = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-orange-500" />
          Stakeholder & Personas im Buying Center
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {stakeholder.map((person) => (
            <button
              key={person.id}
              onClick={() => setActiveStakeholder(activeStakeholder === person.id ? null : person.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                activeStakeholder === person.id 
                  ? 'border-orange-500 bg-orange-50 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-full ${activeStakeholder === person.id ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  <person.icon className={`w-6 h-6 ${activeStakeholder === person.id ? 'text-orange-500' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="font-bold text-gray-800">{person.name}</p>
                  <p className="text-xs text-gray-500">{person.rolle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{person.typ}</span>
                <span className="text-gray-400">{person.alter} Jahre</span>
              </div>
            </button>
          ))}
        </div>

        {/* Active Stakeholder Details */}
        {activeStakeholder && stakeholder.filter(p => p.id === activeStakeholder).map(person => (
          <div key={person.id} className="bg-gradient-to-br from-gray-50 to-orange-50 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-white rounded-full shadow-md">
                <person.icon className="w-10 h-10 text-orange-500" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-800">{person.name}</h4>
                <p className="text-gray-600">{person.rolle} • {person.typ}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h5 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Pain Points
                </h5>
                <ul className="space-y-2">
                  {person.pain.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-red-50 rounded-lg p-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Gains / Vorteile
                </h5>
                <ul className="space-y-2">
                  {person.gain.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-green-50 rounded-lg p-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h5 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Relevanter Content
                </h5>
                <ul className="space-y-2">
                  {person.content.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-blue-50 rounded-lg p-2">
                      <ChevronRight className="w-4 h-4 text-blue-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Bevorzugte Kanäle
                </h5>
                <ul className="space-y-2">
                  {person.kanal.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-purple-50 rounded-lg p-2">
                      <ChevronRight className="w-4 h-4 text-purple-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
              <p className="text-lg italic text-gray-700">"{person.zitat}"</p>
              <p className="text-sm text-gray-500 mt-2">— {person.name}, {person.rolle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContentPlan = () => (
    <div className="space-y-6">
      {/* Content-Matrix */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <PieChart className="w-6 h-6 text-blue-500" />
          Content-Matrix: Phase × Stakeholder
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="p-3 text-left rounded-tl-lg">Phase</th>
                <th className="p-3 text-center">Praktiker<br/>(Klaus)</th>
                <th className="p-3 text-center">Teamleitung<br/>(Sandra)</th>
                <th className="p-3 text-center">GF<br/>(Thomas)</th>
                <th className="p-3 text-center">Betriebsrat<br/>(Ralf)</th>
                <th className="p-3 text-center">IT<br/>(Stefan)</th>
                <th className="p-3 text-center rounded-tr-lg">Einkauf<br/>(Frank)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-50">
                <td className="p-3 font-semibold">1. Unbewusst</td>
                <td className="p-3 text-center text-xs">Leidet still</td>
                <td className="p-3 text-center text-xs">Sieht Symptome</td>
                <td className="p-3 text-center text-xs">—</td>
                <td className="p-3 text-center text-xs">—</td>
                <td className="p-3 text-center text-xs">—</td>
                <td className="p-3 text-center text-xs">—</td>
              </tr>
              <tr className="bg-orange-50">
                <td className="p-3 font-semibold">2. Bewusstsein</td>
                <td className="p-3 text-center text-xs">WhatsApp-Gruppe</td>
                <td className="p-3 text-center text-xs">Recherchiert</td>
                <td className="p-3 text-center text-xs">Presseanfragen</td>
                <td className="p-3 text-center text-xs">Aktiviert sich</td>
                <td className="p-3 text-center text-xs">—</td>
                <td className="p-3 text-center text-xs">—</td>
              </tr>
              <tr className="bg-blue-50">
                <td className="p-3 font-semibold">3. Lösungssuche</td>
                <td className="p-3 text-center text-xs">Feedback geben</td>
                <td className="p-3 text-center text-xs">Task Force leiten</td>
                <td className="p-3 text-center text-xs">Budget freigeben</td>
                <td className="p-3 text-center text-xs">Umfrage machen</td>
                <td className="p-3 text-center text-xs">Tech prüfen</td>
                <td className="p-3 text-center text-xs">—</td>
              </tr>
              <tr className="bg-purple-50">
                <td className="p-3 font-semibold">4. Evaluation</td>
                <td className="p-3 text-center text-xs">Geräte testen</td>
                <td className="p-3 text-center text-xs">Koordinieren</td>
                <td className="p-3 text-center text-xs">Entscheiden</td>
                <td className="p-3 text-center text-xs">BV verhandeln</td>
                <td className="p-3 text-center text-xs">API testen</td>
                <td className="p-3 text-center text-xs">Verhandeln</td>
              </tr>
              <tr className="bg-green-50">
                <td className="p-3 font-semibold">5. Entscheidung</td>
                <td className="p-3 text-center text-xs">Einarbeitung</td>
                <td className="p-3 text-center text-xs">Rollout leiten</td>
                <td className="p-3 text-center text-xs">Unterschrift</td>
                <td className="p-3 text-center text-xs">BV unterzeichnen</td>
                <td className="p-3 text-center text-xs">Integration</td>
                <td className="p-3 text-center text-xs">Vertrag</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Content-Ideen */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-red-500" />
            Video-Content-Ideen
          </h3>
          <ul className="space-y-3">
            {[
              'Testimonial: "Deeskalation durch Frontdisplay"',
              'Demo: 1-Knopf-Bedienung erklärt',
              'Case Study: Wiener Linien (-50% Übergriffe)',
              'Interview: Betriebsrat zur BV-Erstellung',
              'Tech-Deep-Dive: DSGVO & deutsche Server',
              'Rollout-Doku: Von 0 auf 50 Kameras'
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 text-sm text-gray-700 bg-red-50 rounded-lg p-3">
                <Play className="w-4 h-4 text-red-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Download-Content-Ideen
          </h3>
          <ul className="space-y-3">
            {[
              'Whitepaper: DSGVO-Leitfaden Body-Cam',
              'Vorlage: Muster-Betriebsvereinbarung',
              'Tool: ROI-Rechner (Excel/Online)',
              'Checkliste: 5 Schritte zur Einführung',
              'Vergleich: Bodycam vs. Alternativen',
              'Business Case Template für GF'
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 text-sm text-gray-700 bg-blue-50 rounded-lg p-3">
                <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Headlines nach Zielgruppe */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Headline-Ideen nach Zielgruppe
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <h4 className="font-bold text-blue-800 mb-3">Für ÖPNV</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• "Hamburg setzt auf Deeskalation"</li>
              <li>• "75% weniger Übergriffe auf Kontrolleure"</li>
              <li>• "Wiener Linien: Der Spiegel-Effekt"</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
            <h4 className="font-bold text-orange-800 mb-3">Für Sicherheitsdienste</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• "Ausschreibung gewonnen dank Bodycams"</li>
              <li>• "Fluktuation halbiert: Die Security-Story"</li>
              <li>• "Beweismittel statt Aussage gegen Aussage"</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
            <h4 className="font-bold text-red-800 mb-3">Für Rettungsdienst</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• "Wenn Retter selbst Schutz brauchen"</li>
              <li>• "Marcus' Story: Vom Opfer zum Vorbild"</li>
              <li>• "-72% Gewalt in 3 Monaten"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderKPIs = () => (
    <div className="space-y-6">
      {/* Erfolgsmetriken */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-green-500" />
          Erfolgsmetriken aus Kundenprojekten
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {erfolgsmetriken.map((metrik, idx) => (
            <div key={idx} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 rounded-full" style={{ backgroundColor: metrik.color + '20' }}>
                  <metrik.icon className="w-6 h-6" style={{ color: metrik.color }} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800 mb-1">{metrik.wert}</p>
              <p className="text-sm text-gray-500">{metrik.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Learnings-Matrix */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          Key Learnings pro Phase
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-yellow-100">
                <th className="p-3 text-left">Phase</th>
                <th className="p-3 text-left">Haupt-Learning</th>
                <th className="p-3 text-left">NetCo-Hebel</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3 font-semibold">1. Unbewusst</td>
                <td className="p-3">Problem wird normalisiert</td>
                <td className="p-3 text-orange-600">Awareness ohne Kaufdruck</td>
              </tr>
              <tr className="border-b bg-gray-50">
                <td className="p-3 font-semibold">2. Bewusstsein</td>
                <td className="p-3">Trigger Event nötig</td>
                <td className="p-3 text-orange-600">Remarketing + News-Jacking</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-semibold">3. Lösungssuche</td>
                <td className="p-3">Viele Stakeholder involviert</td>
                <td className="p-3 text-orange-600">Content für jeden Typ</td>
              </tr>
              <tr className="border-b bg-gray-50">
                <td className="p-3 font-semibold">4. Evaluation</td>
                <td className="p-3">Vertrauen entscheidet</td>
                <td className="p-3 text-orange-600">Referenzen + lokaler Bezug</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">5. Entscheidung</td>
                <td className="p-3">Risiko-Minimierung wichtig</td>
                <td className="p-3 text-orange-600">Testphase + Garantien</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Insight */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Award className="w-6 h-6" />
          Key Insight
        </h3>
        <p className="text-lg leading-relaxed">
          "Es ist nie eine Person, die entscheidet. Es ist ein <strong>Orchester von Bedenken, Hoffnungen und Kompromissen</strong>. 
          NetCo muss für jeden die richtige Melodie spielen."
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {['Praktiker überzeugen', 'Teamleitung enablen', 'GF beruhigen', 'BR einbinden', 'IT überzeugen', 'Einkauf begeistern'].map((item, idx) => (
            <span key={idx} className="bg-white/20 px-3 py-1 rounded-full text-sm">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          Quick Actions für Marketing
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <h4 className="font-bold text-orange-800 mb-2">Sofort starten</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Remarketing-Pixel</li>
              <li>✓ LinkedIn Ads</li>
              <li>✓ Newsletter-Funnel</li>
            </ul>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-bold text-blue-800 mb-2">Content erstellen</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ DSGVO-Whitepaper</li>
              <li>✓ ROI-Rechner</li>
              <li>✓ BV-Muster</li>
            </ul>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-bold text-green-800 mb-2">Sales enablen</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Demo-Skript</li>
              <li>✓ Referenz-Liste</li>
              <li>✓ TCO-Rechner</li>
            </ul>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h4 className="font-bold text-purple-800 mb-2">Tracking</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Lead-Scoring</li>
              <li>✓ Content-Engagement</li>
              <li>✓ Pipeline-Phasen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500 rounded-xl">
              <Camera className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">NetCo Body-Cam</h1>
              <p className="text-blue-200">Content & Phasenplan Dashboard</p>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex flex-wrap gap-2 mt-6">
            {[
              { id: 'phasen', label: 'Customer Journey', icon: Clock },
              { id: 'szenarien', label: 'Branchen-Szenarien', icon: Building },
              { id: 'stakeholder', label: 'Stakeholder', icon: Users },
              { id: 'content', label: 'Content-Plan', icon: FileText },
              { id: 'kpis', label: 'KPIs & Learnings', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id 
                    ? 'bg-orange-500 text-white shadow-lg' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'phasen' && renderPhasenOverview()}
        {activeTab === 'szenarien' && renderSzenarien()}
        {activeTab === 'stakeholder' && renderStakeholder()}
        {activeTab === 'content' && renderContentPlan()}
        {activeTab === 'kpis' && renderKPIs()}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          NetCo Body-Cam Content & Phasenplan • Basierend auf Customer Journey Analyse • 
          <span className="text-orange-400 ml-1">Deeskalation statt nur Dokumentation</span>
        </div>
      </div>
    </div>
  );
};

export default NetCoBodyCamDashboard;
