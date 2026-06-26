import React, { useState, useEffect } from 'react';
import { Barbearia } from '../lib/db';
import { getAllBarbearias } from '../lib/db';
import { ShieldAlert, ArrowLeft, Search, Building2, Users, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logoutBarbearia } from '../lib/db';

export default function SuperAdminPanel({ onBack }: { onBack: () => void }) {
  const [barbearias, setBarbearias] = useState<Barbearia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      // Verificação simples: apenas o email do criador (ou um admin designado) tem acesso
      if (session?.user?.email === 'barbersflowbr@gmail.com') {
        setIsAuthorized(true);
        loadData();
      } else {
        setIsAuthorized(false);
      }
      setAuthChecking(false);
    }
    
    checkAuth();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const data = await getAllBarbearias();
      setBarbearias(data || []);
    } catch (error) {
      console.error('Error loading barbearias:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredBarbearias = barbearias.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          Você não tem permissão para acessar o painel de administração global. 
          Faça login com a conta de super administrador.
        </p>
        <button 
          onClick={onBack}
          className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Voltar para a página inicial
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-4 p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-blue-600" />
                Super Admin
              </h1>
              <p className="text-gray-500 mt-1">Gestão global de todas as barbearias SaaS</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-sm flex items-center gap-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-xs text-gray-500 font-medium">Total de Contas</div>
                <div className="text-lg font-bold leading-none">{barbearias.length}</div>
              </div>
            </div>
            
            <button 
              onClick={async () => {
                await logoutBarbearia();
                onBack();
              }}
              className="bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-sm flex items-center gap-2 hover:bg-gray-50 text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Sair</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              Barbearias Cadastradas
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar barbearia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
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
                  {filteredBarbearias.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{b.name}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{b.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <a href={`/${b.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                          /{b.slug}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize border border-blue-100">
                          {b.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {b.isOnboarded ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">Ativo</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">Pendente</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3 text-xs text-gray-600">
                          <span title="Profissionais">💈 {b.barbers?.length || 0}</span>
                          <span title="Serviços">✂️ {b.services?.length || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString('pt-BR') : 'Desconhecida'}
                      </td>
                    </tr>
                  ))}
                  {filteredBarbearias.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Nenhuma barbearia encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
