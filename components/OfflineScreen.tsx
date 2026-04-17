
import React from 'react';
import { motion } from 'motion/react';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

const OfflineScreen: React.FC = () => {
  const [checking, setChecking] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);

  const handleRetry = () => {
    setChecking(true);
    
    // Check navigator status
    if (navigator.onLine) {
      window.location.reload();
    } else {
      // Still offline, show feedback instead of reloading (which causes white screen)
      setTimeout(() => {
        setChecking(false);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center max-w-sm"
      >
        <div className="relative mb-8">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-blue-100 rounded-full scale-150 blur-xl"
          />
          <div className="relative bg-white p-6 rounded-full shadow-2xl border border-slate-100">
            <WifiOff size={48} className="text-slate-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Connection Lost</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Opps! It seems you are not connected to the internet. <strong>ilmaura</strong> needs an active connection to sync your school data.
        </p>

        <div className="relative">
          <button
            onClick={handleRetry}
            disabled={checking}
            className="flex items-center gap-2 px-8 py-3 bg-[#007bff] text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 active:scale-95 disabled:opacity-70"
          >
            <RefreshCw size={18} className={checking ? "animate-spin" : ""} />
            {checking ? "Checking..." : "Retry Connection"}
          </button>

          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 whitespace-nowrap flex items-center gap-2 text-rose-600 font-bold text-sm bg-rose-50 px-4 py-2 rounded-lg border border-rose-100"
            >
              <AlertCircle size={14} />
              Still offline. Check your Wi-Fi!
            </motion.div>
          )}
        </div>

        <p className="mt-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
          Powered by ilmaura ecosystem
        </p>
      </motion.div>
    </div>
  );
};

export default OfflineScreen;
