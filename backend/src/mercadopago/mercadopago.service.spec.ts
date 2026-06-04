import { MercadoPagoService } from './mercadopago.service';
import * as crypto from 'crypto';

describe('MercadoPagoService', () => {

  // ── mapStatus() ─────────────────────────────────────────────────────────

  describe('mapStatus()', () => {
    it.each([
      ['approved',     'APPROVED'],
      ['pending',      'PENDING'],
      ['in_process',   'PENDING'],
      ['authorized',   'PENDING'],
      ['rejected',     'REJECTED'],
      ['cancelled',    'CANCELLED'],
      ['refunded',     'REFUNDED'],
      ['charged_back', 'REFUNDED'],
      ['unknown_xyz',  'PENDING'],
    ])('"%s" → %s', (mpStatus, expected) => {
      expect(MercadoPagoService.mapStatus(mpStatus)).toBe(expected);
    });
  });

  // ── validateWebhookSignature() ───────────────────────────────────────────

  describe('validateWebhookSignature()', () => {
    const SECRET = 'test-webhook-secret';
    const DATA_ID = '123456';
    const REQUEST_ID = 'abc-req-123';
    const TS = '1704908175';

    function computeSignature(dataId: string, requestId: string, ts: string): string {
      const template = `id:${dataId};request-id:${requestId};ts:${ts};`;
      return crypto.createHmac('sha256', SECRET).update(template).digest('hex');
    }

    let service: MercadoPagoService;

    beforeEach(() => {
      service = new MercadoPagoService();
      process.env.MP_WEBHOOK_SECRET = SECRET;
      process.env.MP_ACCESS_TOKEN   = 'test-token';
      process.env.MP_SANDBOX        = 'true';
      (service as any).webhookSecret = SECRET;
    });

    it('deve retornar true para assinatura válida', () => {
      const hash = computeSignature(DATA_ID, REQUEST_ID, TS);
      const xSignature = `ts=${TS},v1=${hash}`;
      expect(service.validateWebhookSignature(xSignature, REQUEST_ID, DATA_ID)).toBe(true);
    });

    it('deve retornar false para assinatura incorreta', () => {
      const xSignature = `ts=${TS},v1=wrong-hash`;
      expect(service.validateWebhookSignature(xSignature, REQUEST_ID, DATA_ID)).toBe(false);
    });

    it('deve retornar false para header malformado', () => {
      expect(service.validateWebhookSignature('malformed', REQUEST_ID, DATA_ID)).toBe(false);
    });

    it('deve retornar false para ts ausente', () => {
      const hash = computeSignature(DATA_ID, REQUEST_ID, TS);
      expect(service.validateWebhookSignature(`v1=${hash}`, REQUEST_ID, DATA_ID)).toBe(false);
    });

    it('deve retornar false para v1 ausente', () => {
      expect(service.validateWebhookSignature(`ts=${TS}`, REQUEST_ID, DATA_ID)).toBe(false);
    });

    it('deve retornar true (permissivo) quando MP_WEBHOOK_SECRET não configurado', () => {
      (service as any).webhookSecret = '';
      expect(service.validateWebhookSignature('anything', REQUEST_ID, DATA_ID)).toBe(true);
    });
  });
});
