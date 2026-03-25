import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const NotificationToast = ({ notification, onDismiss }) => {
  const { id, alert_type, message, severity, timestamp } = notification;

  const getIcon = () => {
    switch (severity.toLowerCase()) {
      case 'high': return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'medium': return <Info className="w-6 h-6 text-orange-500" />;
      default: return <CheckCircle className="w-6 h-6 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-950/40 border-red-900/50';
      case 'medium': return 'bg-orange-950/40 border-orange-900/50';
      default: return 'bg-blue-950/40 border-blue-900/50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      className={`max-w-md w-full pointer-events-auto rounded-xl border p-4 shadow-2xl backdrop-blur-md ${getBgColor()}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            {alert_type}
          </p>
          <p className="mt-1 text-sm text-gray-300">
            {message}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            {new Date(timestamp).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex-shrink-0 flex">
          <button
            onClick={() => onDismiss(id)}
            className="rounded-md inline-flex text-gray-500 hover:text-gray-200 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationToast;
