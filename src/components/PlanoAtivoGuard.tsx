import React from 'react';
import { toast } from 'sonner';
import { usePlanoAtivo } from '../hooks/usePlanoAtivo';
import { Lock, CreditCard } from 'lucide-react';

interface PlanoAtivoGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeMessage?: boolean;
}

export function PlanoAtivoGuard({ 
  children, 
  fallback, 
  showUpgradeMessage = true 
}: PlanoAtivoGuardProps) {
  const { planoAtivo, isLoading } = usePlanoAtivo();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Verificando plano...</span>
      </div>
    );
  }

  if (!planoAtivo) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradeMessage) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-100 rounded-full p-3">
              <Lock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Plano Necessário
          </h3>
          <p className="text-yellow-700 mb-4">
            Esta funcionalidade está disponível apenas para usuários com plano ativo.
          </p>
          <button
            onClick={() => window.location.href = '/planos'}
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Ativar Plano
          </button>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

// Componente para desabilitar botões quando plano não está ativo
interface PlanoAtivoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const PlanoAtivoButton = React.forwardRef<HTMLButtonElement, PlanoAtivoButtonProps>(function PlanoAtivoButton(
  { 
    children,
    className = '',
    disabled = false,
    variant = 'primary',
    size = 'md',
    onClick,
    ...rest
  },
  ref
) {
  const { planoAtivo } = usePlanoAtivo();

  // Se o plano está ativo, renderizar botão normal
  if (planoAtivo) {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    const buttonClasses = `
      ${baseClasses}
      ${disabled ? 'opacity-50 cursor-not-allowed' : variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `.trim();

    return (
      <button
        ref={ref}
        className={buttonClasses}
        onClick={onClick}
        disabled={disabled}
        {...rest}
      >
        {children}
      </button>
    );
  }

  // Se o plano não está ativo, renderizar botão desabilitado
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  const disabledClasses = 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500 hover:bg-gray-300';

  const buttonClasses = `
    ${baseClasses}
    ${disabledClasses}
    ${sizeClasses[size]}
    ${className}
  `.trim();

  const handleClick = () => {
    // Mostrar toast ou modal informando sobre o plano
    toast.error('Esta funcionalidade requer um plano ativo. Clique em "Planos" para ativar.');
  };

  return (
    <button
      ref={ref}
      className={buttonClasses}
      onClick={handleClick}
      disabled={true}
      title="Plano ativo necessário"
      {...rest}
    >
      <Lock className="h-4 w-4 mr-1" />
      {children}
    </button>
  );
});

// Hook para verificar se uma ação pode ser executada
export function usePlanoAtivoAction() {
  const { planoAtivo } = usePlanoAtivo();

  const executeAction = (action: () => void, showAlert = true) => {
    if (!planoAtivo) {
      if (showAlert) {
        toast.error('Esta funcionalidade requer um plano ativo. Acesse a página "Planos" para ativar seu plano.');
      }
      return false;
    }
    action();
    return true;
  };

  return { executeAction, planoAtivo };
}
