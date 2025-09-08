// Utilitários para cartão de crédito

// Detectar bandeira do cartão
export const detectCardBrand = (cardNumber: string): string => {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (/^4/.test(cleanNumber)) return 'visa';
  if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
  if (/^3[47]/.test(cleanNumber)) return 'amex';
  if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';
  if (/^(?:2131|1800|35\d{3})\d{11}$/.test(cleanNumber)) return 'jcb';
  if (/^3(?:0[0-5]|[68])/.test(cleanNumber)) return 'diners';
  if (/^(?:4026|417500|4508|4844|491(?:3|7))/.test(cleanNumber)) return 'visa-electron';
  
  return 'unknown';
};

// Máscara para número do cartão
export const formatCardNumber = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  const brand = detectCardBrand(cleanValue);
  
  // American Express: XXXX XXXXXX XXXXX
  if (brand === 'amex') {
    return cleanValue
      .substring(0, 15)
      .replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3')
      .trim();
  }
  
  // Outros cartões: XXXX XXXX XXXX XXXX
  return cleanValue
    .substring(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();
};

// Máscara para validade MM/AA
export const formatExpiry = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length >= 2) {
    return cleanValue.substring(0, 4).replace(/(\d{2})(\d{2})/, '$1/$2');
  }
  
  return cleanValue;
};

// Validar validade
export const isValidExpiry = (value: string): boolean => {
  const match = value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  
  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10) + 2000;
  
  if (month < 1 || month > 12) return false;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  
  return true;
};

// Máscara para CVV
export const formatCVV = (value: string, cardBrand: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  
  // American Express tem 4 dígitos
  if (cardBrand === 'amex') {
    return cleanValue.substring(0, 4);
  }
  
  // Outros cartões têm 3 dígitos
  return cleanValue.substring(0, 3);
};

// Máscara para CPF
export const formatCPF = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  
  return cleanValue
    .substring(0, 11)
    .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    .replace(/(\d{3})(\d{3})(\d{3})(\d{1})$/, '$1.$2.$3-$4')
    .replace(/(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3')
    .replace(/(\d{3})(\d{2})$/, '$1.$2')
    .replace(/(\d{3})(\d{1})$/, '$1.$2');
};

// Validar CPF
export const isValidCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validar dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;
  
  return (
    parseInt(cleanCPF.charAt(9)) === digit1 &&
    parseInt(cleanCPF.charAt(10)) === digit2
  );
};

// Obter ícone da bandeira
export const getCardBrandIcon = (brand: string): string => {
  const icons: { [key: string]: string } = {
    visa: '💳',
    mastercard: '💳',
    amex: '💳',
    discover: '💳',
    jcb: '💳',
    diners: '💳',
    unknown: '💳'
  };
  
  return icons[brand] || icons.unknown;
};

// Obter nome da bandeira
export const getCardBrandName = (brand: string): string => {
  const names: { [key: string]: string } = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    jcb: 'JCB',
    diners: 'Diners Club',
    unknown: 'Cartão'
  };
  
  return names[brand] || names.unknown;
};
