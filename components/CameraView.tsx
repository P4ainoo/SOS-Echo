
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { analyzeFrame } from '../services/gemini';
import { AIResponse } from '../types';

interface CameraViewProps {
  onAnalysisResult: (result: AIResponse, thumbnail: string) => void;
  isScanning: boolean;
  latestAlert?: AIResponse;
}

const CameraView: React.FC<CameraViewProps> = ({ onAnalysisResult, isScanning, latestAlert }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      if (!isScanning) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setError(null);
      } catch (err) {
        setError("Camera access denied. Please check permissions.");
        console.error(err);
      }
    };

    if (isScanning) {
      startCamera();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanning]);

  const captureAndAnalyze = useCallback(async () => {
    if (!isScanning || !videoRef.current || !canvasRef.current || analyzing || quotaExceeded) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (context && video.videoWidth > 0) {
      setAnalyzing(true);
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      const thumbnail = canvas.toDataURL('image/jpeg', 0.5);

      try {
        const result = await analyzeFrame(base64Data);
        onAnalysisResult(result, thumbnail);
        if (quotaExceeded) setQuotaExceeded(false);
      } catch (err: any) {
        console.error("Analysis failed", err);
        if (err.message?.includes('429') || err.message?.includes('quota') || err.status === 'RESOURCE_EXHAUSTED') {
          setQuotaExceeded(true);
          setTimeout(() => setQuotaExceeded(false), 45000);
        }
      } finally {
        setAnalyzing(false);
      }
    }
  }, [analyzing, onAnalysisResult, quotaExceeded, isScanning]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || analyzing || quotaExceeded) return;

    setAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const resultData = e.target?.result as string;
      const base64Data = resultData.split(',')[1];
      
      try {
        const aiResult = await analyzeFrame(base64Data);
        onAnalysisResult(aiResult, resultData);
        if (quotaExceeded) setQuotaExceeded(false);
      } catch (err: any) {
        console.error("Manual upload analysis failed", err);
        if (err.message?.includes('429') || err.message?.includes('quota') || err.status === 'RESOURCE_EXHAUSTED') {
          setQuotaExceeded(true);
          setTimeout(() => setQuotaExceeded(false), 45000);
        }
      } finally {
        setAnalyzing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    let interval: number;
    if (isScanning && !analyzing && !quotaExceeded) {
      interval = window.setInterval(captureAndAnalyze, 30000); 
    }
    return () => clearInterval(interval);
  }, [isScanning, analyzing, captureAndAnalyze, quotaExceeded]);

  const isCritical = latestAlert?.risk_level === 'critical' && latestAlert.alert_recommended;

  return (
    <div className={`relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden shadow-2xl border-4 transition-all duration-500 ${!isScanning ? 'border-slate-800' : isCritical ? 'border-red-600' : 'border-indigo-600/30'}`}>
      {!isScanning ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/80 backdrop-blur-sm z-30">
          <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-800 mb-6 shadow-2xl">
            <i className="fas fa-power-off text-slate-700 text-3xl"></i>
          </div>
          <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter mb-2">System Offline</h3>
          <p className="text-sm text-slate-600 max-w-xs">Vision processing is currently suspended. Toggle 'SYSTEM ON' to resume monitoring.</p>
        </div>
      ) : error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <i className="fas fa-camera-slash text-slate-700 text-5xl mb-4"></i>
          <p className="text-slate-400 font-medium">{error}</p>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover transition-all duration-300 ${isCritical ? 'sepia-[0.2] contrast-125' : 'grayscale-[0.3]'}`}
          />
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*"
          />
          
          {quotaExceeded && (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-20">
              <i className="fas fa-hourglass-half text-amber-500 text-4xl mb-4 animate-bounce"></i>
              <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-tighter">Free Tier Quota Exhausted</h3>
              <p className="text-sm text-slate-400 max-w-sm">SafeLens AI is cooling down to comply with free-tier rate limits. Monitoring will automatically resume shortly.</p>
              <div className="mt-6 flex space-x-3">
                <button 
                  onClick={() => setQuotaExceeded(false)}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-lg"
                >
                  Manual Retry
                </button>
              </div>
            </div>
          )}

          {isCritical && !quotaExceeded && (
            <div className="absolute inset-0 bg-red-600/20 animate-pulse pointer-events-none flex items-center justify-center">
               <div className="bg-red-600 text-white px-8 py-4 rounded-xl shadow-2xl border-2 border-white/50 animate-bounce">
                  <h3 className="text-3xl font-black italic tracking-tighter">ALERTTTTT!!!</h3>
                  <p className="text-xs font-bold text-center uppercase tracking-widest mt-1">Violence / Fighting Detected</p>
               </div>
            </div>
          )}

          {isScanning && !isCritical && !quotaExceeded && (
            <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-[scan_4s_ease-in-out_infinite]"></div>
          )}

          <style>{`
            @keyframes scan {
              0% { top: 0%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 100%; opacity: 0; }
            }
          `}</style>

          <div className="absolute top-4 left-4 flex flex-col space-y-2">
            <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-500 animate-ping' : quotaExceeded ? 'bg-amber-500' : 'bg-indigo-500 animate-pulse'}`}></div>
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                {quotaExceeded ? 'PAUSED' : isCritical ? 'VIOLENCE DETECTED' : 'Flash Lite Optimized Feed'}
              </span>
            </div>
            {analyzing && (
              <div className="px-3 py-1 bg-indigo-600/80 backdrop-blur-md rounded-full border border-indigo-400/50 flex items-center space-x-2">
                <i className="fas fa-spinner fa-spin text-[10px] text-white"></i>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Vision Logic Processing...</span>
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div className="space-y-1">
              <div className="text-xs text-white font-mono tracking-wider bg-black/40 px-2 py-1 rounded">
                {new Date().toLocaleTimeString()} | 30S_FREE_CYC
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzing || quotaExceeded}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all border border-indigo-400/30 backdrop-blur-md flex items-center space-x-2 ${
                  quotaExceeded 
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-indigo-900/40 hover:bg-indigo-800/60 text-white'
                }`}
              >
                <i className="fas fa-upload text-[10px]"></i>
                <span>Test with Image</span>
              </button>
              <button 
                onClick={captureAndAnalyze}
                disabled={analyzing || quotaExceeded}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                  quotaExceeded
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : isCritical 
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/50' 
                  : analyzing 
                  ? 'bg-slate-700 text-slate-500' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {quotaExceeded ? 'Rate Limited' : 'Analyze Frame'}
              </button>
            </div>
          </div>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;
