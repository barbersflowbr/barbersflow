import React, { useState, useEffect } from 'react';
import { Barber, Service, Appointment } from '../types';
import { updateBarbearia } from '../lib/db-postgres';
import { Plus, Trash, Clock, Scissors, Edit, Save, X, Calendar, Settings, Sparkles, Users } from 'lucide-react';
import ImageUploader from './ImageUploader';

interface BarberManagerProps {
  barbeariaId: string;
  barbers: Barber[];
  services: Service[];
  bookings?: Appointment[];
  onUpdate: () => void;
}

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const INTERVALS = [15, 30, 45, 60];

export default function BarberManager({ barbeariaId, barbers, services, bookings = [], onUpdate }: BarberManagerProps) {
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [activeEditTab, setActiveEditTab] = useState<'perfil' | 'agenda' | 'clientes'>('perfil');
  const [isAddingBarber, setIsAddingBarber] = useState(false);
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberRole, setNewBarberRole] = useState('');
  const [newBarberAvatar, setNewBarberAvatar] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [selectedClientEmail, setSelectedClientEmail] = useState<string>('');
  const [clientNote, setClientNote] = useState<string>('');

  // Reset state when barbearia changes
  useEffect(() => {
    setEditingBarber(null);
    setIsAddingBarber(false);
    setNewBarberName('');
    setNewBarberRole('');
    setNewBarberAvatar('');
    setAddError(null);
    setEditError(null);
    setSelectedClientEmail('');
    setClientNote('');
  }, [barbeariaId]);

  // Reset selected client when switching barbers or opening modal
  useEffect(() => {
    setSelectedClientEmail('');
    setClientNote('');
    setActiveEditTab('perfil');
  }, [editingBarber?.id]);

  // Sync client preferences notes
  useEffect(() => {
    if (editingBarber && selectedClientEmail) {
      const key = selectedClientEmail.toLowerCase().trim();
      setClientNote(editingBarber.clientPreferences?.[key] || '');
    } else {
      setClientNote('');
    }
  }, [selectedClientEmail, editingBarber?.id]);

  const handleUpdate = async (barber: Barber) => {
    if (!barber.name.trim() || !barber.role.trim()) {
      setEditError('Nome e cargo são obrigatórios.');
      return;
    }
    setEditError(null);
    
    // Ensure slot interval is initialized
    const sanitizedBarber: Barber = {
      ...barber,
      workingHours: {
        ...barber.workingHours,
        slotInterval: barber.workingHours.slotInterval || 30
      }
    };

    const updatedBarbers = barbers.map(b => b.id === barber.id ? sanitizedBarber : b);
    await updateBarbearia(barbeariaId, { barbers: updatedBarbers });
    setEditingBarber(null);
    onUpdate();
  };

  const handleAdd = async () => {
    if (!newBarberName.trim() || !newBarberRole.trim()) {
      setAddError('Nome e cargo são obrigatórios.');
      return;
    }
    setAddError(null);
    const newBarber: Barber = {
      id: Date.now().toString(),
      name: newBarberName,
      role: newBarberRole,
      avatar: newBarberAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
      rating: 5.0,
      reviews: 0,
      specialties: [],
      assignedServices: [],
      workingHours: { 
        days: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], 
        start: '09:00', 
        end: '18:00',
        slotInterval: 30
      }
    };
    await updateBarbearia(barbeariaId, { barbers: [...barbers, newBarber] });
    setNewBarberName('');
    setNewBarberRole('');
    setNewBarberAvatar('');
    setIsAddingBarber(false);
    onUpdate();
  };

  const deleteBarber = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este barbeiro?')) return;
    const updatedBarbers = barbers.filter(b => b.id !== id);
    await updateBarbearia(barbeariaId, { barbers: updatedBarbers });
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            Profissionais & Agendas
          </h2>
          <p className="text-xs text-gray-400 mt-1">Configure o perfil, especialidades, horários e intervalos de atendimento individualizados de cada profissional.</p>
        </div>
        <button 
          onClick={() => setIsAddingBarber(true)} 
          className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all text-xs cursor-pointer"
        >
          <Plus size={16} /> Adicionar Profissional
        </button>
      </div>
      
      {/* List of Barbers Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {barbers.length === 0 ? (
          <div className="md:col-span-2 p-12 text-center bg-[#121215] border border-white/5 rounded-3xl">
            <p className="text-sm text-gray-500 italic">Nenhum profissional cadastrado.</p>
          </div>
        ) : (
          barbers.map(barber => {
            const daysStr = barber.workingHours?.days?.join(', ') || 'Nenhum dia definido';
            const interval = barber.workingHours?.slotInterval || 30;
            return (
              <div key={barber.id} className="bg-[#121215] p-6 rounded-3xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all duration-300 relative group">
                {/* Background gradient accent */}
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-amber-500/5 blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-all duration-500" />
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <img 
                      src={barber.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop'} 
                      alt={barber.name} 
                      className="w-12 h-12 rounded-full border border-white/10 object-cover shrink-0 bg-neutral-900"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base text-white truncate">{barber.name}</h3>
                      <p className="text-xs text-amber-500 font-mono font-medium">{barber.role}</p>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => {
                          setEditingBarber(barber);
                          setActiveEditTab('perfil');
                        }} 
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-black text-gray-400 transition-colors cursor-pointer"
                        title="Editar Perfil"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => deleteBarber(barber.id)} 
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500 hover:text-white text-gray-400 transition-colors cursor-pointer"
                        title="Excluir"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-white/5" />

                  {/* Schedule Summary Section */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock size={14} className="text-amber-500/80 shrink-0" />
                      <span className="font-medium text-gray-400 font-mono">
                        Horário: {barber.workingHours?.start} - {barber.workingHours?.end}
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-2 text-gray-300">
                      <Calendar size={14} className="text-amber-500/80 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-400 truncate" title={daysStr}>
                          Dias: {daysStr}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-300">
                      <Settings size={14} className="text-amber-500/80 shrink-0" />
                      <span className="text-gray-400 font-mono">
                        Intervalo: <strong className="text-amber-500">{interval} min</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingBarber(barber);
                      setActiveEditTab('perfil');
                    }}
                    className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-all cursor-pointer"
                  >
                    Dados & Serviços
                  </button>
                  <button
                    onClick={() => {
                      setEditingBarber(barber);
                      setActiveEditTab('agenda');
                    }}
                    className="flex-1 py-2 text-center text-xs font-extrabold rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black transition-all cursor-pointer border border-amber-500/15"
                  >
                    Configurar Agenda
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD BARBER MODAL */}
      {isAddingBarber && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F0F12] p-6 rounded-3xl border border-white/10 w-full max-w-md space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setIsAddingBarber(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Plus size={16} />
              </div>
              <h3 className="text-lg font-bold text-white">Novo Profissional</h3>
            </div>

            {addError && <p className="text-rose-500 text-xs font-mono">{addError}</p>}
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Nome Completo</label>
                <input 
                  type="text"
                  placeholder="Ex: Carlos Silva" 
                  value={newBarberName} 
                  onChange={e => { setNewBarberName(e.target.value); setAddError(null); }} 
                  className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500/80" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Cargo / Função</label>
                <input 
                  type="text"
                  placeholder="Ex: Barbeiro Master, Especialista" 
                  value={newBarberRole} 
                  onChange={e => { setNewBarberRole(e.target.value); setAddError(null); }} 
                  className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500/80" 
                />
              </div>

              <div>
                <ImageUploader 
                  currentImageUrl={newBarberAvatar}
                  onUploadSuccess={(url) => setNewBarberAvatar(url)}
                  label="Foto de Perfil"
                  aspectRatio="square"
                />
                <span className="text-[10px] text-gray-500 mt-1.5 block">Faça upload de uma foto quadrada para o perfil do profissional.</span>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setIsAddingBarber(false)} 
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAdd} 
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-extrabold tracking-wide transition-all cursor-pointer"
                >
                  Criar Cadastro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* EDIT BARBER & AGENDA MODAL */}
      {editingBarber && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F0F12] p-6 rounded-3xl border border-white/10 w-full max-w-lg space-y-4 shadow-2xl relative">
            
            <button 
              onClick={() => setEditingBarber(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <img 
                src={editingBarber.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop'} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full border border-white/10 object-cover" 
              />
              <div>
                <h3 className="text-lg font-bold text-white">Editar Profissional</h3>
                <p className="text-xs text-amber-500 font-mono">{editingBarber.name}</p>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-white/5 mb-4">
              <button
                type="button"
                onClick={() => setActiveEditTab('perfil')}
                className={`flex-1 pb-2.5 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer ${
                  activeEditTab === 'perfil'
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Perfil & Serviços
              </button>
              <button
                type="button"
                onClick={() => setActiveEditTab('agenda')}
                className={`flex-1 pb-2.5 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer ${
                  activeEditTab === 'agenda'
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Agenda
              </button>
              <button
                type="button"
                onClick={() => setActiveEditTab('clientes')}
                className={`flex-1 pb-2.5 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer ${
                  activeEditTab === 'clientes'
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Clientes & Preferências
              </button>
            </div>

            {editError && <p className="text-rose-500 text-xs font-mono">{editError}</p>}
            
            {/* TAB 1: PERFIL */}
            {activeEditTab === 'perfil' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Nome</label>
                    <input 
                      value={editingBarber.name} 
                      onChange={e => { setEditingBarber({...editingBarber, name: e.target.value}); setEditError(null); }} 
                      className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500/80"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Cargo / Função</label>
                    <input 
                      value={editingBarber.role} 
                      onChange={e => { setEditingBarber({...editingBarber, role: e.target.value}); setEditError(null); }} 
                      className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500/80"
                    />
                  </div>
                </div>

                <div>
                  <ImageUploader 
                    currentImageUrl={editingBarber.avatar}
                    onUploadSuccess={(url) => setEditingBarber({...editingBarber, avatar: url})}
                    label="Foto de Perfil"
                    aspectRatio="square"
                  />
                  <span className="text-[10px] text-gray-500 mt-1.5 block">Faça upload de uma foto quadrada para o perfil do profissional.</span>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-2 uppercase tracking-wider font-semibold">Serviços Atribuídos</label>
                  <div className="p-3 bg-[#131316] border border-white/5 rounded-xl max-h-44 overflow-y-auto space-y-1.5">
                    {services.length === 0 ? (
                      <p className="text-[11px] text-gray-500 italic text-center py-4">Nenhum serviço disponível.</p>
                    ) : (
                      services.map(service => {
                        const isAssigned = editingBarber.assignedServices.includes(service.id);
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => {
                              const assignedServices = isAssigned
                                ? editingBarber.assignedServices.filter(s => s !== service.id)
                                : [...editingBarber.assignedServices, service.id];
                              setEditingBarber({...editingBarber, assignedServices});
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              isAssigned 
                                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' 
                                : 'bg-transparent border border-transparent text-gray-400 hover:bg-white/5'
                            }`}
                          >
                            <span>{service.name}</span>
                            <span className="font-mono text-gray-400">R$ {Number(service.price).toFixed(2)}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CONFIGURAÇÃO DE AGENDA */}
            {activeEditTab === 'agenda' && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Dias de Atendimento</label>
                    <button
                      type="button"
                      onClick={() => {
                        // Toggle select all
                        const hasAll = DAYS.every(d => editingBarber.workingHours.days.includes(d));
                        const days = hasAll ? [] : [...DAYS];
                        setEditingBarber({...editingBarber, workingHours: {...editingBarber.workingHours, days}});
                      }}
                      className="text-[9px] font-mono text-amber-500 hover:underline cursor-pointer"
                    >
                      {DAYS.every(d => editingBarber.workingHours.days.includes(d)) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1.5">
                    {DAYS.map(day => {
                      const isSelected = editingBarber.workingHours.days.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const days = isSelected
                              ? editingBarber.workingHours.days.filter(d => d !== day)
                              : [...editingBarber.workingHours.days, day];
                            setEditingBarber({...editingBarber, workingHours: {...editingBarber.workingHours, days}});
                          }}
                          className={`py-2 px-1 rounded-lg text-center text-xs font-bold transition-all cursor-pointer border ${
                            isSelected 
                              ? 'bg-amber-500 text-black border-amber-500' 
                              : 'bg-[#131316] border-white/5 hover:bg-white/5 text-gray-400'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Horário de Início</label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                      <input 
                        type="time" 
                        value={editingBarber.workingHours.start} 
                        onChange={e => setEditingBarber({...editingBarber, workingHours: {...editingBarber.workingHours, start: e.target.value}})} 
                        className="w-full p-3 pl-10 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500/80 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Horário de Fim</label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                      <input 
                        type="time" 
                        value={editingBarber.workingHours.end} 
                        onChange={e => setEditingBarber({...editingBarber, workingHours: {...editingBarber.workingHours, end: e.target.value}})} 
                        className="w-full p-3 pl-10 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500/80 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-2 uppercase tracking-wider font-semibold">Intervalo de Atendimento</label>
                  <p className="text-[11px] text-gray-500 mb-2">Defina o tempo padrão de cada sessão de agendamento para este profissional.</p>
                  <div className="grid grid-cols-4 gap-2">
                    {INTERVALS.map((min) => {
                      const isSelected = (editingBarber.workingHours.slotInterval || 30) === min;
                      return (
                        <button
                          key={min}
                          type="button"
                          onClick={() => setEditingBarber({
                            ...editingBarber,
                            workingHours: {
                              ...editingBarber.workingHours,
                              slotInterval: min
                            }
                          })}
                          className={`py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer text-center border ${
                            isSelected 
                              ? 'bg-amber-500 text-black border-amber-500' 
                              : 'bg-[#131316] border-white/5 hover:bg-white/5 text-gray-300'
                          }`}
                        >
                          {min} min
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CLIENTES & PREFERÊNCIAS */}
            {activeEditTab === 'clientes' && (
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {(() => {
                  const clientBookings = (bookings || []).filter(b => b.status !== 'Livre');
                  
                  // Group by client email/phone/name to find unique clients
                  const clientMap = new Map<string, { name: string; email: string; phone: string; totalVisits: number; professionalVisits: number }>();
                  
                  clientBookings.forEach(b => {
                    const key = b.clientEmail.toLowerCase().trim() || b.clientPhone || b.clientName;
                    const isWithThisBarber = b.barberId === editingBarber.id;
                    
                    if (!clientMap.has(key)) {
                      clientMap.set(key, {
                        name: b.clientName,
                        email: b.clientEmail,
                        phone: b.clientPhone,
                        totalVisits: 1,
                        professionalVisits: isWithThisBarber ? 1 : 0
                      });
                    } else {
                      const current = clientMap.get(key)!;
                      current.totalVisits += 1;
                      if (isWithThisBarber) {
                        current.professionalVisits += 1;
                      }
                    }
                  });
                  
                  const uniqueClientsList = Array.from(clientMap.values());

                  if (uniqueClientsList.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-500 text-xs font-mono border border-dashed border-white/5 rounded-2xl">
                        Nenhum cliente agendado na barbearia até o momento.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {/* Dropdown de Seleção de Cliente */}
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">
                          Selecionar Cliente
                        </label>
                        <select
                          value={selectedClientEmail}
                          onChange={(e) => setSelectedClientEmail(e.target.value)}
                          className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500/80 cursor-pointer"
                        >
                          <option value="">-- Selecione um Cliente --</option>
                          {uniqueClientsList.map((client) => {
                            const badge = client.professionalVisits > 0 
                              ? `(${client.professionalVisits} agend. com você)` 
                              : `(Outros profissionais)`;
                            return (
                              <option key={client.email} value={client.email}>
                                {client.name} - {client.email} {badge}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {selectedClientEmail ? (() => {
                        const client = uniqueClientsList.find(c => c.email === selectedClientEmail);
                        if (!client) return null;

                        // Find history with this barber
                        const history = clientBookings.filter(b => 
                          (b.clientEmail.toLowerCase().trim() === client.email.toLowerCase().trim()) && 
                          b.barberId === editingBarber.id
                        ).sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));

                        return (
                          <div className="space-y-4 mt-2">
                            {/* Informações básicas */}
                            <div className="p-4 bg-[#131316] rounded-2xl border border-white/5 space-y-2">
                              <h4 className="text-sm font-bold text-white">{client.name}</h4>
                              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-gray-400">
                                <div>
                                  <span className="block text-gray-500 text-[10px] uppercase">E-mail:</span>
                                  <span className="truncate block text-white font-sans font-medium">{client.email}</span>
                                </div>
                                <div>
                                  <span className="block text-gray-500 text-[10px] uppercase">Telefone:</span>
                                  <span className="text-white font-sans font-medium">{client.phone || 'Não informado'}</span>
                                </div>
                                <div>
                                  <span className="block text-gray-500 text-[10px] uppercase">Visitas com você:</span>
                                  <span className="text-amber-500 font-bold">{client.professionalVisits}</span>
                                </div>
                                <div>
                                  <span className="block text-gray-500 text-[10px] uppercase">Total na Barbearia:</span>
                                  <span className="text-white font-sans font-medium">{client.totalVisits}</span>
                                </div>
                              </div>
                            </div>

                            {/* Preferências do Cliente */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">
                                  Preferências do Cliente
                                </label>
                                <span className="text-[9px] font-mono text-amber-500/80">salva no perfil do profissional</span>
                              </div>
                              <textarea
                                value={clientNote}
                                onChange={(e) => setClientNote(e.target.value)}
                                placeholder="Ex: Gosta de degradê navalhado nas laterais, usa pomada de efeito matte, toma café com açúcar..."
                                rows={3}
                                className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500/80 placeholder:text-gray-600 resize-none"
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  const key = selectedClientEmail.toLowerCase().trim();
                                  const updatedPreferences = {
                                    ...(editingBarber.clientPreferences || {}),
                                    [key]: clientNote
                                  };
                                  const updatedBarber = {
                                    ...editingBarber,
                                    clientPreferences: updatedPreferences
                                  };
                                  setEditingBarber(updatedBarber);
                                  
                                  const updatedBarbers = barbers.map(b => b.id === editingBarber.id ? updatedBarber : b);
                                  await updateBarbearia(barbeariaId, { barbers: updatedBarbers });
                                  onUpdate();
                                }}
                                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-mono tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Save size={14} /> Salvar Preferências
                              </button>
                            </div>

                            {/* Histórico de Agendamentos */}
                            <div className="space-y-2 pt-2">
                              <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">
                                Histórico de Serviços com Você ({history.length})
                              </h4>
                              {history.length === 0 ? (
                                <p className="text-[11px] font-mono text-gray-500 text-center py-4 border border-[#131316] rounded-xl bg-[#09090b]">
                                  Este cliente ainda não realizou atendimentos com você.
                                </p>
                              ) : (
                                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                  {history.map((hItem) => {
                                    const srv = services.find(s => s.id === hItem.serviceId);
                                    const displayDate = hItem.date.split('-').reverse().join('/');
                                    return (
                                      <div key={hItem.id} className="p-3 bg-[#131316] rounded-xl border border-white/5 flex items-center justify-between gap-3 text-xs">
                                        <div className="space-y-0.5">
                                          <p className="font-bold text-white truncate max-w-[150px]">
                                            {srv ? srv.name : 'Serviço Personalizado'}
                                          </p>
                                          <p className="text-[10px] text-gray-500 font-mono">
                                            {displayDate} - {hItem.time}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <span className="block text-amber-500 font-bold font-mono text-[11px]">
                                            R$ {srv ? srv.price : '0,00'}
                                          </span>
                                          <span className={`inline-block px-1.5 py-0.5 rounded-md text-[9px] font-mono leading-none ${
                                            hItem.status === 'Concluído' 
                                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                          }`}>
                                            {hItem.status === 'Concluído' ? 'Concluído' : 'Confirmado'}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="p-8 text-center border border-dashed border-white/5 rounded-2xl text-xs font-mono text-gray-500 bg-[#131316]/30">
                          Selecione um cliente acima para visualizar seu histórico de agendamentos e gerenciar preferências de estilo.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="pt-4 flex gap-3 border-t border-white/5">
              <button 
                onClick={() => setEditingBarber(null)}
                className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/5 text-sm text-gray-300 font-semibold hover:bg-white/10 transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button 
                onClick={() => handleUpdate(editingBarber)}
                className="flex-1 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-extrabold tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Save size={16} /> Salvar Alterações
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
