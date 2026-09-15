import type {
  ICredentialTestRequest,
  ICredentialType,
  Icon,
  INodeProperties,
} from 'n8n-workflow';

export class UspacyWebhookApi implements ICredentialType {
  name = 'uspacyWebhookApi';

  displayName = 'Uspacy Incoming Webhook API';

  icon: Icon = {
    light: 'file:../nodes/Uspacy/uspacy.svg',
    dark: 'file:../nodes/Uspacy/uspacy.dark.svg',
  };

  documentationUrl = 'https://uspacy.readme.io/reference/introduction';

  properties: INodeProperties[] = [
    {
      displayName: 'Webhook URL',
      name: 'webhookSecretUrl',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      placeholder:
        'https://your-company.uspacy.ua/company/v1/incoming_webhooks/run/your-webhook-key',
      description:
        'Paste the full Uspacy Incoming Webhook URL. This value is secret and must not be shared.',
    },
  ];

  test: ICredentialTestRequest = {
    request: {
      method: 'GET',
      url: '={{$credentials.webhookSecretUrl}}/crm/v1/entities/leads',
    },
  };
}
