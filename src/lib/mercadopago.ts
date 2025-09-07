import crypto from 'crypto';

// Configurações do Mercado Pago
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MERCADOPAGO_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;

export interface CreatePaymentRequest {
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  payer: {
    email: string;
    first_name: string;
    last_name: string;
    identification: {
      type: string;
      number: string;
    };
  };
  // Campos específicos para cartão
  token?: string;
  installments?: number;
  issuer_id?: string;
  // Metadados do sistema
  plan_id: string;
  user_id: string;
}

export interface MercadoPagoPaymentResponse {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  date_created: string;
  date_approved?: string;
  date_of_expiration?: string;
  point_of_interaction?: {
    transaction_data: {
      qr_code: string;
      qr_code_base64: string;
      ticket_url: string;
    };
  };
  card?: {
    first_six_digits: string;
    last_four_digits: string;
    expiration_month: number;
    expiration_year: number;
  };
  payer: {
    id: string;
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
  installments?: number;
}

export class MercadoPagoService {
  private baseURL = 'https://api.mercadopago.com';

  async createPayment(paymentData: CreatePaymentRequest): Promise<MercadoPagoPaymentResponse> {
    const headers = {
      'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `${paymentData.user_id}-${Date.now()}`
    };

    // Preparar dados para o Mercado Pago
    const mpPayload = {
      transaction_amount: paymentData.transaction_amount,
      description: paymentData.description,
      payment_method_id: paymentData.payment_method_id,
      payer: paymentData.payer,
      external_reference: `CLIENTE${Math.floor(Math.random() * 10000) + 1}`,
      notification_url: 'https://crm.nanosync.com.br/webhook/crm',
      metadata: {
        plan_id: paymentData.plan_id,
        user_id: paymentData.user_id,
        system: 'nanosync-crm'
      }
    };

    // Adicionar campos específicos do cartão se fornecidos
    if (paymentData.token) {
      Object.assign(mpPayload, {
        token: paymentData.token,
        installments: paymentData.installments || 1,
        issuer_id: paymentData.issuer_id
      });
    }

    const response = await fetch(`${this.baseURL}/v1/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(mpPayload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erro no Mercado Pago: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  async getPayment(paymentId: string): Promise<MercadoPagoPaymentResponse> {
    const headers = {
      'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(`${this.baseURL}/v1/payments/${paymentId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erro ao buscar pagamento: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  validateWebhookSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string,
    _timestamp: string
  ): boolean {
    if (!MERCADOPAGO_WEBHOOK_SECRET) {
      console.error('MERCADOPAGO_WEBHOOK_SECRET não configurado');
      return false;
    }

    try {
      // Extrair ts e v1 do header x-signature
      const parts = xSignature.split(',');
      let ts = '';
      let v1 = '';

      for (const part of parts) {
        const [key, value] = part.split('=');
        if (key.trim() === 'ts') ts = value;
        if (key.trim() === 'v1') v1 = value;
      }

      if (!ts || !v1) {
        console.error('Formato de assinatura inválido');
        return false;
      }

      // Criar string para validação conforme documentação MP
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      
      // Calcular HMAC
      const hmac = crypto
        .createHmac('sha256', MERCADOPAGO_WEBHOOK_SECRET)
        .update(manifest)
        .digest('hex');

      // Comparar assinaturas
      return hmac === v1;
    } catch (error) {
      console.error('Erro ao validar assinatura webhook:', error);
      return false;
    }
  }

  mapStatusToSubscription(status: string, _statusDetail: string): {
    subscriptionStatus: 'active' | 'inactive' | 'expired' | 'cancelled' | 'pending';
    isActive: boolean;
  } {
    switch (status) {
      case 'approved':
      case 'accredited':
        return { subscriptionStatus: 'active', isActive: true };
      
      case 'pending':
        return { subscriptionStatus: 'pending', isActive: false };
      
      case 'rejected':
      case 'cancelled':
        return { subscriptionStatus: 'cancelled', isActive: false };
      
      default:
        return { subscriptionStatus: 'inactive', isActive: false };
    }
  }
}

export const mercadoPagoService = new MercadoPagoService();
