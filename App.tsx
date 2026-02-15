
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Header from './components/Header';
import CameraView from './components/CameraView';
import AlertDashboard from './components/AlertDashboard';
import { AIResponse, AlertLogEntry, User, UserRole, IncidentReport, IncidentCategory, IncidentStatus, UrgencyLevel, SystemStats } from './types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
// @ts-ignore
import html2pdf from 'html2pdf.js';

const generateVaryingMockData = (): IncidentReport[] => {
  const villages = ['Village Tunis', 'Village Akouda', 'Village Mahres', 'Village Siliana'];
  const categories: IncidentCategory[] = ['violence', 'behavior', 'health', 'abuse', 'other'];
  const children = ['Ahmed B.', 'Sonia K.', 'Yassine M.', 'Fatma Z.', 'Omar R.', 'Amira L.', 'Khalil J.', 'Nour H.'];
  const authors = ['Inconnu', 'Camarade de classe', 'Voisinage', 'Ancien personnel', 'Visiteur extérieur'];
  const scenarios = [
    "Altercation verbale entre deux enfants lors du déjeuner. Escalade évitée par l'intervention d'une mère SOS.",
    "L'enfant présente des signes de repli sur soi et refuse de participer aux activités collectives.",
    "Chute accidentelle dans la cour entraînant une écorchure au genou.",
    "Suspicion de harcèlement scolaire rapportée par un témoin anonyme.",
    "Comportement agressif inhabituel envers les autres membres de la fratrie.",
    "L'enfant a quitté l'enceinte du village sans autorisation pendant 30 minutes.",
    "Plainte d'un enfant concernant la disparition de ses effets personnels.",
    "Découverte de traces de coups lors de l'habillage matinal.",
    "Demande de médiation entre deux fratries suite à un conflit.",
    "Signalement de fatigue intense et manque d'appétit chez l'enfant."
  ];
  const mockData: IncidentReport[] = [];
  const now = Date.now();
  for (let i = 0; i < 50; i++) {
    const timestamp = now - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000); 
    const village = villages[Math.floor(Math.random() * villages.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const status: IncidentStatus = i < 8 ? 'pending' : i < 20 ? 'processing' : 'closed';
    const urgency: UrgencyLevel = i % 10 === 0 ? 'critical' : i % 4 === 0 ? 'high' : 'medium';
    mockData.push({
      id: `SOS-${4000 + i}`,
      timestamp,
      declarantId: 'USER_MOCK',
      category,
      programme: village,
      description: scenario,
      isAnonymous: Math.random() > 0.85,
      urgency,
      status,
      attachments: [],
      childName: children[Math.floor(Math.random() * children.length)],
      abuserName: authors[Math.floor(Math.random() * authors.length)],
      aggressionScore: Math.floor(Math.random() * 70) + 15,
      escalationProbability: Math.floor(Math.random() * 40),
      auditTrail: [{ userId: 'SYS', action: 'HISTORIC_IMPORT', timestamp, role: 'governance' }],
      actionPlan: status !== 'pending' ? "Protocole de suivi individualisé mis en place." : undefined,
      decisionNote: status === 'closed' ? "Dossier clôturé. État de l'enfant stable." : undefined
    });
  }
  return mockData.sort((a, b) => b.timestamp - a.timestamp);
};

const App: React.FC = () => {
  const [authState, setAuthState] = useState<'login' | 'authenticated'>('login');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  
  const [reports, setReports] = useState<IncidentReport[]>(() => generateVaryingMockData());
  const [logs, setLogs] = useState<AlertLogEntry[]>([]);
  const [isScanning, setIsScanning] = useState(true);

  const handleAnalysisResult = useCallback((result: AIResponse, thumbnail: string) => {
    const newLog: AlertLogEntry = { ...result, id: Math.random().toString(36).substring(7), timestamp: new Date().toLocaleTimeString(), imageThumbnail: thumbnail };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
    if (result.alert_recommended && result.risk_level === 'critical') {
      const newReport: IncidentReport = {
        id: `AI-${Date.now().toString().slice(-4)}`,
        timestamp: Date.now(), declarantId: 'SYSTEM_AI', category: 'violence',
        programme: 'Village Tunis', description: result.incident_summary,
        isAnonymous: false, urgency: result.risk_level, status: 'pending',
        attachments: [thumbnail], isAIDetected: true,
        aggressionScore: result.aggression_score, escalationProbability: result.escalation_probability,
        auditTrail: [{ userId: 'AI', action: 'AUTO_DETECTED', timestamp: Date.now(), role: 'declarant' }]
      };
      setReports(prev => [newReport, ...prev]);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    let user: User | null = null;
    
    if (loginForm.username === 'declarant' && loginForm.password === 'declarant') {
      user = { id: 'u1', name: 'Personnel Terrain', role: 'declarant' };
    } else if (loginForm.username === 'Psychologues' && loginForm.password === 'Psychologues') {
      user = { id: 'u2', name: 'Équipe Clinique', role: 'analyst' };
    } else if (loginForm.username === 'Gouvernance' && loginForm.password === 'Gouvernance') {
      user = { id: 'u3', name: 'Direction Nationale', role: 'governance' };
    }

    if (user) {
      setCurrentUser(user);
      setAuthState('authenticated');
      if (user.role === 'declarant') setActiveTab('hub');
      else if (user.role === 'analyst') setActiveTab('manage');
      else setActiveTab('governance');
    } else {
      setLoginError('Identifiants incorrects. Veuillez réessayer.');
    }
  };

  const handleLogout = () => {
    setAuthState('login');
    setCurrentUser(null);
    setActiveTab('');
    setLoginForm({ username: '', password: '' });
  };

  const updateReport = (id: string, newStatus: IncidentStatus, data?: Partial<IncidentReport>) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, ...data } : r));
  };

  if (authState === 'login') {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2/3 h-full bg-brand-blue opacity-5 rounded-l-[200px]"></div>
        <div className="bg-white p-8 md:p-12 rounded-brand shadow-2xl max-w-md w-full relative z-10 animate-[fadeIn_0.5s_ease]">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-brand-blue rounded-brand flex items-center justify-center text-white text-3xl mb-6 shadow-xl shadow-brand-blue/20">
              <i className="fas fa-bullhorn"></i>
            </div>
            <h1 className="text-2xl font-black text-brand-dark tracking-tighter uppercase">SOS ECHO</h1>
            <p className="text-[10px] text-brand-blue font-black uppercase tracking-widest mt-2 border-t border-slate-50 pt-2">Système de Protection Village SOS</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Utilisateur</label>
              <input 
                type="text" 
                value={loginForm.username}
                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                className="w-full bg-slate-50 border-none ring-1 ring-slate-100 p-4 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-brand-blue" 
                placeholder="Ex: declarant" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe</label>
              <input 
                type="password"  
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full bg-slate-50 border-none ring-1 ring-slate-100 p-4 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-brand-blue" 
                placeholder="••••••••" 
              />
            </div>
            {loginError && <p className="text-brand-red text-[10px] font-black uppercase text-center">{loginError}</p>}
            <button type="submit" className="w-full bg-brand-blue text-white font-black uppercase py-4 rounded-xl shadow-lg shadow-brand-blue/20 hover:scale-[1.01] transition-all">Accéder au Portail</button>
          </form>
          <div className="mt-10 border-t border-slate-50 pt-6 text-center">
             <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">© 2024 SOS Village d'Enfants Tunisie</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Header onLogout={handleLogout} userName={currentUser?.name} />
      <main className="flex-1 p-4 md:p-8 max-w-[1600px] mx-auto w-full flex flex-col space-y-6 md:space-y-8 overflow-hidden">
        <nav className="flex items-center space-x-6 border-b border-slate-100 no-print overflow-x-auto whitespace-nowrap scrollbar-hide">
          {(currentUser?.role === 'declarant' || currentUser?.role === 'governance') && (
            <button onClick={() => setActiveTab('hub')} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest relative ${activeTab === 'hub' ? 'text-brand-blue' : 'text-slate-400'}`}>
              {activeTab === 'hub' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-blue rounded-t-full"></div>} <i className="fas fa-bullhorn mr-2"></i> Signalement
            </button>
          )}
          {(currentUser?.role === 'analyst' || currentUser?.role === 'governance') && (
            <>
              <button onClick={() => setActiveTab('monitor')} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest relative ${activeTab === 'monitor' ? 'text-brand-blue' : 'text-slate-400'}`}>
                {activeTab === 'monitor' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-blue rounded-t-full"></div>} <i className="fas fa-video mr-2"></i> Surveillance
              </button>
              <button onClick={() => setActiveTab('manage')} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest relative ${activeTab === 'manage' ? 'text-brand-blue' : 'text-slate-400'}`}>
                {activeTab === 'manage' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-blue rounded-t-full"></div>} <i className="fas fa-brain mr-2"></i> Analyse
              </button>
            </>
          )}
          {currentUser?.role === 'governance' && (
            <button onClick={() => setActiveTab('governance')} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest relative ${activeTab === 'governance' ? 'text-brand-blue' : 'text-slate-400'}`}>
              {activeTab === 'governance' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-blue rounded-t-full"></div>} <i className="fas fa-file-contract mr-2"></i> Gouvernance
            </button>
          )}
        </nav>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'monitor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
              <div className="lg:col-span-8 overflow-hidden flex flex-col">
                <CameraView onAnalysisResult={handleAnalysisResult} isScanning={isScanning} />
              </div>
              <div className="lg:col-span-4 bg-white rounded-brand shadow-xl border border-slate-50 overflow-hidden flex flex-col h-[500px] lg:h-auto">
                <AlertDashboard logs={logs} currentRisk="low" />
              </div>
            </div>
          )}
          {activeTab === 'hub' && <DeclarantView onAdd={(r) => setReports(prev => [r, ...prev])} reports={reports} />}
          {activeTab === 'manage' && <AnalystView reports={reports} onUpdate={updateReport} />}
          {activeTab === 'governance' && <GovernanceView reports={reports} onUpdate={updateReport} />}
        </div>
      </main>
    </div>
  );
};

