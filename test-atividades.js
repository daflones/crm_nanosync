// Teste básico do sistema de atividades
// Execute este arquivo no console do navegador para testar o sistema

console.log('🚀 Testando sistema de atividades...')

// Teste 1: Verificar se o serviço está disponível
try {
  const { AtividadeService } = await import('./src/services/api/atividades.ts')
  console.log('✅ AtividadeService carregado com sucesso')
  
  // Teste 2: Buscar atividades existentes
  const atividades = await AtividadeService.buscarAtividades()
  console.log(`✅ Encontradas ${atividades.length} atividades no sistema`)
  
  // Teste 3: Mostrar as últimas 5 atividades
  if (atividades.length > 0) {
    console.log('📋 Últimas 5 atividades:')
    atividades.slice(0, 5).forEach((atividade, index) => {
      console.log(`${index + 1}. [${atividade.acao}] ${atividade.entidade_tipo} - ${atividade.descricao}`)
      console.log(`   Data: ${new Date(atividade.created_at).toLocaleString()}`)
      console.log(`   Usuário: ${atividade.usuario_id || 'Sistema'}`)
    })
  }
  
  console.log('🎉 Sistema de atividades funcionando corretamente!')
  
} catch (error) {
  console.error('❌ Erro ao testar sistema de atividades:', error)
}

// Instruções para testar manualmente:
console.log(`
📝 Para testar manualmente:
1. Faça login no sistema
2. Crie um novo cliente
3. Edite um produto
4. Faça upload de um arquivo
5. Envie uma proposta
6. Verifique o dashboard de atividades

Todas essas ações devem gerar registros de atividade automaticamente.
`)
