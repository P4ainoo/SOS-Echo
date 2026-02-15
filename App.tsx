
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Header from './components/Header';
import CameraView from './components/CameraView';
import AlertDashboard from './components/AlertDashboard';
import { AIResponse, AlertLogEntry, User, UserRole, IncidentReport, IncidentCategory, IncidentStatus, UrgencyLevel } from './types';
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
    const status: IncidentStatus = i < 5 ? 'pending' : i < 15 ? 'processing' : 'closed';
    mockData.push({
      id: `SOS-${4000 + i}`,
      timestamp,
      declarantId: 'USER_MOCK',
      category: categories[Math.floor(Math.random() * categories.length)],
      programme: villages[Math.floor(Math.random() * villages.length)],
      description: scenarios[Math.floor(Math.random() * scenarios.length)],
      isAnonymous: Math.random() > 0.85,
      urgency: i % 10 === 0 ? 'critical' : i % 4 === 0 ? 'high' : 'medium',
      status,
      attachments: [],
      childName: children[Math.floor(Math.random() * children.length)],
      abuserName: authors[Math.floor(Math.random() * authors.length)],
      currentStep: status === 'pending' ? 1 : status === 'closed' ? 5 : 2,
      auditTrail: [{ userId: 'SYS', action: 'INIT', timestamp, role: 'declarant' }]
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
        currentStep: 1,
        auditTrail: [{ userId: 'AI', action: 'AUTO_DETECTED', timestamp: Date.now(), role: 'declarant' }]
      };
      setReports(prev => [newReport, ...prev]);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    let user: User | null = null;
    if (loginForm.username === 'declarant' && loginForm.password === 'declarant') user = { id: 'u1', name: 'Personnel Terrain', role: 'declarant' };
    else if (loginForm.username === 'Psychologues' && loginForm.password === 'Psychologues') user = { id: 'u2', name: 'Dr. Karama (Psy)', role: 'analyst' };
    else if (loginForm.username === 'Gouvernance' && loginForm.password === 'Gouvernance') user = { id: 'u3', name: 'Direction SOS', role: 'governance' };
    if (user) {
      setCurrentUser(user);
      setAuthState('authenticated');
      if (user.role === 'declarant') setActiveTab('hub');
      else if (user.role === 'analyst') setActiveTab('manage');
      else setActiveTab('governance');
    } else setLoginError('Identifiants incorrects.');
  };

  const updateReport = (id: string, newStatus: IncidentStatus, data?: Partial<IncidentReport>) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, ...data } : r));
  };

  if (authState === 'login') {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
        <div className="bg-white p-12 rounded-brand shadow-2xl max-w-md w-full animate-[fadeIn_0.5s_ease]">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-brand-blue rounded-brand flex items-center justify-center text-white text-3xl mb-6 shadow-lg shadow-brand-blue/20"><i className="fas fa-heart"></i></div>
            <h1 className="text-2xl font-black text-brand-dark tracking-tighter uppercase">SOS ECHO</h1>
            <p className="text-[10px] text-brand-blue font-black uppercase tracking-widest mt-2 border-t border-slate-50 pt-2">Portail Authentifié SOS Tunisie</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-brand-blue" placeholder="Utilisateur" />
            <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-brand-blue" placeholder="Mot de passe" />
            {loginError && <p className="text-brand-red text-[10px] font-black uppercase text-center">{loginError}</p>}
            <button type="submit" className="w-full bg-brand-blue text-white font-black uppercase py-4 rounded-xl shadow-lg hover:scale-[1.01] transition-all">Connexion</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Header onLogout={() => setAuthState('login')} userName={currentUser?.name} />
      <main className="flex-1 p-4 md:p-8 max-w-[1600px] mx-auto w-full flex flex-col space-y-6 overflow-hidden">
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
                {activeTab === 'manage' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-blue rounded-t-full"></div>} <i className="fas fa-folder-tree mr-2"></i> Expertise & Process
              </button>
            </>
          )}
          {currentUser?.role === 'governance' && (
            <button onClick={() => setActiveTab('governance')} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest relative ${activeTab === 'governance' ? 'text-brand-blue' : 'text-slate-400'}`}>
              {activeTab === 'governance' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-blue rounded-t-full"></div>} <i className="fas fa-shield-halved mr-2"></i> Gouvernance
            </button>
          )}
        </nav>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'monitor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
              <div className="lg:col-span-8 flex flex-col"><CameraView onAnalysisResult={handleAnalysisResult} isScanning={isScanning} /></div>
              <div className="lg:col-span-4 bg-white rounded-brand shadow-xl border border-slate-50 overflow-hidden flex flex-col h-[500px] lg:h-auto"><AlertDashboard logs={logs} currentRisk="low" /></div>
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

// --- DECLARANT VIEW ---
const DeclarantView: React.FC<{ onAdd: (r: IncidentReport) => void, reports: IncidentReport[] }> = ({ onAdd, reports }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ desc: '', cat: 'behavior' as IncidentCategory, programme: 'Village Tunis', child: '', abuser: '', isAnon: false });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ id: `SOS-${Math.floor(1000 + Math.random() * 9000)}`, timestamp: Date.now(), declarantId: 'MARIA', category: form.cat, description: form.desc, isAnonymous: form.isAnon, programme: form.programme, childName: form.child, abuserName: form.abuser, urgency: 'medium', status: 'pending', attachments: [], currentStep: 1, auditTrail: [{ userId: 'MARIA', action: 'CREATED', timestamp: Date.now(), role: 'declarant' }] });
    setShowForm(false);
  };
  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease]">
      <div className="flex justify-between items-center border-l-4 border-brand-red pl-6">
        <div><h2 className="text-2xl font-black text-brand-dark tracking-tighter uppercase">Remontées Terrain</h2><p className="text-sm text-slate-500 font-medium italic">Saisie initiale des incidents</p></div>
        <button onClick={() => setShowForm(true)} className="bg-brand-blue text-white brand-bubble px-10 py-4 font-black uppercase text-xs shadow-xl hover:scale-105 transition-all">Nouveau Signalement</button>
      </div>
      {showForm && (
        <div className="bg-white p-10 rounded-brand shadow-2xl max-w-2xl mx-auto border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <input type="text" value={form.child} onChange={e => setForm({...form, child: e.target.value})} placeholder="Enfant concerné" className="w-full bg-slate-50 p-5 rounded-brand outline-none focus:ring-2 focus:ring-brand-blue" required />
            <textarea value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} required placeholder="Description des faits..." className="w-full bg-slate-50 p-6 rounded-brand h-40 outline-none focus:ring-2 focus:ring-brand-blue"></textarea>
            <div className="flex gap-4">
              <button type="submit" className="flex-1 bg-brand-dark text-white font-black py-4 rounded-brand uppercase text-xs">Soumettre</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 bg-slate-100 text-slate-400 font-black rounded-brand uppercase text-[10px]">Fermer</button>
            </div>
          </form>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
        {reports.filter(r => r.status === 'pending').slice(0, 9).map(r => (
          <div key={r.id} className="bg-white rounded-brand border border-slate-100 shadow-xl p-8 flex flex-col group transition-all hover:border-brand-blue">
            <span className="text-[10px] font-black text-slate-300 uppercase mb-4 tracking-widest">#{r.id}</span>
            <h4 className="font-black text-brand-dark text-xl uppercase mb-2 leading-none">{r.childName}</h4>
            <p className="text-sm text-slate-500 italic mb-6 line-clamp-2">"{r.description}"</p>
            <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
              <span className="text-[9px] font-black text-brand-blue uppercase">{r.programme}</span>
              <span className="text-[9px] text-slate-300">{new Date(r.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- ANALYST VIEW (NIVEAU 2) ---
const AnalystView: React.FC<{ reports: IncidentReport[], onUpdate: (id: string, s: IncidentStatus, d: any) => void }> = ({ reports, onUpdate }) => {
  const [activeDossier, setActiveDossier] = useState<IncidentReport | null>(null);
  const [stepData, setStepData] = useState<string>('');
  
  const currentStepLabel = (step: number) => {
    switch(step) {
      case 1: return "Rapport DPE & Notifications";
      case 2: return "Évaluation Clinique Complète";
      case 3: return "Définition du Plan d'Action";
      case 4: return "Rapports de Suivi & Final";
      case 5: return "Avis de Clôture Définitif";
      default: return "Archivage";
    }
  };

  const handleProgress = (dossier: IncidentReport) => {
    const nextStep = dossier.currentStep + 1;
    const updatePayload: any = { currentStep: nextStep, status: 'processing' };
    
    if (dossier.currentStep === 1) updatePayload.dpeReport = stepData;
    if (dossier.currentStep === 2) updatePayload.fullEvaluation = stepData;
    if (dossier.currentStep === 3) updatePayload.actionPlan = stepData;
    if (dossier.currentStep === 4) updatePayload.followUpReport = stepData;
    if (dossier.currentStep === 5) {
      updatePayload.closingNotice = stepData;
      onUpdate(dossier.id, 'closed', updatePayload);
      setActiveDossier(null);
      return;
    }
    
    onUpdate(dossier.id, 'processing', updatePayload);
    setStepData('');
    setActiveDossier({...dossier, ...updatePayload});
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-[fadeIn_0.4s_ease]">
      <div className="flex justify-between items-center border-l-4 border-brand-dark pl-6">
        <div><h2 className="text-2xl font-black text-brand-dark tracking-tighter uppercase">Expertise Clinique & Suivi</h2><p className="text-sm text-slate-500 font-medium italic">Traitement des dossiers SOS Village</p></div>
        <div className="flex space-x-3">
           <div className="bg-brand-blue/10 px-4 py-2 rounded-xl text-[10px] font-black text-brand-blue uppercase"><i className="fas fa-bell mr-2"></i> {reports.filter(r => r.status === 'pending').length} Nouveaux</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 overflow-hidden">
        {/* Reports Management Dashboard (Left Sidebar) */}
        <div className="lg:col-span-1 bg-white rounded-brand border border-slate-100 flex flex-col overflow-hidden shadow-xl">
           <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
             <span className="text-[10px] font-black uppercase text-brand-dark tracking-widest">Active Queue</span>
             <i className="fas fa-filter text-slate-300 text-xs"></i>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
             {reports.filter(r => r.status !== 'closed').map(r => (
               <div key={r.id} onClick={() => {setActiveDossier(r); setStepData('');}} className={`p-6 rounded-brand border cursor-pointer transition-all hover:border-brand-blue ${activeDossier?.id === r.id ? 'bg-brand-blue/5 border-brand-blue shadow-inner' : 'bg-white border-slate-100 shadow-sm'}`}>
                 <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black text-slate-400">#{r.id}</span>
                    <span className={`text-[8px] px-2 py-0.5 rounded uppercase font-black ${r.urgency === 'critical' ? 'bg-brand-red text-white' : 'bg-slate-100 text-slate-500'}`}>{r.urgency}</span>
                 </div>
                 <h4 className="text-sm font-black text-brand-dark uppercase truncate">{r.childName}</h4>
                 <div className="flex items-center mt-3 text-[9px] font-black text-brand-blue uppercase tracking-widest">
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${r.status === 'pending' ? 'bg-brand-red animate-ping' : 'bg-brand-blue'}`}></span> 
                    {r.status === 'pending' ? 'NOUVEAU' : `Étape ${r.currentStep}/5`}
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Workspace (Main Area) */}
        <div className="lg:col-span-3 bg-white rounded-brand border border-slate-100 flex flex-col overflow-hidden shadow-2xl">
           {activeDossier ? (
             <div className="flex flex-col h-full">
                {/* Fixed Dossier Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                   <div>
                      <h3 className="text-xl font-black text-brand-dark uppercase tracking-tighter">Dossier Clinique: {activeDossier.childName}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-[10px] text-brand-blue font-bold uppercase">{activeDossier.programme}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">OUVERT LE {new Date(activeDossier.timestamp).toLocaleDateString()}</span>
                      </div>
                   </div>
                   <div className="flex space-x-3">
                      <button onClick={() => onUpdate(activeDossier.id, 'false-report', {})} className="px-5 py-2.5 bg-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-brand-red transition-all shadow-sm">Classification: Faux</button>
                      <button onClick={() => { alert("Urgence Vitale Notifiée !"); onUpdate(activeDossier.id, 'processing', { urgency: 'critical' }); }} className="px-5 py-2.5 bg-brand-red text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand-red/20">Alerte Critique</button>
                   </div>
                </div>

                <div className="flex-1 overflow-hidden flex">
                  {/* Left Column: Reference Panel (Incident Details) */}
                  <div className="w-1/3 border-r border-slate-50 bg-slate-50/20 p-8 overflow-y-auto custom-scrollbar">
                    <div className="mb-8">
                      <h4 className="text-[10px] font-black text-brand-dark uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Données de Signalement</h4>
                      
                      {activeDossier.attachments && activeDossier.attachments.length > 0 && (
                        <div className="mb-6 rounded-brand overflow-hidden border border-slate-100 shadow-sm aspect-video bg-black">
                           <img src={activeDossier.attachments[0]} alt="Evidence" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="bg-white p-6 rounded-brand border border-slate-100 shadow-sm brand-bubble mb-6">
                        <p className="text-xs font-black text-brand-blue uppercase mb-2">Description Initiale:</p>
                        <p className="text-sm text-slate-600 leading-relaxed italic">"{activeDossier.description}"</p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-50">
                           <span className="text-[9px] font-black text-slate-400 uppercase">Auteur Présumé</span>
                           <span className="text-[10px] font-black text-brand-dark uppercase">{activeDossier.abuserName || 'Inconnu'}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-50">
                           <span className="text-[9px] font-black text-slate-400 uppercase">Catégorie</span>
                           <span className="text-[10px] font-black text-brand-blue uppercase">{activeDossier.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Show Previous Steps Documents */}
                    <h4 className="text-[10px] font-black text-brand-dark uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Historique Clinique</h4>
                    <div className="space-y-4">
                       {[
                         { id: 1, label: 'DPE', data: activeDossier.dpeReport },
                         { id: 2, label: 'Évaluation', data: activeDossier.fullEvaluation },
                         { id: 3, label: 'Plan Action', data: activeDossier.actionPlan },
                         { id: 4, label: 'Suivi', data: activeDossier.followUpReport }
                       ].map(hist => hist.data && (
                         <div key={hist.id} className="p-5 bg-white rounded-brand border border-slate-100 shadow-sm">
                            <span className="text-[8px] font-black text-brand-blue uppercase mb-1 block">{hist.label}</span>
                            <p className="text-[11px] text-slate-500 line-clamp-3 italic">"{hist.data}"</p>
                         </div>
                       ))}
                       {activeDossier.currentStep === 1 && <p className="text-[10px] text-slate-300 italic text-center">Aucun historique disponible.</p>}
                    </div>
                  </div>

                  {/* Right Column: Workflow Action Area */}
                  <div className="w-2/3 p-10 overflow-y-auto custom-scrollbar bg-white">
                    {/* Progress Visual */}
                    <div className="flex justify-between items-center mb-12 relative px-4">
                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-50 -translate-y-1/2 z-0"></div>
                      {[1, 2, 3, 4, 5].map(s => (
                        <div key={s} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all ${activeDossier.currentStep >= s ? 'bg-brand-blue text-white shadow-lg' : 'bg-slate-50 border-2 border-white text-slate-200 shadow-sm'}`}>
                           {activeDossier.currentStep > s ? <i className="fas fa-check"></i> : s}
                        </div>
                      ))}
                    </div>

                    <div className="mb-10">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue text-[9px] font-black uppercase rounded-full tracking-widest">ÉTAPE {activeDossier.currentStep}</span>
                        <span className="text-slate-200">/</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Délai Procédure: 48h</span>
                      </div>
                      <h4 className="text-3xl font-black text-brand-dark tracking-tighter uppercase leading-none">{currentStepLabel(activeDossier.currentStep)}</h4>
                    </div>

                    <div className="bg-slate-50 p-10 rounded-brand border border-slate-100 mb-8 shadow-sm">
                      <div className="flex items-center mb-6 text-brand-blue">
                        <i className="fas fa-pen-nib mr-3"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest">Saisie du document officiel</span>
                      </div>
                      <textarea 
                        value={stepData}
                        onChange={e => setStepData(e.target.value)}
                        placeholder={`Rédigez ici le ${currentStepLabel(activeDossier.currentStep)}...`}
                        className="w-full h-80 bg-transparent border-none outline-none text-slate-700 leading-relaxed font-medium placeholder:text-slate-300 custom-scrollbar"
                      ></textarea>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                       <p className="text-[10px] text-slate-400 font-medium italic">Le document sera automatiquement sauvegardé et accessible à la Direction Nationale.</p>
                       <button 
                        onClick={() => handleProgress(activeDossier)}
                        disabled={!stepData}
                        className={`px-12 py-5 rounded-brand font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center space-x-4 ${stepData ? 'bg-brand-dark text-white hover:bg-slate-800 hover:scale-105' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                       >
                         <span>VALIDER & PASSER À L'ÉTAPE {activeDossier.currentStep + 1}</span>
                         <i className="fas fa-arrow-right text-[10px]"></i>
                       </button>
                    </div>
                  </div>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center p-20 text-center">
                <div className="w-32 h-32 bg-slate-50 rounded-brand flex items-center justify-center mb-10 border border-slate-100 shadow-sm animate-pulse">
                  <i className="fas fa-user-md text-slate-200 text-5xl"></i>
                </div>
                <h3 className="text-2xl font-black uppercase text-brand-dark tracking-tighter">Prise en charge Clinique</h3>
                <p className="text-xs uppercase font-bold tracking-widest mt-4 text-slate-400 max-w-sm leading-loose">Sélectionnez un signalement dans la file d'attente pour démarrer l'expertise clinique et le protocole de protection SOS.</p>
                <div className="mt-10 flex space-x-6">
                   <div className="text-center">
                      <div className="text-xl font-black text-brand-blue">48h</div>
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Délai DPE</div>
                   </div>
                   <div className="text-center">
                      <div className="text-xl font-black text-brand-red">72h</div>
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Évaluation</div>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

// --- GOUVERNANCE VIEW (NIVEAU 3) ---
const GovernanceView: React.FC<{ reports: IncidentReport[], onUpdate: (id: string, s: IncidentStatus, d: any) => void }> = ({ reports, onUpdate }) => {
  const [activeDecision, setActiveDecision] = useState<IncidentReport | null>(null);
  const [note, setNote] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const reportRef = useRef<HTMLDivElement>(null);

  const filteredReports = useMemo(() => selectedVillage === 'all' ? reports : reports.filter(r => r.programme === selectedVillage), [reports, selectedVillage]);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    const opt = { 
      margin: 10, 
      filename: `SOS_Rapport_National_${Date.now()}.pdf`, 
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div id="governance-report" ref={reportRef} className="space-y-8 h-full overflow-y-auto custom-scrollbar pr-2 animate-[fadeIn_0.4s_ease]">
      <div className="flex justify-between items-center border-l-4 border-brand-red pl-6 no-print">
        <div><h2 className="text-2xl font-black text-brand-dark tracking-tighter uppercase">Pilotage National</h2><p className="text-sm text-slate-500 font-medium italic uppercase tracking-tighter">Direction Générale SOS Tunisie</p></div>
        <button onClick={handleDownloadPDF} className="bg-brand-dark text-white rounded-brand px-10 py-3 text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center hover:bg-slate-800 transition-all"><i className="fas fa-download mr-3"></i> Rapport Annuel (PDF)</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
         {[
           { l: 'SIGNALEMENTS', v: reports.length, c: 'text-brand-dark' },
           { l: 'CRITIQUES', v: reports.filter(r => r.urgency === 'critical').length, c: 'text-brand-red' },
           { l: 'TRAITEMENT', v: reports.filter(r => r.status === 'processing').length, c: 'text-brand-blue' },
           { l: 'ARCHIVÉS', v: reports.filter(r => r.status === 'closed').length, c: 'text-slate-400' }
         ].map((s, i) => (
           <div key={i} className="bg-white p-8 rounded-brand shadow-md border border-slate-50 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">{s.l}</div>
                <div className={`text-4xl font-black tracking-tighter ${s.c}`}>{s.v}</div>
              </div>
              <div className="absolute -right-2 -bottom-2 text-slate-50 text-6xl group-hover:scale-110 transition-transform"><i className="fas fa-file-invoice"></i></div>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-brand border border-slate-50 overflow-hidden shadow-2xl">
         <table className="w-full text-left">
            <thead className="bg-slate-50"><tr><th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">REF</th><th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">VILLAGE / ENFANT</th><th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">AVANCEMENT</th><th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 no-print">ACTION</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
               {filteredReports.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                     <td className="px-8 py-7"><span className="text-xs font-black text-brand-dark tracking-tighter">#{r.id}</span></td>
                     <td className="px-8 py-7"><div className="text-sm font-bold text-brand-dark uppercase">{r.programme}</div><div className="text-[9px] font-black text-brand-blue uppercase tracking-widest">{r.childName}</div></td>
                     <td className="px-8 py-7"><span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border ${r.status === 'closed' ? 'bg-brand-blue text-white' : 'bg-slate-50 text-slate-400'}`}>{r.status} (Étape {r.currentStep}/5)</span></td>
                     <td className="px-8 py-7 no-print">
                        {r.status !== 'closed' ? (<button onClick={() => {setActiveDecision(r); setNote(r.decisionNote || '');}} className="text-[10px] font-black text-brand-blue uppercase hover:underline">Arbitrer</button>) : (<span className="text-slate-300 text-[10px] font-black uppercase"><i className="fas fa-check-circle mr-2"></i> Archivé</span>)}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {activeDecision && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 no-print">
          <div className="bg-white rounded-brand w-full max-w-2xl p-10 shadow-2xl relative animate-[fadeIn_0.2s_ease]">
            <h3 className="text-2xl font-black uppercase text-brand-dark mb-10 tracking-tighter">Arbitrage Final SOS #{activeDecision.id}</h3>
            <div className="bg-slate-50 p-6 rounded-brand mb-8 italic text-sm text-slate-500">
               Contenu final du suivi: "{activeDecision.followUpReport || 'En cours...'}"
            </div>
            <textarea value={note} onChange={e => setNote(e.target.value)} className="w-full h-36 bg-slate-50 border-none ring-1 ring-slate-100 rounded-brand p-8 text-sm outline-none mb-8" placeholder="Décision de clôture finale de la Direction Générale..."></textarea>
            <div className="grid grid-cols-2 gap-6">
               <button onClick={() => { onUpdate(activeDecision.id, 'closed', { decisionNote: note, archivedDate: Date.now() }); setActiveDecision(null); }} className="bg-brand-dark text-white font-black py-5 rounded-brand uppercase text-[10px] tracking-widest shadow-xl">Valider & Archiver</button>
               <button onClick={() => setActiveDecision(null)} className="bg-slate-100 text-slate-400 font-black py-5 rounded-brand uppercase text-[10px] tracking-widest">Fermer</button>
            </div>
            <button onClick={() => setActiveDecision(null)} className="absolute top-10 right-10 text-slate-300 hover:text-brand-dark transition-colors"><i className="fas fa-times text-2xl"></i></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
