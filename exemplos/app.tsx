import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthProvider';
import { Routes } from '@/routes';
import { useAuth } from '@/hooks/useAuth';

// Componente de Loading
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        textAlign: 'center'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid #e0e0e0',
          borderTop: '3px solid #333',
          borderRadius: '50%',
          margin: '0 auto 20px',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#666' }}>Carregando...</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Componente que renderiza as rotas apenas após o carregamento
function AppContent() {
  const { isLoading } = useAuth();
  const [showTimeout, setShowTimeout] = React.useState(false);

  // Timeout para evitar loading infinito
  React.useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowTimeout(true);
      }, 5000); // 5 segundos

      return () => clearTimeout(timer);
    } else {
      setShowTimeout(false);
    }
  }, [isLoading]);

  if (isLoading && !showTimeout) {
    return <LoadingScreen />;
  }

  if (showTimeout) {
    console.error('[App] Timeout no carregamento inicial');
    // Força recarregamento da página uma vez
    if (!sessionStorage.getItem('auth_reload_attempted')) {
      sessionStorage.setItem('auth_reload_attempted', 'true');
      window.location.reload();
    }
  }

  return <Routes />;
}

// Componente principal da aplicação
export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;