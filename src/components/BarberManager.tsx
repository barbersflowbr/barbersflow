import React, { useState, useEffect } from 'react';
import { Barber, Service } from '../types';
import { updateBarbearia } from '../lib/db';
import { Plus, Trash, Clock, Scissors, Edit, Save, X } from 'lucide-react';

interface BarberManagerProps {
  barbeariaId: string;
  barbers: Barber[];
  services: Service[];
  onUpdate: () => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function BarberManager({ barbeariaId, barbers, services, onUpdate }: BarberManagerProps) {
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [isAddingBarber, setIsAddingBarber] = useState(false);
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberRole, setNewBarberRole] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Reset state when barbearia changes
  useEffect(() => {
    setEditingBarber(null);
    setIsAddingBarber(false);
    setNewBarberName('');
    setNewBarberRole('');
    setAddError(null);
    setEditError(null);
  }, [barbeariaId]);

  const handleUpdate = async (barber: Barber) => {
    if (!barber.name.trim() || !barber.role.trim()) {
      setEditError('Nome e cargo são obrigatórios.');
      return;
    }
    setEditError(null);
    const updatedBarbers = barbers.map(b => b.id === barber.id ? barber : b);
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
      avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(newBarberName),
      rating: 5.0,
      reviews: 0,
      specialties: [],
      assignedServices: [],
      workingHours: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], start: '09:00', end: '18:00' }
    };
    await updateBarbearia(barbeariaId, { barbers: [...barbers, newBarber] });
    setNewBarberName('');
    setNewBarberRole('');
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
        <h2 className="text-xl font-bold text-white">Gerenciar Barbeiros</h2>
        <button onClick={() => setIsAddingBarber(true)} className="bg-amber-500 text-black px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
          <Plus size={18} /> Adicionar Barbeiro
        </button>
      </div>
      
      
      <div className="grid gap-4">
        {barbers.map(barber => (
          <div key={barber.id} className="bg-[#1C1C21] p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white">{barber.name}</h3>
              <p className="text-gray-400 text-sm">{barber.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditingBarber(barber)} className="p-2 text-gray-400 hover:text-white"><Edit size={18} /></button>
              <button onClick={() => deleteBarber(barber.id)} className="p-2 text-red-400 hover:text-red-500"><Trash size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {isAddingBarber && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1C21] p-6 rounded-xl border border-white/10 w-full max-w-sm space-y-4">
            <h3 className="text-xl font-bold text-white flex justify-between">
              Novo Barbeiro
              <button onClick={() => setIsAddingBarber(false)}><X /></button>
            </h3>
            {addError && <p className="text-red-500 text-sm">{addError}</p>}
            <input placeholder="Nome" value={newBarberName} onChange={e => { setNewBarberName(e.target.value); setAddError(null); }} className="w-full p-2 bg-white/5 rounded-md text-white" />
            <input placeholder="Cargo" value={newBarberRole} onChange={e => { setNewBarberRole(e.target.value); setAddError(null); }} className="w-full p-2 bg-white/5 rounded-md text-white" />
            <button onClick={handleAdd} className="w-full bg-amber-500 text-black py-2 rounded-lg font-semibold">Adicionar</button>
          </div>
        </div>
      )}
      
      {editingBarber && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1C21] p-6 rounded-xl border border-white/10 w-full max-w-lg space-y-4">
            <h3 className="text-xl font-bold text-white flex justify-between">
              Editar {editingBarber.name}
              <button onClick={() => setEditingBarber(null)}><X /></button>
            </h3>
            {editError && <p className="text-red-500 text-sm">{editError}</p>}
            
            <div>
              <label className="block text-sm text-gray-400">Nome</label>
              <input value={editingBarber.name} onChange={e => { setEditingBarber({...editingBarber, name: e.target.value}); setEditError(null); }} className="w-full p-2 bg-white/5 rounded-md text-white mt-1"/>
            </div>
            <div>
              <label className="block text-sm text-gray-400">Cargo</label>
              <input value={editingBarber.role} onChange={e => { setEditingBarber({...editingBarber, role: e.target.value}); setEditError(null); }} className="w-full p-2 bg-white/5 rounded-md text-white mt-1"/>
            </div>
            <div>
              <label className="block text-sm text-gray-400">Serviços Atribuídos</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => {
                      const assignedServices = editingBarber.assignedServices.includes(service.id)
                        ? editingBarber.assignedServices.filter(s => s !== service.id)
                        : [...editingBarber.assignedServices, service.id];
                      setEditingBarber({...editingBarber, assignedServices});
                    }}
                    className={`px-3 py-1 rounded-md text-sm ${editingBarber.assignedServices.includes(service.id) ? 'bg-amber-500 text-black' : 'bg-white/10 text-white'}`}
                  >
                    {service.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400">Dias de Trabalho</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => {
                      const days = editingBarber.workingHours.days.includes(day)
                        ? editingBarber.workingHours.days.filter(d => d !== day)
                        : [...editingBarber.workingHours.days, day];
                      setEditingBarber({...editingBarber, workingHours: {...editingBarber.workingHours, days}});
                    }}
                    className={`px-3 py-1 rounded-md ${editingBarber.workingHours.days.includes(day) ? 'bg-amber-500 text-black' : 'bg-white/10 text-white'}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-400">Início</label>
                <input type="time" value={editingBarber.workingHours.start} onChange={e => setEditingBarber({...editingBarber, workingHours: {...editingBarber.workingHours, start: e.target.value}})} className="w-full p-2 bg-white/5 rounded-md text-white mt-1"/>
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-400">Fim</label>
                <input type="time" value={editingBarber.workingHours.end} onChange={e => setEditingBarber({...editingBarber, workingHours: {...editingBarber.workingHours, end: e.target.value}})} className="w-full p-2 bg-white/5 rounded-md text-white mt-1"/>
              </div>
            </div>

            <button 
              onClick={() => handleUpdate(editingBarber)}
              className="w-full bg-amber-500 text-black py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <Save size={18} /> Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
