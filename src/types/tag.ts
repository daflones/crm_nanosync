export interface Tag {
  id: string
  profile_id: string
  nome: string
  cor: string
  ativo: boolean
  ordem: number
  created_at?: string
  updated_at?: string
}

export interface TagCreateData {
  nome: string
  cor: string
  ativo?: boolean
  ordem?: number
}

export interface TagUpdateData {
  nome?: string
  cor?: string
  ativo?: boolean
  ordem?: number
}

// Cores pré-definidas disponíveis para tags
export const CORES_DISPONIVEIS = [
  { 
    nome: 'Azul', 
    valor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    hover: 'hover:bg-blue-200 dark:hover:bg-blue-800'
  },
  { 
    nome: 'Verde', 
    valor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    hover: 'hover:bg-green-200 dark:hover:bg-green-800'
  },
  { 
    nome: 'Roxo', 
    valor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    hover: 'hover:bg-purple-200 dark:hover:bg-purple-800'
  },
  { 
    nome: 'Laranja', 
    valor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    hover: 'hover:bg-orange-200 dark:hover:bg-orange-800'
  },
  { 
    nome: 'Rosa', 
    valor: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    hover: 'hover:bg-pink-200 dark:hover:bg-pink-800'
  },
  { 
    nome: 'Vermelho', 
    valor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    hover: 'hover:bg-red-200 dark:hover:bg-red-800'
  },
  { 
    nome: 'Amarelo', 
    valor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    hover: 'hover:bg-yellow-200 dark:hover:bg-yellow-800'
  },
  { 
    nome: 'Indigo', 
    valor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    hover: 'hover:bg-indigo-200 dark:hover:bg-indigo-800'
  },
  { 
    nome: 'Teal', 
    valor: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    hover: 'hover:bg-teal-200 dark:hover:bg-teal-800'
  },
  { 
    nome: 'Cinza', 
    valor: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    hover: 'hover:bg-gray-200 dark:hover:bg-gray-800'
  },
]

// Mapa de cores com hover para uso rápido
export const TAG_COLORS_WITH_HOVER: Record<string, string> = {
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': 'hover:bg-blue-200 dark:hover:bg-blue-800',
  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': 'hover:bg-green-200 dark:hover:bg-green-800',
  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200': 'hover:bg-purple-200 dark:hover:bg-purple-800',
  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200': 'hover:bg-orange-200 dark:hover:bg-orange-800',
  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200': 'hover:bg-pink-200 dark:hover:bg-pink-800',
  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': 'hover:bg-red-200 dark:hover:bg-red-800',
  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': 'hover:bg-yellow-200 dark:hover:bg-yellow-800',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200': 'hover:bg-indigo-200 dark:hover:bg-indigo-800',
  'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200': 'hover:bg-teal-200 dark:hover:bg-teal-800',
  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200': 'hover:bg-gray-200 dark:hover:bg-gray-800',
}
