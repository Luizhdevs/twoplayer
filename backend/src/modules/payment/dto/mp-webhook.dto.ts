export interface MpWebhookBody {
  id:           number;
  live_mode:    boolean;
  type:         string;
  date_created: string;
  action:       string;
  data: {
    id: string;
  };
}
