import React from 'react';
import { motion } from 'motion/react';
import { Award, Star } from 'lucide-react';

interface LoyaltyCardProps {
  points: number;
  maxPoints: number;
  reward: string;
}

export default function LoyaltyCard({ points, maxPoints, reward }: LoyaltyCardProps) {
  const stamps = Array.from({ length: maxPoints }, (_, i) => i < points);

  return (
    <div className="bg-[#1C1C21] border border-[#2D2D35] rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden group">
      {/* Decorative background star */}
      <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:rotate-12 transition-transform duration-700">
        <Star className="w-32 h-32 text-amber-500" fill="currentColor" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
          <Award className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Cartão Fidelidade</h3>
          <p className="text-gray-400 text-sm">Ganhe 1 ponto a cada serviço</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-4">
        {stamps.map((isStamped, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`aspect-square rounded-xl border-2 flex items-center justify-center transition-colors ${
              isStamped 
                ? 'bg-amber-500 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                : 'bg-[#121215] border-[#2D2D35]'
            }`}
          >
            {isStamped ? (
              <Star className="w-5 h-5 text-[#0E0E11]" fill="currentColor" />
            ) : (
              <span className="text-[#2D2D35] font-bold text-sm">{index + 1}</span>
            )}
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400 font-medium">
          {points >= maxPoints ? 'Prêmio disponível!' : `${maxPoints - points} selos para o prêmio`}
        </span>
        <span className="text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          {reward}
        </span>
      </div>
      
      {points >= maxPoints && (
        <motion.div 
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="mt-4 p-3 bg-amber-500 rounded-lg text-[#0E0E11] font-bold text-center text-sm shadow-lg"
        >
          Resgate seu prêmio na barbearia! 🎁
        </motion.div>
      )}
    </div>
  );
}
