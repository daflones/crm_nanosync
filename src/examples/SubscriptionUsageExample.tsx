import React from 'react';
import { SubscriptionGuard, ProtectedButton } from '../components/SubscriptionGuard';
import { SubscriptionAlert, SubscriptionStatusIndicator } from '../components/SubscriptionAlert';
import { useCheckLimit } from '../hooks/useSubscriptionStatus';
import { Plus, Edit, Trash2, Download } from 'lucide-react';

// Exemplo de como usar o sistema de assinaturas em suas páginas

export function ClientesPage() {
  // const subscription = useSubscriptionStatus();
  // const canCreate = useCanPerformAction('create');
  // const canDelete = useCanPerformAction('delete');
  const clientLimit = useCheckLimit('maxClients', 45); // 45 clientes atuais

  return (
    <div className="p-6">
      {/* Alert de status no topo da página */}
      <SubscriptionAlert />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <div className="flex items-center mt-2 space-x-4">
            <SubscriptionStatusIndicator />
            {!clientLimit.canAdd && (
              <span className="text-sm text-red-600">
                Limite de clientes atingido ({clientLimit.remaining} restantes)
              </span>
            )}
          </div>
        </div>

        {/* Botão protegido para criar cliente */}
        <ProtectedButton
          action="create"
          feature="cliente"
          onClick={() => {}}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </ProtectedButton>
      </div>

      {/* Lista de clientes com ações protegidas */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="font-medium">Lista de Clientes</h2>
            
            {/* Botão de exportar protegido */}
            <ProtectedButton
              action="export"
              onClick={() => {}}
              className="text-gray-600 hover:text-gray-900 flex items-center text-sm"
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </ProtectedButton>
          </div>
        </div>

        <div className="divide-y">
          {/* Exemplo de item da lista */}
          <div className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-medium">João Silva</h3>
              <p className="text-sm text-gray-600">joao@email.com</p>
            </div>
            
            <div className="flex space-x-2">
              {/* Botão de editar sempre permitido para planos ativos */}
              <ProtectedButton
                action="update"
                onClick={() => {}}
                className="text-blue-600 hover:text-blue-900 p-1"
              >
                <Edit className="h-4 w-4" />
              </ProtectedButton>

              {/* Botão de excluir protegido */}
              <ProtectedButton
                action="delete"
                feature="cliente"
                onClick={() => {}}
                className="text-red-600 hover:text-red-900 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </ProtectedButton>
            </div>
          </div>
        </div>
      </div>

      {/* Seção inteira protegida - só aparece se pode criar */}
      <SubscriptionGuard action="create" feature="relatórios avançados">
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Relatórios Avançados</h2>
          <p className="text-gray-600">
            Esta seção só é visível para usuários com planos ativos.
          </p>
          {/* Conteúdo dos relatórios */}
        </div>
      </SubscriptionGuard>

      {/* Exemplo de fallback customizado */}
      <SubscriptionGuard 
        action="export" 
        fallback={
          <div className="mt-6 bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Exportação Premium
            </h3>
            <p className="text-gray-600 mb-4">
              Exporte seus dados em diversos formatos com nossos planos pagos.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Ver Planos
            </button>
          </div>
        }
      >
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Exportação de Dados</h2>
          {/* Ferramentas de exportação */}
        </div>
      </SubscriptionGuard>
    </div>
  );
}

// Exemplo de uso em um modal ou formulário
export function ClienteFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // const canCreate = useCanPerformAction('create');

  // Não renderizar o modal se não pode criar
  // if (!canCreate) {
  //   return null;
  // }

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-lg font-medium mb-4">Novo Cliente</h2>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <input 
                type="text" 
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email" 
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              
              {/* Botão de salvar protegido */}
              <ProtectedButton
                action="create"
                onClick={() => {
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Salvar Cliente
              </ProtectedButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Exemplo de uso no layout principal
export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com indicador de status */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">NanoSync CRM</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <SubscriptionStatusIndicator />
              <button className="text-gray-500 hover:text-gray-700">
                Perfil
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
