# Correção do arquivo VendedoresPage.tsx

## Problema encontrado nas linhas 1179-1186:

```tsx
{selectedVendedor.segmentos_secundarios.map((segmentoNome, index) => (
  const segmento = segmentos.find(s => s.id === segmentoId)
  return (
    <span key={segmentoId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
      {segmento?.nome || segmentoId}
    </span>
  )
))}
```

## Correção necessária:

Substituir as linhas 1179-1186 por:

```tsx
{selectedVendedor.segmentos_secundarios.map((segmentoNome, index) => (
  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
    {segmentoNome}
  </span>
))}
```

## Explicação:

1. O `.map()` estava com sintaxe incorreta - tinha `const` e `return` dentro de um arrow function sem chaves
2. A variável `segmentoId` não existe - o parâmetro correto é `segmentoNome`
3. Como já estamos salvando os NOMES dos segmentos (não IDs) no banco de dados (linhas 365-372 e 480-487), basta exibir diretamente `segmentoNome`

## Instruções:

1. Abra o arquivo: `src/pages/vendedores/VendedoresPage.tsx`
2. Vá até a linha 1179
3. Selecione as linhas 1179 até 1186 (todo o bloco do .map())
4. Substitua pelo código corrigido acima
5. Salve o arquivo

O erro será corrigido e a página de vendedores voltará a funcionar normalmente.
