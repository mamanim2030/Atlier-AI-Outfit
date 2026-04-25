import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, Upload, Settings, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-serif text-white mb-6 flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-white/70" />
              How to Use AI Outfit Studio
            </h2>

            <div className="space-y-8 text-white/80 font-sans">
              <section>
                <h3 className="text-lg font-medium text-white mb-3 pl-4 border-l-2 border-white/20">1. Upload Source Images</h3>
                <div className="bg-white/5 rounded-xl p-4 space-y-3 text-sm">
                  <p className="flex items-start gap-2">
                    <Upload className="w-4 h-4 mt-0.5 text-white/50 shrink-0" />
                    <span><strong>Item Image (Required):</strong> Upload a clear image of the clothing item or accessory you want to generate shots for. The image should ideally have a clean background.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <ImageIcon className="w-4 h-4 mt-0.5 text-white/50 shrink-0" />
                    <span><strong>Background Image (Optional):</strong> Upload a background image to place the model in a specific environment (e.g., street, cafe, studio).</span>
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-medium text-white mb-3 pl-4 border-l-2 border-white/20">2. Configure Generation Settings</h3>
                <div className="bg-white/5 rounded-xl p-4 space-y-3 text-sm">
                  <p className="flex items-start gap-2">
                    <Settings className="w-4 h-4 mt-0.5 text-white/50 shrink-0" />
                    <span>Select the <strong>Item Category</strong> properly (e.g., Top, Bottom, Accessory). This drastically changes how the AI expects to style and pose the model (e.g., accessories will be held or worn naturally, pants will show full legs).</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Settings className="w-4 h-4 mt-0.5 text-white/50 shrink-0" />
                    <span>Adjust <strong>Model Gender</strong>, <strong>Season</strong>, <strong>Fit</strong>, and <strong>Style</strong> to perfectly match the mood of the item.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Settings className="w-4 h-4 mt-0.5 text-white/50 shrink-0" />
                    <span>Check <strong>Enable Full Body Shot</strong>, <strong>Coordination Shot</strong>, or <strong>Detail Texture</strong> depending on what results you need for your catalog.</span>
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-medium text-white mb-3 pl-4 border-l-2 border-white/20">3. Generate & Refine</h3>
                <div className="bg-white/5 rounded-xl p-4 space-y-3 text-sm">
                  <p className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 text-white/50 shrink-0" />
                    <span>Click <strong>Generate All Shots</strong>. The AI will analyze your item and generate professional model shots, detail shots, and styling variations based on your configuration.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 text-white/50 shrink-0" />
                    <span><strong>Important Note on Accessories:</strong> When generating shots for accessories (bags, hats, shoes), the AI will make the accessory the focal point. Make sure the accessory image is very clear so the AI doesn't hallucinate missing parts (like adding a strap to a clutch).</span>
                  </p>
                </div>
              </section>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-white text-black font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
