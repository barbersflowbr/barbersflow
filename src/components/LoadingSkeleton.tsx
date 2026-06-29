import React from "react";
import { motion } from "motion/react";
import { Clock, Calendar, Scissors, User, Search, Smartphone } from "lucide-react";

interface SkeletonProps {
  className?: string;
}

// Dark theme pulse for dark screens (Client PWA & Admin Panel)
export const SkeletonPulse: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <motion.div
      initial={{ opacity: 0.35 }}
      animate={{ opacity: [0.35, 0.75, 0.35] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      className={`bg-white/5 rounded-xl ${className}`}
    />
  );
};

// Light theme pulse for light screens (SuperAdmin Panel)
export const SkeletonPulseLight: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <motion.div
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 0.85, 0.4] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      className={`bg-gray-200 rounded-xl ${className}`}
    />
  );
};

/**
 * 1. Client PWA Shell Loading Skeleton
 * Fits perfectly inside the mobile-first viewport of the Client PWA,
 * mirroring step headers, category filters, services/barbers cards, and checkout button.
 */
export const PWAShellSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-100 flex flex-col w-full max-w-md mx-auto relative overflow-hidden border-x border-white/5">
      {/* Absolute ambient lights */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Mockup */}
      <div className="sticky top-0 z-50 px-5 pt-4 pb-3 bg-[#0E0E10]/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonPulse className="w-10 h-10 rounded-xl border border-white/5" />
          <div className="space-y-2">
            <SkeletonPulse className="w-24 h-4" />
            <SkeletonPulse className="w-16 h-2.5" />
          </div>
        </div>
        <SkeletonPulse className="w-8 h-8 rounded-lg" />
      </div>

      {/* Step Tracker Mockup */}
      <div className="p-4 space-y-4 flex-1">
        <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
          <SkeletonPulse className="w-20 h-4" />
          <SkeletonPulse className="w-28 h-4" />
        </div>

        {/* Category Selector Mockup (Horizontal pills) */}
        <div className="flex gap-2 pb-2 overflow-x-hidden">
          <SkeletonPulse className="w-16 h-8 rounded-lg shrink-0" />
          <SkeletonPulse className="w-20 h-8 rounded-lg shrink-0" />
          <SkeletonPulse className="w-16 h-8 rounded-lg shrink-0" />
          <SkeletonPulse className="w-24 h-8 rounded-lg shrink-0" />
        </div>

        {/* Dynamic Card List (e.g. Services / Barbers) */}
        <div className="space-y-3.5 pt-1">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-white/5 bg-[#121215]/50 flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5 w-full">
                {/* Circle avatar mockup for barbers or square for service */}
                <SkeletonPulse className="w-12 h-12 rounded-xl shrink-0" />
                <div className="space-y-2 w-1/2">
                  <SkeletonPulse className="w-full h-4" />
                  <SkeletonPulse className="w-2/3 h-2.5" />
                </div>
              </div>
              <SkeletonPulse className="w-14 h-5 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Bottom Mockup CTA Button */}
      <div className="sticky bottom-0 p-4 bg-[#0A0A0B]/90 backdrop-blur-md border-t border-white/5">
        <SkeletonPulse className="w-full h-12 rounded-xl" />
      </div>
    </div>
  );
};

/**
 * 2. Bookings Calendar Loading Skeleton
 * Fits into the Interactive Calendar tab of the Admin Panel,
 * representing the barbers columns, time slots, and scheduled appointment cards.
 */
export const BookingsCalendarSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Controls Mockup */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121215] p-5 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <SkeletonPulse className="w-10 h-10 rounded-xl" />
          <div className="space-y-1">
            <SkeletonPulse className="w-20 h-3" />
            <SkeletonPulse className="w-32 h-4" />
          </div>
          <SkeletonPulse className="w-10 h-10 rounded-xl" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/5">
          <SkeletonPulse className="w-28 h-8 rounded-lg" />
          <SkeletonPulse className="w-24 h-8 rounded-lg" />
          <SkeletonPulse className="w-24 h-8 rounded-lg" />
        </div>
      </div>

      {/* Grid Table Mockup */}
      <div className="bg-[#121215] rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-[#0E0E10]/80 h-14">
                <th className="px-6 w-28">
                  <SkeletonPulse className="w-16 h-4" />
                </th>
                {[...Array(3)].map((_, i) => (
                  <th key={i} className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <SkeletonPulse className="w-9 h-9 rounded-full border border-white/10 shrink-0" />
                      <div className="space-y-1.5 w-24">
                        <SkeletonPulse className="w-full h-3.5" />
                        <SkeletonPulse className="w-2/3 h-2.5" />
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...Array(4)].map((_, rowIndex) => (
                <tr key={rowIndex} className="h-24">
                  {/* Time slot */}
                  <td className="px-6 border-r border-white/5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500/20" />
                      <SkeletonPulse className="w-12 h-4" />
                    </div>
                  </td>
                  {/* Barber columns */}
                  {[...Array(3)].map((_, colIndex) => {
                    // Randomize cell content to look organic: some scheduled, some blank
                    const isScheduled = (rowIndex + colIndex) % 2 === 0;
                    return (
                      <td key={colIndex} className="px-4 py-2 border-r border-white/5">
                        {isScheduled ? (
                          <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02] space-y-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
                              <SkeletonPulse className="w-24 h-3.5" />
                            </div>
                            <SkeletonPulse className="w-32 h-2.5" />
                          </div>
                        ) : (
                          <div className="w-full h-8 flex items-center justify-center opacity-20">
                            <PlusIconMinimal />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PlusIconMinimal = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-gray-600"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

/**
 * 3. Barbearia Table Loading Skeleton
 * Light-themed elegant table skeleton to load lists of Barbearias
 * inside the global SuperAdminPanel.
 */
export const BarbeariaTableSkeleton: React.FC = () => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 font-medium">Barbearia / Contato</th>
            <th className="px-6 py-4 font-medium">Slug (Link)</th>
            <th className="px-6 py-4 font-medium">Plano</th>
            <th className="px-6 py-4 font-medium">Status</th>
            <th className="px-6 py-4 font-medium">Métricas</th>
            <th className="px-6 py-4 font-medium">Data de Cadastro</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="bg-white">
              {/* Barbearia / Contato */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <SkeletonPulseLight className="w-8 h-8 rounded-full shrink-0" />
                  <div className="space-y-1.5 w-32">
                    <SkeletonPulseLight className="w-full h-4" />
                    <SkeletonPulseLight className="w-2/3 h-2.5" />
                  </div>
                </div>
              </td>
              {/* Slug */}
              <td className="px-6 py-4">
                <SkeletonPulseLight className="w-20 h-4 rounded-md" />
              </td>
              {/* Plano */}
              <td className="px-6 py-4">
                <SkeletonPulseLight className="w-16 h-5 rounded-full" />
              </td>
              {/* Status */}
              <td className="px-6 py-4">
                <SkeletonPulseLight className="w-12 h-5 rounded-full" />
              </td>
              {/* Métricas */}
              <td className="px-6 py-4">
                <div className="space-y-1 w-20">
                  <SkeletonPulseLight className="w-full h-3" />
                  <SkeletonPulseLight className="w-2/3 h-2.5" />
                </div>
              </td>
              {/* Data de Cadastro */}
              <td className="px-6 py-4">
                <SkeletonPulseLight className="w-24 h-4" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