// --- DECLARANT VIEW (NIVEAU 1) ---
const DeclarantView: React.FC<{ onAdd: (r: IncidentReport) => void, reports: IncidentReport[] }> = ({ onAdd, reports }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ desc: '', cat: 'behavior' as IncidentCategory, programme: 'Village Tunis', child: '', abuser: '', isAnon: false });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ id: `SOS-${Math.floor(1000 + Math.random() * 9000)}`, timestamp: Date.now(), declarantId: 'MARIA', category: form.cat, description: form.desc, isAnonymous: form.isAnon, programme: form.programme, childName: form.child, abuserName: form.abuser, urgency: 'medium', status: 'pending', attachments: [], auditTrail: [{ userId: 'MARIA', action: 'CREATED', timestamp: Date.now(), role: 'declarant' }] });
    setShowForm(false);
    setForm({ desc: '', cat: 'behavior', programme: 'Village Tunis', child: '', abuser: '', isAnon: false });
  };
  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 no-print border-l-4 border-brand-red pl-6">
        <div>
          <h2 className="text-2xl font-black text-brand-dark tracking-tighter uppercase">SIGNALEMENT TERRAIN</h2>
          <p className="text-sm text-slate-500 font-medium italic">Accès Mère SOS / Personnel de Terrain</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-brand-blue text-white brand-bubble px-10 py-4 font-black uppercase text-xs shadow-xl hover:scale-105 transition-all"><i className="fas fa-plus mr-2"></i> Ouvrir un Dossier</button>
      </div>
      {showForm && (
        <div className="bg-white p-8 md:p-12 rounded-brand border border-slate-50 shadow-2xl max-w-3xl mx-auto mb-10">
          <h3 className="text-xl font-black tracking-tight uppercase text-brand-dark mb-8 flex items-center">
            <i className="fas fa-file-shield mr-3 text-brand-red"></i> Formulaire Officiel
          </h3>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="bg-slate-50 p-6 rounded-brand flex items-center space-x-3 transition-all hover:bg-slate-100">
               <input type="checkbox" id="isAnon" checked={form.isAnon} onChange={e => setForm({...form, isAnon: e.target.checked})} className="w-5 h-5 rounded border-brand-blue bg-white accent-brand-blue cursor-pointer" />
               <label htmlFor="isAnon" className="text-sm font-bold text-brand-dark cursor-pointer uppercase tracking-tight">SIGNALEMENT ANONYME</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <select value={form.programme} onChange={e => setForm({...form, programme: e.target.value})} className="w-full bg-slate-50 p-5 rounded-brand font-bold outline-none ring-1 ring-slate-100 border-none appearance-none cursor-pointer focus:ring-2 focus:ring-brand-blue/30 uppercase text-xs">
                <option>Village Tunis</option><option>Village Akouda</option><option>Village Mahres</option><option>Village Siliana</option>
              </select>
              <select value={form.cat} onChange={e => setForm({...form, cat: e.target.value as any})} className="w-full bg-slate-50 p-5 rounded-brand font-bold outline-none ring-1 ring-slate-100 border-none appearance-none cursor-pointer focus:ring-2 focus:ring-brand-blue/30 uppercase text-xs">
                <option value="behavior">Comportement</option><option value="violence">Violence</option><option value="health">Santé</option><option value="abuse">Abus</option>
              </select>
            </div>
            <input type="text" value={form.child} onChange={e => setForm({...form, child: e.target.value})} placeholder="Nom complet de l'enfant" className="w-full bg-slate-50 p-5 rounded-brand font-bold outline-none ring-1 ring-slate-100 border-none focus:ring-2 focus:ring-brand-blue/30" required />
            <input type="text" value={form.abuser} onChange={e => setForm({...form, abuser: e.target.value})} placeholder="Nom ou description de l'auteur présumé" className="w-full bg-slate-50 p-5 rounded-brand font-bold outline-none ring-1 ring-slate-100 border-none focus:ring-2 focus:ring-brand-blue/30" />
            <textarea value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} required placeholder="Description détaillée des faits..." className="w-full bg-slate-50 p-6 rounded-brand h-40 outline-none ring-1 ring-slate-100 border-none focus:ring-2 focus:ring-brand-blue/30"></textarea>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button type="submit" className="flex-1 bg-brand-dark text-white font-black py-5 rounded-brand uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 transition-all">SOUMETTRE LE SIGNALEMENT</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-10 bg-slate-100 text-slate-400 font-black rounded-brand uppercase text-[10px] py-4">Annuler</button>
            </div>
          </form>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-20 no-print">
        {reports.slice(0, 12).map(r => (
          <div key={r.id} className="bg-white rounded-brand border border-slate-100 shadow-xl overflow-hidden flex flex-col hover:border-brand-blue transition-all group">
            <div className={`h-2 w-full ${r.status === 'pending' ? 'bg-brand-blue' : r.status === 'processing' ? 'bg-brand-red' : 'bg-brand-dark'}`}></div>
            <div className="p-8 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-[10px] font-black text-slate-300 tracking-widest uppercase">#{r.id}</span>
              </div>
              <h4 className="font-black text-brand-dark text-xl mb-1 uppercase tracking-tight">{r.programme}</h4>
              <p className="text-sm text-slate-600 italic mb-8 line-clamp-3 leading-relaxed">"{r.description}"</p>
              <div className="flex items-center justify-between text-[10px] font-black text-brand-dark uppercase tracking-widest border-t border-slate-50 pt-6 mt-auto">
                 <div className="flex items-center space-x-2"><i className="fas fa-child text-brand-blue"></i><span>{r.childName}</span></div>
                 <div className="text-slate-300">{new Date(r.timestamp).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- EXPERTISE VIEW (NIVEAU 2) ---
const AnalystView: React.FC<{ reports: IncidentReport[], onUpdate: (id: string, s: IncidentStatus, d: any) => void }> = ({ reports, onUpdate }) => {
  const [active, setActive] = useState<IncidentReport | null>(null);
  const [plan, setPlan] = useState('');
  return (
    <div className="h-full flex flex-col space-y-8 animate-[fadeIn_0.4s_ease]">
      <div className="border-l-4 border-brand-dark pl-6">
        <h2 className="text-2xl font-black text-brand-dark tracking-tighter uppercase">ANALYSE & EXPERTISE CLINIQUE</h2>
        <p className="text-sm text-slate-500 font-medium italic uppercase tracking-tighter">Évaluation Professionnelle</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden h-[600px] lg:h-auto">
        {(['pending', 'processing'] as IncidentStatus[]).map(s => (
          <div key={s} className="bg-slate-50 rounded-brand border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center"><span className="font-black text-[10px] uppercase text-brand-dark">{s === 'pending' ? 'EN ATTENTE' : 'EN COURS'}</span></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {reports.filter(r => r.status === s).map(r => (
                <div key={r.id} onClick={() => {setActive(r); setPlan(r.actionPlan || '');}} className="bg-white p-6 rounded-brand border border-slate-100 shadow-sm cursor-pointer hover:border-brand-blue transition-all">
                  <p className="text-sm font-black text-brand-dark uppercase tracking-tight mb-4 line-clamp-2">{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {active && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease]">
          <div className="bg-white rounded-brand w-full max-w-4xl p-10 shadow-2xl relative">
            <h3 className="text-2xl font-black uppercase text-brand-dark mb-8 tracking-tighter">EXPERT CLINIQUE <span className="text-brand-blue">#{active.id}</span></h3>
            <div className="bg-slate-50 p-6 rounded-brand mb-6 italic text-sm">"{active.description}"</div>
            <textarea value={plan} onChange={e => setPlan(e.target.value)} className="w-full h-48 bg-slate-50 border-none ring-1 ring-slate-100 rounded-brand p-8 text-sm outline-none mb-8" placeholder="Diagnostic et préconisations cliniques..."></textarea>
            <button onClick={() => { onUpdate(active.id, 'processing', { actionPlan: plan }); setActive(null); }} className="w-full bg-brand-blue text-white font-black py-5 rounded-brand uppercase text-xs tracking-widest">VALIDER L'EXPERTISE</button>
            <button onClick={() => setActive(null)} className="absolute top-10 right-10 text-slate-400"><i className="fas fa-times text-2xl"></i></button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- GOVERNANCE VIEW (NIVEAU 3) ---
const GovernanceView: React.FC<{ reports: IncidentReport[], onUpdate: (id: string, s: IncidentStatus, d: any) => void }> = ({ reports, onUpdate }) => {
  const [activeDecision, setActiveDecision] = useState<IncidentReport | null>(null);
  const [note, setNote] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [chartMode, setChartMode] = useState<'village' | 'category' | 'urgency'>('village');
  const reportRef = useRef<HTMLDivElement>(null);

  const villages = useMemo(() => Array.from(new Set(reports.map(r => r.programme))), [reports]);
  const filteredReports = useMemo(() => selectedVillage === 'all' ? reports : reports.filter(r => r.programme === selectedVillage), [reports, selectedVillage]);
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    if (chartMode === 'village') reports.forEach(r => counts[r.programme] = (counts[r.programme] || 0) + 1);
    else if (chartMode === 'category') filteredReports.forEach(r => counts[r.category] = (counts[r.category] || 0) + 1);
    else filteredReports.forEach(r => counts[r.urgency] = (counts[r.urgency] || 0) + 1);
    return Object.keys(counts).map(k => ({ name: k.toUpperCase(), value: counts[k] }));
  }, [reports, filteredReports, chartMode]);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `SOS_Rapport_National_${new Date().getFullYear()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const COLORS = ['#00abec', '#de5a6c', '#1c325d', '#84ccf1', '#eba9a9'];

  return (
    <div id="governance-report" ref={reportRef} className="space-y-8 h-full overflow-y-auto custom-scrollbar pr-2 animate-[fadeIn_0.4s_ease]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 no-print border-l-4 border-brand-red pl-6">
        <div>
          <h2 className="text-2xl font-black text-brand-dark tracking-tighter uppercase">PILOTAGE NATIONAL & GOUVERNANCE</h2>
          <p className="text-sm text-slate-500 font-medium italic uppercase tracking-tighter">Direction Générale Tunisie</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full md:w-auto space-y-4 sm:space-y-0 sm:space-x-4">
           <select value={selectedVillage} onChange={e => setSelectedVillage(e.target.value)} className="bg-white border border-slate-100 rounded-brand px-6 py-3 text-[10px] font-black uppercase tracking-widest outline-none shadow-sm focus:ring-2 focus:ring-brand-blue/30">
              <option value="all">Tous les Villages</option>
              {villages.map(v => <option key={v} value={v}>{v}</option>)}
           </select>
           <button onClick={handleDownloadPDF} className="px-10 py-3 bg-brand-dark text-white rounded-brand text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center">
              <i className="fas fa-download mr-3"></i> Rapport Annuel (PDF)
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
         {[
           { l: 'SIGNALEMENTS', v: reports.length, c: 'text-brand-dark', i: 'fa-folder-open' },
           { l: 'CRITIQUES', v: reports.filter(r => r.urgency === 'critical').length, c: 'text-brand-red', i: 'fa-bolt' },
           { l: 'EN COURS', v: reports.filter(r => r.status === 'processing').length, c: 'text-brand-blue', i: 'fa-user-clock' },
           { l: 'ARCHIVÉS', v: reports.filter(r => r.status === 'closed').length, c: 'text-slate-400', i: 'fa-box-archive' }
         ].map((s, i) => (
           <div key={i} className="bg-white p-8 rounded-brand border border-slate-50 shadow-md flex items-center justify-between group overflow-hidden relative">
             <div className="relative z-10">
                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">{s.l}</div>
                <div className={`text-3xl md:text-4xl font-black tracking-tighter ${s.c}`}>{s.v}</div>
             </div>
             <div className={`text-4xl opacity-5 absolute -right-4 -bottom-4 rotate-12 transition-all group-hover:scale-125 ${s.c}`}><i className={`fas ${s.i}`}></i></div>
           </div>
         ))}
      </div>

      <div className="bg-white p-8 md:p-12 rounded-brand border border-slate-50 shadow-2xl no-print">
         <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               {chartMode === 'village' ? (
                 <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#1c325d'}} dy={15} /><YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} /><Tooltip cursor={{fill: '#f8fafc'}} /><Bar dataKey="value" fill="#00abec" radius={[12, 12, 0, 0]} /></BarChart>
               ) : chartMode === 'urgency' ? (
                 <AreaChart data={chartData}><defs><linearGradient id="colorUrgency" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#de5a6c" stopOpacity={0.2}/><stop offset="95%" stopColor="#de5a6c" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#1c325d'}} /><Tooltip /><Area type="monotone" dataKey="value" stroke="#de5a6c" strokeWidth={4} fillOpacity={1} fill="url(#colorUrgency)" /></AreaChart>
               ) : (
                 <PieChart><Pie data={chartData} innerRadius={100} outerRadius={140} paddingAngle={8} dataKey="value">{chartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" iconType="circle" /></PieChart>
               )}
            </ResponsiveContainer>
         </div>
      </div>

      <div className="bg-white rounded-brand border border-slate-50 overflow-hidden shadow-xl print:shadow-none">
         <table className="w-full text-left">
            <thead className="bg-slate-50"><tr><th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">REF</th><th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">VILLAGE / NATURE</th><th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">STATUT</th><th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 no-print">ACTION</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
               {filteredReports.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                     <td className="px-8 py-7"><span className="text-xs font-black text-brand-dark tracking-tighter">#{r.id}</span></td>
                     <td className="px-8 py-7"><div className="text-sm font-bold text-brand-dark uppercase">{r.programme}</div><div className="text-[9px] font-black text-brand-blue uppercase tracking-widest">{r.category}</div></td>
                     <td className="px-8 py-7"><span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border ${r.status === 'closed' ? 'bg-brand-blue text-white border-transparent' : r.status === 'processing' ? 'bg-slate-800 text-white border-transparent' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{r.status}</span></td>
                     <td className="px-8 py-7 no-print">
                        {r.status !== 'closed' ? (<button onClick={() => {setActiveDecision(r); setNote(r.decisionNote || '');}} className="text-[10px] font-black text-brand-blue uppercase hover:underline">ARBITRER</button>) : (<span className="text-slate-300 text-[10px] font-black uppercase">Archivé</span>)}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {activeDecision && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 no-print">
          <div className="bg-white rounded-brand w-full max-w-2xl p-10 shadow-2xl relative">
            <h3 className="text-2xl font-black uppercase text-brand-dark mb-10 tracking-tighter">Direction Arbitrage <span className="text-brand-blue">#{activeDecision.id}</span></h3>
            <textarea value={note} onChange={e => setNote(e.target.value)} className="w-full h-36 bg-slate-50 border-none ring-1 ring-slate-100 rounded-brand p-8 text-sm outline-none" placeholder="Décision de clôture nationale..."></textarea>
            <div className="grid grid-cols-2 gap-6">
               <button onClick={() => { onUpdate(activeDecision.id, 'closed', { decisionNote: note, archivedDate: Date.now() }); setActiveDecision(null); }} className="bg-brand-dark text-white font-black py-5 rounded-brand uppercase text-[10px] tracking-widest">VALIDER & ARCHIVER</button>
               <button onClick={() => setActiveDecision(null)} className="bg-slate-100 text-slate-400 font-black py-5 rounded-brand uppercase text-[10px] tracking-widest">FERMER</button>
            </div>
            <button onClick={() => setActiveDecision(null)} className="absolute top-10 right-10 text-slate-300 hover:text-brand-dark"><i className="fas fa-times text-2xl"></i></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
