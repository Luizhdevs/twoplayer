import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  IMercadoPagoService,
  MpPaymentData,
  MpPreferenceInput,
  MpPreferenceOutput,
} from './mercadopago.interface';

// Importado dinamicamente para evitar erros em ambiente de teste
type MpConfig      = InstanceType<typeof import('mercadopago').MercadoPagoConfig>;
type PreferenceApi = InstanceType<typeof import('mercadopago').Preference>;
type PaymentApi    = InstanceType<typeof import('mercadopago').Payment>;

@Injectable()
export class MercadoPagoService implements IMercadoPagoService, OnModuleInit {
  private readonly logger = new Logger(MercadoPagoService.name);

  private config:      MpConfig;
  private preference:  PreferenceApi;
  private paymentApi:  PaymentApi;
  private webhookSecret: string;
  private isSandbox: boolean;

  async onModuleInit() {
    const { MercadoPagoConfig, Preference, Payment } = await import('mercadopago');

    this.webhookSecret = process.env.MP_WEBHOOK_SECRET ?? '';
    this.isSandbox     = process.env.MP_SANDBOX === 'true';

    this.config = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN ?? '',
      options: { timeout: 5000 },
    });

    this.preference  = new Preference(this.config);
    this.paymentApi  = new Payment(this.config);

    this.logger.log(`MercadoPago inicializado [sandbox=${this.isSandbox}]`);
  }

  // ── Criar preferência (checkout) ─────────────────────────────────────────

  async createPreference(input: MpPreferenceInput): Promise<MpPreferenceOutput> {
    const response = await this.preference.create({
      body: {
        items: [
          {
            id:          input.appointmentId,
            title:       input.title,
            quantity:    input.quantity,
            unit_price:  input.unitPrice,
            currency_id: 'BRL',
          },
        ],
        payer: input.payerEmail ? { email: input.payerEmail } : undefined,
        external_reference: input.appointmentId,
        notification_url:   process.env.MP_WEBHOOK_URL,
        back_urls: {
          success: process.env.MP_SUCCESS_URL,
          failure: process.env.MP_FAILURE_URL,
          pending: process.env.MP_PENDING_URL,
        },
        auto_return: 'approved',
        statement_descriptor: 'TwoPlayers',
      },
    });

    return {
      preferenceId:     response.id!,
      initPoint:        response.init_point!,
      sandboxInitPoint: response.sandbox_init_point!,
    };
  }

  // ── Buscar pagamento na API MP (não confiar no webhook payload) ──────────

  async getPayment(mpPaymentId: string): Promise<MpPaymentData> {
    const data = await this.paymentApi.get({ id: Number(mpPaymentId) });
    return {
      id:                  data.id!,
      status:              data.status!,
      statusDetail:        data.status_detail!,
      externalReference:   data.external_reference!,
      paymentMethodId:     data.payment_method_id!,
      paymentTypeId:       data.payment_type_id!,
      transactionAmount:   data.transaction_amount!,
      dateApproved:        data.date_approved ?? null,
      payer:               { email: (data.payer as any)?.email },
    };
  }

  // ── Validar assinatura HMAC-SHA256 do webhook ────────────────────────────
  //
  // Formato do header x-signature: "ts=TIMESTAMP,v1=HMAC_HEX"
  // Template: "id:{data.id};request-id:{x-request-id};ts:{ts};"

  validateWebhookSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string,
  ): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('MP_WEBHOOK_SECRET não configurado — assinatura ignorada');
      return true; // permissivo em dev; bloquear em prod
    }

    try {
      const parts   = xSignature.split(',');
      const ts      = parts.find((p) => p.startsWith('ts='))?.split('=')[1];
      const v1      = parts.find((p) => p.startsWith('v1='))?.split('=')[1];
      if (!ts || !v1) return false;

      const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const computed = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(template)
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(v1));
    } catch {
      return false;
    }
  }

  // ── Utilitário: mapeamento status MP → PaymentStatus interno ─────────────

  static mapStatus(mpStatus: string): 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | 'CANCELLED' {
    const map: Record<string, 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | 'CANCELLED'> = {
      pending:      'PENDING',
      in_process:   'PENDING',
      authorized:   'PENDING',
      approved:     'APPROVED',
      rejected:     'REJECTED',
      cancelled:    'CANCELLED',
      refunded:     'REFUNDED',
      charged_back: 'REFUNDED',
    };
    return map[mpStatus] ?? 'PENDING';
  }

  get checkoutUrl(): 'initPoint' | 'sandboxInitPoint' {
    return this.isSandbox ? 'sandboxInitPoint' : 'initPoint';
  }
}
