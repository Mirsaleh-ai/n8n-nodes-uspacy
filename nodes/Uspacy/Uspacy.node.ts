import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class Uspacy implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Uspacy',
    name: 'uspacy',
    icon: { light: 'file:uspacy.svg', dark: 'file:uspacy.dark.svg' },
    group: ['transform'],
    version: 2,
    subtitle: '={{$node.name}}',
    description: 'Work with Uspacy through an Incoming Webhook',
    defaults: {
      name: 'Uspacy',
    },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    usableAsTool: true,
    credentials: [
      {
        name: 'uspacyWebhookApi',
        required: true,
        testedBy: {
          request: {
            method: 'GET',
            url: '={{$credentials.webhookSecretUrl}}/crm/v1/entities/leads',
          },
        },
      },
    ],
    properties: [],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    throw new NodeOperationError(
      this.getNode(),
      'No Uspacy operations are available yet. This is the version 2 foundation.',
    );
  }
}
