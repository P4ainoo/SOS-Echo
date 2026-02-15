
import React from 'react';
import { AlertLogEntry, UrgencyLevel } from '../types';

interface AlertDashboardProps {
  logs: AlertLogEntry[];
  currentRisk: UrgencyLevel;
}

const AlertDashboard: React.FC<AlertDashboardProps> = ({ logs, currentRisk }) => {
  const getRiskColor = (level: UrgencyLevel) => {
    switch (level) {
      case 'critical': return 'bg-brand-red text-white';
      case 'high': return 'bg-brand-dark text-white';
      case 'medium': return 'bg-brand-blue text-white';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white p-6">
      <div className="flex flex-col mb-8 border-b border-slate-50 pb-6">
        <h2 className="text-lg font-black text-brand-dark flex items-center uppercase tracking-tighter">
          <i className="fas fa-radar mr-3 text-brand-blue"></i>
          LOGS DE SÉCURITÉ
        </h2>
        <div className="flex items-center space-x-2 mt-4">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Index de Risque:</span>
          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${getRiskColor(currentRisk)}`}>
            {currentRisk}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 p-10 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6"><i className="fas fa-shield text-3xl opacity-20"></i></div>
            <p className="text-xs font-bold uppercase tracking-widest">Vérification en cours...</p>
            <p className="text-[10px] opacity-50 mt-1 uppercase">L'IA SafeLens analyse le flux vidéo en temps réel</p>
          </div>
        ) : (
          logs.map((log) => (
            <div 
              key={log.id} 
              className={`p-6 rounded-brand border border-slate-50 shadow-sm transition-all hover:border-brand-blue hover:shadow-md ${log.risk_level === 'critical' ? 'brand-bubble-inverted border-brand-red/20' : 'bg-white'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-4">
                  {log.imageThumbnail ? (
                    <img src={log.imageThumbnail} alt="Threat Clip" className="w-14 h-14 rounded-brand object-cover border-2 border-slate-50" />
                  ) : (
                    <div className="w-14 h-14 rounded-brand bg-slate-50 flex items-center justify-center border border-slate-100">
                      <i className="fas fa-camera text-slate-200"></i>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${log.alert_recommended ? 'bg-brand-red animate-pulse' : 'bg-brand-blue'}`}></span>
                      <p className="text-[10px] font-black text-brand-dark uppercase tracking-tighter">
                        {log.risk_level} ALERT
                      </p>
                    </div>
                    <p className="text-[9px] text-slate-400 font-black mt-1 uppercase tracking-widest">{log.timestamp}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-black ${log.aggression_score > 80 ? 'text-brand-red' : 'text-brand-dark'}`}>{log.aggression_score}%</div>
                  <div className="text-[8px] text-slate-300 font-black uppercase tracking-widest">Sévérité</div>
                </div>
              </div>

              {log.alert_recommended && (
                <div className="mt-4 p-4 bg-brand-red/5 rounded-brand border border-brand-red/10">
                  <p className="text-[9px] font-black text-brand-red mb-1 uppercase tracking-widest">Remarque de l'IA</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed italic font-medium">"{log.admin_alert_message}"</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {log.observed_behaviors.map((behavior, idx) => (
                  <span key={idx} className="px-3 py-1 bg-slate-100 text-[9px] text-slate-500 font-black rounded-full uppercase tracking-widest">
                    {behavior}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertDashboard;
