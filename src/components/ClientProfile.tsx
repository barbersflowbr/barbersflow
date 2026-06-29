import React, { useState } from "react";
import { motion } from "motion/react";
import { User, Mail, Phone, Save, X } from "lucide-react";

interface ClientProfileProps {
  clientName: string;
  setClientName: (name: string) => void;
  clientEmail: string;
  setClientEmail: (email: string) => void;
  clientPhone: string;
  setClientPhone: (phone: string) => void;
  onClose: () => void;
}

export default function ClientProfile({
  clientName,
  setClientName,
  clientEmail,
  setClientEmail,
  clientPhone,
  setClientPhone,
  onClose,
}: ClientProfileProps) {
  const [name, setName] = useState(clientName);
  const [email, setEmail] = useState(clientEmail);
  const [phone, setPhone] = useState(clientPhone);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "Nome é obrigatório";
    if (email && !/\S+@\S+\.\S+/.test(email)) newErrors.email = "E-mail inválido";
    if (phone && phone.replace(/\D/g, "").length < 10) newErrors.phone = "Telefone inválido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    
    setIsSaving(true);
    
    // Simulate API delay
    setTimeout(() => {
      setClientName(name);
      setClientEmail(email);
      setClientPhone(phone);
      setIsSaving(false);
      onClose();
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-[#0E0E11] z-50 flex flex-col p-6"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-white">Meu Perfil</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <User className="w-4 h-4" /> Nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full bg-[#1C1C21] border rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 ${errors.name ? "border-red-500" : "border-[#2D2D35]"}`}
          />
          {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Mail className="w-4 h-4" /> E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full bg-[#1C1C21] border rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 ${errors.email ? "border-red-500" : "border-[#2D2D35]"}`}
          />
          {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Phone className="w-4 h-4" /> Telefone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`w-full bg-[#1C1C21] border rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 ${errors.phone ? "border-red-500" : "border-[#2D2D35]"}`}
          />
          {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-amber-500 text-[#0E0E11] font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-4 hover:bg-amber-400 transition disabled:opacity-50"
        >
          {isSaving ? "Salvando..." : <><Save className="w-5 h-5" /> Salvar Alterações</>}
        </button>
      </div>
    </motion.div>
  );
}
