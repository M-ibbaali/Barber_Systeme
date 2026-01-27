"use client";

import { AlertCircle, CheckCircle, Info, X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type DialogType = "info" | "success" | "warning" | "danger" | "confirm";

interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export default function CustomDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  type = "info",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
}: CustomDialogProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setShow(false), 200);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !show) return null;

  const config = {
    info: {
      icon: <Info className="w-6 h-6 text-blue-500" />,
      bg: "bg-blue-50",
      btn: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
    },
    success: {
      icon: <CheckCircle className="w-6 h-6 text-emerald-500" />,
      bg: "bg-emerald-50",
      btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
    },
    warning: {
      icon: <AlertCircle className="w-6 h-6 text-amber-500" />,
      bg: "bg-amber-50",
      btn: "bg-amber-600 hover:bg-amber-700 shadow-amber-200",
    },
    danger: {
      icon: <AlertCircle className="w-6 h-6 text-red-500" />,
      bg: "bg-red-50",
      btn: "bg-red-600 hover:bg-red-700 shadow-red-200",
    },
    confirm: {
      icon: <AlertCircle className="w-6 h-6 text-zinc-500" />,
      bg: "bg-zinc-50",
      btn: "bg-zinc-900 hover:bg-zinc-800 shadow-zinc-200",
    },
  }[type];

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div
        className={`relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 transform ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <div
              className={`p-4 rounded-2xl ${config.bg} mb-6 mt-2 animate-bounce-subtle`}
            >
              {config.icon}
            </div>

            <h3 className="text-xl font-bold text-zinc-900 mb-2 leading-tight">
              {title}
            </h3>

            <p className="text-zinc-500 text-sm leading-relaxed">
              {description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-10">
            {onConfirm && (
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 order-1 sm:order-2 py-3 px-6 rounded-2xl text-white font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${config.btn}`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  confirmText
                )}
              </button>
            )}

            <button
              onClick={onClose}
              disabled={isLoading}
              className={`flex-1 order-2 sm:order-1 py-3 px-6 rounded-2xl text-zinc-600 font-bold text-sm bg-zinc-100 hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50`}
            >
              {onConfirm ? cancelText : "Close"}
            </button>
          </div>
        </div>

        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <style jsx>{`
        @keyframes bounce-subtle {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
