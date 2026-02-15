
import React, { useState, useEffect } from 'react';
// Fixed: Using standard IncidentReport from types.ts and aligning property names
import { IncidentReport } from '../types';

interface ReportGalleryProps {
  reports: IncidentReport[];
}

const ReportGallery: React.FC<ReportGalleryProps> = ({ reports }) => {
  const [printingId, setPrintingId] = useState<string | null>(null);

  useEffect(() => {
    if (printingId !== null || document.body.classList.contains('printing-all')) {
      const timer = setTimeout(() => {
        window.print();
        // Reset states after print dialog is closed
        setPrintingId(null);
        document.body.classList.remove('printing-single', 'printing-all');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printingId]);

  if (reports.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-12 bg-slate-900/20 rounded-2xl border-2 border-dashed border-slate-800">
        <i className="fas fa-folder-open text-5xl mb-4 opacity-20"></i>
        <h3 className="text-lg font-bold text-slate-400">Incident Archive Empty</h3>
        <p className="text-sm max-w-xs text-center mt-2">Critical aggression events will be documented here with visual evidence and face analysis.</p>
      </div>
    );
  }

  const handlePrintAll = () => {
    document.body.classList.add('printing-all');
    window.print();
    document.body.classList.remove('printing-all');
  };

  const handlePrintSingle = (reportId: string) => {
    document.body.classList.add('printing-single');
    setPrintingId(reportId);
  };

  const handleNotify = (reportId: string) => {
    alert(`Administrative Alert sent to campus security for Incident ${reportId}. Local authorities have been paged.`);
  };

  return (
    <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 h-full report-container">
      <div className="flex justify-between items-center mb-6 no-print">
        <h2 className="text-xl font-bold text-white flex items-center">
          <i className="fas fa-archive mr-3 text-red-500"></i>
          Incident Records <span className="ml-3 px-2 py-0.5 bg-slate-800 text-xs rounded-full text-slate-400">{reports.length}</span>
        </h2>
        <button 
          onClick={handlePrintAll}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg flex items-center group"
        >
          <i className="fas fa-file-export mr-2 group-hover:scale-110 transition-transform"></i>
          Export All as PDF
        </button>
      </div>

      {reports.map((report) => (
        <div 
          key={report.id} 
          className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl report-card ${printingId === report.id ? 'is-printing' : ''}`}
        >
          <div className="bg-red-600/10 border-b border-red-500/20 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <span className="bg-red-600 text-[10px] font-black px-2 py-0.5 rounded text-white uppercase tracking-tighter no-print-bg">CRITICAL INCIDENT</span>
              <span className="text-xs font-mono text-slate-400">REF: {report.id}</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">{new Date(report.timestamp).toLocaleString()}</span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual Evidence */}
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-slate-700 aspect-video bg-black">
                {report.thumbnail ? (
                  <>
                    <img src={report.thumbnail} alt="Incident Capture" className="w-full h-full object-cover" />
                    {/* Render Face Bounding Boxes */}
                    {report.detectedFaces?.map((face: any, idx: number) => {
                      const [ymin, xmin, ymax, xmax] = face.box_2d;
                      return (
                        <div 
                          key={idx}
                          className="absolute border-2 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] flex flex-col"
                          style={{
                            top: `${ymin / 10}%`,
                            left: `${xmin / 10}%`,
                            width: `${(xmax - xmin) / 10}%`,
                            height: `${(ymax - ymin) / 10}%`
                          }}
                        >
                          <span className="absolute -top-5 left-0 bg-red-600 text-[8px] px-1 text-white font-bold whitespace-nowrap uppercase no-print-bg">
                            FACE_{idx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-image-slash text-slate-800 text-3xl"></i>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-mono text-white/80 no-print">
                  SEC_CAM_01 | HD_CAPTURE
                </div>
              </div>

              {/* Detected Faces Grid */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identified Subject Details</h4>
                <div className="flex flex-wrap gap-2">
                  {report.detectedFaces && report.detectedFaces.length > 0 ? (
                    report.detectedFaces.map((_: any, idx: number) => (
                      <div key={idx} className="bg-slate-800 border border-slate-700 p-2 rounded-lg flex items-center space-x-3 w-[120px]">
                        <div className="w-8 h-8 bg-red-500/20 rounded flex items-center justify-center border border-red-500/30">
                          <i className="fas fa-user-secret text-red-400 text-xs"></i>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white font-bold">Subject {idx + 1}</span>
                          <span className="text-[8px] text-slate-500 uppercase">Detection ID: {Math.floor(Math.random() * 9999)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-600 italic">No clear face vectors captured.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Incident Details */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Automated Event Summary</h4>
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  {report.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="block text-[8px] text-slate-500 uppercase tracking-widest">Aggression Score</span>
                  <span className="text-xl font-black text-red-500">{report.aggressionScore}%</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="block text-[8px] text-slate-500 uppercase tracking-widest">Escalation Rate</span>
                  <span className="text-xl font-black text-orange-400">{report.escalationProbability}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Observed Aggressors Behaviors</h4>
                <div className="flex flex-wrap gap-1.5">
                  {report.observedBehaviors?.map((b, i) => (
                    <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold rounded border border-red-500/20">
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3 no-print">
                <button 
                  onClick={() => handlePrintSingle(report.id)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center shadow-lg active:scale-95"
                >
                  <i className="fas fa-file-pdf mr-2 text-red-400"></i> Download PDF
                </button>
                <button 
                  onClick={() => handleNotify(report.id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-indigo-600/20 flex items-center active:scale-95"
                >
                  <i className="fas fa-share-nodes mr-2"></i> Notify Authorities
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportGallery;
