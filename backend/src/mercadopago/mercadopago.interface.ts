export interface MpPreferenceInput {
  title: string;
  quantity: number;
  unitPrice: number;
  appointmentId: string;
  payerEmail?: string;
}

export interface MpPreferenceOutput {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

export interface MpPaymentData {
  id: number;
  status: string;
  statusDetail: string;
  externalReference: string;
  paymentMethodId: string;
  paymentTypeId: string;
  transactionAmount: number;
  dateApproved: string | null;
  payer: { email?: string };
}

export const MP_SERVICE = 'MP_SERVICE';

export interface IMercadoPagoService {
  createPreference(input: MpPreferenceInput): Promise<MpPreferenceOutput>;
  getPayment(mpPaymentId: string): Promise<MpPaymentData>;
  validateWebhookSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string,
  ): boolean;
}
