import { usePlanoAtivo } from '../hooks/usePlanoAtivo';
import { Clock, AlertTriangle, Info } from 'lucide-react';

export function PlanoExpiracaoAviso() {
  const { planoAtivo, diasParaExpirar, isExpirandoEm3Dias, planoExpiraEm } = usePlanoAtivo();

  // Não mostrar aviso se plano não está ativo
  if (!planoAtivo || !diasParaExpirar || !planoExpiraEm) {
    return null;
  }

  // Não mostrar aviso se ainda faltam mais de 3 dias
  if (!isExpirandoEm3Dias) {
    return null;
  }

  const formatarDataExpiracao = (data: Date) => {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMensagemPersonalizada = () => {
    if (diasParaExpirar === 1) {
      return {
        titulo: 'Seu plano expira amanhã!',
        mensagem: `Seu plano expira em ${diasParaExpirar} dia (${formatarDataExpiracao(planoExpiraEm)}). Aguarde a expiração para realizar um novo pagamento e continuar usando todas as funcionalidades.`,
        cor: 'red'
      };
    } else if (diasParaExpirar === 2) {
      return {
        titulo: 'Seu plano expira em 2 dias',
        mensagem: `Seu plano expira em ${diasParaExpirar} dias (${formatarDataExpiracao(planoExpiraEm)}). Aguarde a expiração para realizar um novo pagamento e continuar usando todas as funcionalidades.`,
        cor: 'orange'
      };
    } else if (diasParaExpirar === 3) {
      return {
        titulo: 'Seu plano expira em 3 dias',
        mensagem: `Seu plano expira em ${diasParaExpirar} dias (${formatarDataExpiracao(planoExpiraEm)}). Aguarde a expiração para realizar um novo pagamento e continuar usando todas as funcionalidades.`,
        cor: 'yellow'
      };
    } else {
      return {
        titulo: 'Plano próximo da expiração',
        mensagem: `Seu plano expira em ${diasParaExpirar} dias (${formatarDataExpiracao(planoExpiraEm)}). Aguarde a expiração para realizar um novo pagamento.`,
        cor: 'yellow'
      };
    }
  };

  const { titulo, mensagem, cor } = getMensagemPersonalizada();

  const getColorClasses = () => {
    switch (cor) {
      case 'red':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          titulo: 'text-red-800',
          texto: 'text-red-700'
        };
      case 'orange':
        return {
          bg: 'bg-orange-50 border-orange-200',
          icon: 'text-orange-600',
          titulo: 'text-orange-800',
          texto: 'text-orange-700'
        };
      case 'yellow':
      default:
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          titulo: 'text-yellow-800',
          texto: 'text-yellow-700'
        };
    }
  };

  const classes = getColorClasses();
  const IconComponent = cor === 'red' ? AlertTriangle : cor === 'orange' ? Clock : Info;

  return (
    <div className={`${classes.bg} border rounded-lg p-4 mb-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${classes.icon}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${classes.titulo}`}>
            {titulo}
          </h3>
          <p className={`mt-1 text-sm ${classes.texto}`}>
            {mensagem}
          </p>
          <p className={`mt-2 text-xs ${classes.texto} opacity-80`}>
            💡 Lembre-se: você não pode renovar antes da expiração. Aguarde o vencimento para fazer um novo pagamento.
          </p>
        </div>
      </div>
    </div>
  );
}
