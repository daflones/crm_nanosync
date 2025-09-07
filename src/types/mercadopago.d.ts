declare global {
  interface Window {
    MercadoPago: typeof MercadoPago;
    mp: MercadoPago;
  }
}

declare class MercadoPago {
  constructor(publicKey: string, options?: MercadoPagoOptions);
  
  cardForm(options: CardFormOptions): CardForm;
  checkout(options: CheckoutOptions): Checkout;
  bricks(): Bricks;
}

interface MercadoPagoOptions {
  locale?: 'pt-BR' | 'es-AR' | 'en-US';
  advancedFraudPrevention?: boolean;
}

interface CardFormOptions {
  amount: string;
  iframe?: boolean;
  form: {
    id: string;
    cardNumber?: { id: string; placeholder?: string };
    expirationDate?: { id: string; placeholder?: string };
    securityCode?: { id: string; placeholder?: string };
    cardholderName?: { id: string; placeholder?: string };
    issuer?: { id: string; placeholder?: string };
    installments?: { id: string; placeholder?: string };
    identificationType?: { id: string; placeholder?: string };
    identificationNumber?: { id: string; placeholder?: string };
    cardholderEmail?: { id: string; placeholder?: string };
  };
  callbacks: {
    onFormMounted?: (error?: any) => void;
    onSubmit?: (event: any) => void;
    onFetching?: (resource: string) => void;
    onCardTokenReceived?: (error: any, token: string) => void;
    onInstallmentsReceived?: (error: any, installments: Installment[]) => void;
    onPaymentMethodsReceived?: (error: any, paymentMethods: PaymentMethod[]) => void;
  };
}

interface CardForm {
  mount(): void;
  unmount(): void;
  getCardFormData(): CardFormData;
}

interface CardFormData {
  token: string;
  paymentMethodId: string;
  issuerId: string;
  cardholderEmail: string;
  amount: string;
  installments: string;
  identificationType: string;
  identificationNumber: string;
}

interface CheckoutOptions {
  preference: {
    id: string;
  };
  render: {
    container: string;
    label: string;
  };
}

interface Checkout {
  open(): void;
  close(): void;
}

interface Bricks {
  create(type: string, containerId: string, options: any): any;
}

interface Installment {
  installments: number;
  installment_rate: number;
  discount_rate: number;
  reimbursement_rate: number;
  labels: string[];
  installment_rate_collector: string[];
  min_allowed_amount: number;
  max_allowed_amount: number;
  recommended_message: string;
  installment_amount: number;
  total_amount: number;
  payment_method_option_id: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  payment_type_id: string;
  status: string;
  secure_thumbnail: string;
  thumbnail: string;
  deferred_capture: string;
  settings: PaymentMethodSettings[];
  additional_info_needed: string[];
  min_allowed_amount: number;
  max_allowed_amount: number;
  accreditation_time: number;
  financial_institutions: any[];
  processing_modes: string[];
}

interface PaymentMethodSettings {
  card_number: {
    validation: string;
    length: number;
  };
  bin: {
    pattern: string;
    installments_pattern: string;
    exclusion_pattern: string;
  };
  security_code: {
    length: number;
    card_location: string;
    mode: string;
  };
}

// Tipos para as respostas da API
interface PIXPaymentResponse {
  id: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  status_detail: string;
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  date_created: string;
  date_approved?: string;
  date_of_expiration: string;
  point_of_interaction: {
    transaction_data: {
      qr_code: string;
      qr_code_base64: string;
      ticket_url: string;
    };
  };
  payer: {
    id: string;
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

interface CardPaymentResponse {
  id: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  status_detail: string;
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  installments: number;
  date_created: string;
  date_approved?: string;
  card: {
    first_six_digits: string;
    last_four_digits: string;
    expiration_month: number;
    expiration_year: number;
    cardholder: {
      name: string;
      identification: {
        type: string;
        number: string;
      };
    };
  };
  payer: {
    id: string;
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

interface WebhookNotification {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: 'payment' | 'subscription_authorized_payment' | 'subscription_preapproval';
  user_id: string;
}

export {
  MercadoPago,
  CardForm,
  CardFormData,
  PIXPaymentResponse,
  CardPaymentResponse,
  WebhookNotification,
  PaymentMethod,
  Installment
};
