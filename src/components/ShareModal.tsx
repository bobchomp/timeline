"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  timelineId: string;
  editKey: string;
  timelineName: string;
}

export default function ShareModal({ isOpen, onClose, timelineId, editKey, timelineName }: ShareModalProps) {
  const [copiedView, setCopiedView] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);

  const base = typeof window !== "undefined" ? window.location.origin : "";
  const viewUrl = `${base}/t/${timelineId}`;
  const editUrl = `${base}/t/${timelineId}/edit?key=${editKey}`;

  const copy = async (text: string, which: "view" | "edit") => {
    await navigator.clipboard.writeText(text);
    if (which === "view") {
      setCopiedView(true);
      setTimeout(() => setCopiedView(false), 2000);
    } else {
      setCopiedEdit(true);
      setTimeout(() => setCopiedEdit(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Share Timeline</h2>
                    <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{timelineName}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* View-only link */}
                <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">👁</span>
                    <span className="font-semibold text-gray-800 text-sm">View-only link</span>
                    <span className="ml-auto text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">Safe to share publicly</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Anyone with this link can view the timeline but cannot make changes.</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={viewUrl}
                      className="flex-1 text-xs px-3 py-2 bg-white rounded-xl border border-gray-200 text-gray-600 focus:outline-none"
                    />
                    <button
                      onClick={() => copy(viewUrl, "view")}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        copiedView
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "btn-primary"
                      }`}
                    >
                      {copiedView ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Edit link */}
                <div className="rounded-2xl border border-orange-200 p-4 bg-orange-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">✏️</span>
                    <span className="font-semibold text-gray-800 text-sm">Edit link</span>
                    <span className="ml-auto text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">⚠️ Share carefully</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Anyone with this link can add, edit, and delete events on your timeline.</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={editUrl}
                      className="flex-1 text-xs px-3 py-2 bg-white rounded-xl border border-orange-200 text-gray-600 focus:outline-none"
                    />
                    <button
                      onClick={() => copy(editUrl, "edit")}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        copiedEdit
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-orange-500 hover:bg-orange-600 text-white"
                      }`}
                    >
                      {copiedEdit ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
