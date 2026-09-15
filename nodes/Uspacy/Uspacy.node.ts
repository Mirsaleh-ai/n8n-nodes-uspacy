import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

type LeadOperation =
	| 'getAll'
	| 'get'
	| 'create'
	| 'update'
	| 'delete'
	| 'copy'
	| 'moveStage'
	| 'getFields';

const leadBasePath = 'crm/v1/entities/leads';

export class Uspacy implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Uspacy',
		name: 'uspacy',
		icon: { light: 'file:uspacy.svg', dark: 'file:uspacy.dark.svg' },
		group: ['transform'],
		version: 2,
		subtitle: '={{$parameter["operation"]}}',
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
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [{ name: 'Lead', value: 'lead' }],
				default: 'lead',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Copy', value: 'copy', action: 'Copy a lead' },
					{ name: 'Create', value: 'create', action: 'Create a lead' },
					{ name: 'Delete', value: 'delete', action: 'Delete a lead' },
					{ name: 'Get', value: 'get', action: 'Get a lead' },
					{ name: 'Get Field Definitions', value: 'getFields', action: 'Get lead field definitions' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many leads' },
					{ name: 'Move to Stage', value: 'moveStage', action: 'Move a lead to a stage' },
					{ name: 'Update', value: 'update', action: 'Update a lead' },
				],
				default: 'getAll',
			},
			{
				displayName: 'Lead ID',
				name: 'leadId',
				type: 'number',
				required: true,
				default: 0,
				description: 'The ID of the lead',
				displayOptions: {
					show: {
						resource: ['lead'],
						operation: ['get', 'update', 'delete', 'copy', 'moveStage'],
					},
				},
			},
			{
				displayName: 'Data',
				name: 'leadData',
				type: 'json',
				required: true,
				default: '{}',
				description:
					'Lead data in JSON. For example: {"title":"Website enquiry","owner":1,"funnel_id":5}.',
				displayOptions: {
					show: {
						resource: ['lead'],
						operation: ['create', 'update'],
					},
				},
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: {
						resource: ['lead'],
						operation: ['getAll'],
					},
				},
				options: [
					{
						displayName: 'Created From',
						name: 'createdAtFrom',
						type: 'dateTime',
						default: '',
						description: 'Return leads created from this date and time',
					},
					{
						displayName: 'Created To',
						name: 'createdAtTo',
						type: 'dateTime',
						default: '',
						description: 'Return leads created until this date and time',
					},
					{
						displayName: 'Funnel IDs',
						name: 'funnelIds',
						type: 'string',
						default: '',
						placeholder: '5, 12',
						description: 'A comma-separated list of funnel IDs',
					},
					{
						displayName: 'Items Per Page',
						name: 'list',
						type: 'number',
						default: 20,
						typeOptions: { minValue: 1, maxValue: 100 },
						description: 'The number of leads to return (maximum 100)',
					},
					{
						displayName: 'Kanban Statuses',
						name: 'kanbanStatuses',
						type: 'string',
						default: '',
						placeholder: 'IN_WORK, SUCCESS',
						description: 'A comma-separated list: IN_WORK, SUCCESS, or FAIL',
					},
					{
						displayName: 'Owner IDs',
						name: 'ownerIds',
						type: 'string',
						default: '',
						placeholder: '1, 8',
						description: 'A comma-separated list of responsible user IDs',
					},
					{
						displayName: 'Page',
						name: 'page',
						type: 'number',
						default: 1,
						typeOptions: { minValue: 1 },
						description: 'The page to return',
					},
					{
						displayName: 'Sort Direction',
						name: 'sortDirection',
						type: 'options',
						options: [
							{ name: 'Descending', value: 'desc' },
							{ name: 'Ascending', value: 'asc' },
						],
						default: 'desc',
					},
					{
						displayName: 'Sort Field',
						name: 'sortField',
						type: 'string',
						default: 'created_at',
						description: 'The lead field used for sorting',
					},
					{
						displayName: 'Source',
						name: 'source',
						type: 'string',
						default: '',
						description: 'Return leads from this source',
					},
					{
						displayName: 'Stage IDs',
						name: 'stageIds',
						type: 'string',
						default: '',
						placeholder: '22, 31',
						description: 'A comma-separated list of kanban stage IDs',
					},
				],
			},
			{
				displayName: 'Stage ID',
				name: 'stageId',
				type: 'number',
				required: true,
				default: 0,
				description: 'The ID of the destination kanban stage',
				displayOptions: {
					show: {
						resource: ['lead'],
						operation: ['moveStage'],
					},
				},
			},
			{
				displayName: 'Options',
				name: 'moveStageOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['lead'],
						operation: ['moveStage'],
					},
				},
				options: [
					{
						displayName: 'Kanban Status',
						name: 'kanban_status',
						type: 'options',
						options: [
							{ name: 'In Work', value: 'IN_WORK' },
							{ name: 'Success', value: 'SUCCESS' },
							{ name: 'Fail', value: 'FAIL' },
						],
						default: 'IN_WORK',
						description: 'Set this when moving to a system stage',
					},
					{
						displayName: 'Kanban Reason ID',
						name: 'kanban_reason_id',
						type: 'number',
						default: 0,
						description: 'The close reason ID, for SUCCESS or FAIL stages',
					},
				],
			},
			{
				displayName: 'Copy Options',
				name: 'copyOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['lead'],
						operation: ['copy'],
					},
				},
				options: [
					{
						displayName: 'Owner ID',
						name: 'owner',
						type: 'number',
						default: 0,
						description: 'Use a different responsible user for the copy',
					},
					{
						displayName: 'Funnel ID',
						name: 'funnel_id',
						type: 'number',
						default: 0,
						description: 'Use a different funnel for the copy',
					},
					{
						displayName: 'Stage ID',
						name: 'kanban_stage_id',
						type: 'number',
						default: 0,
						description: 'Use a different kanban stage for the copy',
					},
					{
						displayName: 'Source',
						name: 'source',
						type: 'string',
						default: '',
						description: 'Use a different source for the copy',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const inputItems = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < inputItems.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as LeadOperation;
				const response = await executeLeadOperation.call(this, operation, itemIndex);
				const executionData = this.helpers.returnJsonArray(normalizeResponse(response));

				returnData.push(
					...this.helpers.constructExecutionMetaData(executionData, {
						itemData: { item: itemIndex },
					}),
				);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: inputItems[itemIndex].json,
						error: new NodeApiError(this.getNode(), error, { itemIndex }),
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				throw new NodeApiError(this.getNode(), error, { itemIndex });
			}
		}

		return [returnData];
	}
}

async function executeLeadOperation(
	this: IExecuteFunctions,
	operation: LeadOperation,
	itemIndex: number,
): Promise<unknown> {
	switch (operation) {
		case 'getAll': {
			const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;
			return await uspacyWebhookRequest.call(this, 'GET', leadBasePath, itemIndex, {
				qs: buildListQuery(filters),
			});
		}
		case 'get': {
			const leadId = getLeadId.call(this, itemIndex);
			return await uspacyWebhookRequest.call(this, 'GET', `${leadBasePath}/${leadId}`, itemIndex);
		}
		case 'create': {
			return await uspacyWebhookRequest.call(this, 'POST', leadBasePath, itemIndex, {
				body: getDataObject.call(this, itemIndex),
			});
		}
		case 'update': {
			const leadId = getLeadId.call(this, itemIndex);
			return await uspacyWebhookRequest.call(this, 'PATCH', `${leadBasePath}/${leadId}`, itemIndex, {
				body: getDataObject.call(this, itemIndex),
			});
		}
		case 'delete': {
			const leadId = getLeadId.call(this, itemIndex);
			return await uspacyWebhookRequest.call(this, 'DELETE', `${leadBasePath}/${leadId}`, itemIndex);
		}
		case 'copy': {
			const leadId = getLeadId.call(this, itemIndex);
			const sourceLead = await uspacyWebhookRequest.call(
				this,
				'GET',
				`${leadBasePath}/${leadId}`,
				itemIndex,
			);

			return await uspacyWebhookRequest.call(this, 'POST', leadBasePath, itemIndex, {
				body: buildCopyBody(
					this,
					sourceLead,
					this.getNodeParameter('copyOptions', itemIndex, {}) as IDataObject,
				),
			});
		}
		case 'moveStage': {
			const leadId = getLeadId.call(this, itemIndex);
			const stageId = getRequiredPositiveNumber.call(this, 'stageId', itemIndex, 'Stage ID');
			const options = this.getNodeParameter('moveStageOptions', itemIndex, {}) as IDataObject;
			const body: IDataObject = {};

			if (options.kanban_status) body.kanban_status = options.kanban_status;
			if (isPositiveNumber(options.kanban_reason_id)) body.kanban_reason_id = options.kanban_reason_id;

			return await uspacyWebhookRequest.call(
				this,
				'POST',
				`${leadBasePath}/${leadId}/move/stage/${stageId}`,
				itemIndex,
				{ body },
			);
		}
		case 'getFields': {
			return await uspacyWebhookRequest.call(this, 'GET', `${leadBasePath}/fields`, itemIndex);
		}
		default:
			throw new NodeOperationError(this.getNode(), `Unsupported lead operation: ${operation}`);
	}
}

async function uspacyWebhookRequest(
	this: IExecuteFunctions,
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
	path: string,
	itemIndex: number,
	options: { body?: IDataObject; qs?: IDataObject } = {},
): Promise<unknown> {
	const credentials = await this.getCredentials('uspacyWebhookApi', itemIndex);
	const webhookSecretUrl = credentials.webhookSecretUrl;

	if (typeof webhookSecretUrl !== 'string') {
		throw new NodeOperationError(this.getNode(), 'The Uspacy Incoming Webhook URL is missing.');
	}

	const requestOptions = {
		method,
		url: buildWebhookUrl(this, webhookSecretUrl, path),
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		...(options.body === undefined ? {} : { body: options.body }),
		...(options.qs === undefined ? {} : { qs: options.qs }),
	};

	return await this.helpers.httpRequestWithAuthentication.call(
		this,
		'uspacyWebhookApi',
		requestOptions,
	);
}

function buildWebhookUrl(context: IExecuteFunctions, webhookSecretUrl: string, path: string): string {
	let url: URL;

	try {
		url = new URL(webhookSecretUrl.trim());
	} catch {
		throw new NodeOperationError(
			context.getNode(),
			'The Uspacy Incoming Webhook URL must be a valid HTTPS URL.',
		);
	}

	if (
		url.protocol !== 'https:' ||
		!url.hostname.endsWith('.uspacy.ua') ||
		!url.pathname.includes('/company/v1/incoming_webhooks/run/')
	) {
		throw new NodeOperationError(
			context.getNode(),
			'Use the full Uspacy Incoming Webhook URL from Uspacy settings.',
		);
	}

	return `${webhookSecretUrl.trim().replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function getLeadId(this: IExecuteFunctions, itemIndex: number): number {
	return getRequiredPositiveNumber.call(this, 'leadId', itemIndex, 'Lead ID');
}

function getRequiredPositiveNumber(
	this: IExecuteFunctions,
	parameterName: string,
	itemIndex: number,
	label: string,
): number {
	const value = this.getNodeParameter(parameterName, itemIndex);
	const numericValue = Number(value);

	if (!Number.isInteger(numericValue) || numericValue < 1) {
		throw new NodeOperationError(this.getNode(), `${label} must be a positive integer.`);
	}

	return numericValue;
}

function getDataObject(this: IExecuteFunctions, itemIndex: number): IDataObject {
	const value = this.getNodeParameter('leadData', itemIndex);

	if (!isDataObject(value)) {
		throw new NodeOperationError(this.getNode(), 'Data must be a JSON object.');
	}

	return value;
}

function buildListQuery(filters: IDataObject): IDataObject {
	const query: IDataObject = {
		page: isPositiveNumber(filters.page) ? filters.page : 1,
		list: isPositiveNumber(filters.list) ? Math.min(Number(filters.list), 100) : 20,
		sort_by: {
			[typeof filters.sortField === 'string' && filters.sortField ? filters.sortField : 'created_at']:
				filters.sortDirection === 'asc' ? 'asc' : 'desc',
		},
	};
	const filterItems: IDataObject[] = [];

	addMultiValueFilter(filterItems, 'funnel_id', filters.funnelIds);
	addMultiValueFilter(filterItems, 'kanban_stage_id', filters.stageIds);
	addMultiValueFilter(filterItems, 'kanban_status', filters.kanbanStatuses);
	addMultiValueFilter(filterItems, 'owner', filters.ownerIds);

	if (typeof filters.source === 'string' && filters.source.trim()) {
		filterItems.push({ field: 'source', operator: 'eq', values: [filters.source.trim()] });
	}

	if (filters.createdAtFrom || filters.createdAtTo) {
		filterItems.push({
			field: 'created_at',
			operator: 'gte-lte',
			values: [
				{
					from: toUnixTimestamp(filters.createdAtFrom, 0),
					to: toUnixTimestamp(filters.createdAtTo, Math.floor(Date.now() / 1000)),
				},
			],
		});
	}

	if (filterItems.length > 0) {
		query.filters = { condition: 'and', filters: filterItems };
	}

	return query;
}

function addMultiValueFilter(filterItems: IDataObject[], field: string, value: unknown): void {
	const values = parseCommaSeparatedValues(value);

	if (values.length > 0) {
		filterItems.push({ field, operator: 'eq', values });
	}
}

function parseCommaSeparatedValues(value: unknown): Array<number | string> {
	if (typeof value !== 'string') return [];

	return value
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean)
		.map((entry) => (/^\d+$/.test(entry) ? Number(entry) : entry));
}

function toUnixTimestamp(value: unknown, fallback: number): number {
	if (typeof value !== 'string' || !value) return fallback;
	const timestamp = Date.parse(value);
	return Number.isNaN(timestamp) ? fallback : Math.floor(timestamp / 1000);
}

function buildCopyBody(
	context: IExecuteFunctions,
	sourceLeadResponse: unknown,
	copyOptions: IDataObject,
): IDataObject {
	const sourceLead = unwrapResponseData(sourceLeadResponse);

	if (!isDataObject(sourceLead)) {
		throw new NodeOperationError(context.getNode(), 'The source lead could not be read for copying.');
	}

	const ignoredFields = new Set([
		'id',
		'created_at',
		'updated_at',
		'created_by',
		'changed_by',
		'converted',
		'kanban_status',
		'kanban_reason_id',
		'closed_by',
		'closed_at',
		'first_closed_by',
		'first_closed_at',
		'new_kanban_stage_id',
		'old_kanban_stage_id',
		'table_name',
		'crm_tasks',
		'letters',
		'contacts',
		'companies',
		'external_channels',
	]);
	const body: IDataObject = {};

	for (const [key, value] of Object.entries(sourceLead)) {
		if (ignoredFields.has(key) || value === null || value === undefined || value === '') continue;

		if (key === 'source' || key === 'lead_label') {
			const selectedValues = getSelectedOptionValues(value);
			if (selectedValues.length > 0) body[key] = key === 'source' ? selectedValues[0] : selectedValues;
			continue;
		}

		if (key === 'phone' || key === 'email' || key === 'messengers') {
			const contactValues = getContactValues(value);
			if (contactValues.length > 0) body[key] = contactValues;
			continue;
		}

		body[key] = value;
	}

	for (const key of ['owner', 'funnel_id', 'kanban_stage_id', 'source'] as const) {
		const value = copyOptions[key];
		if (key === 'source' ? typeof value === 'string' && value.trim() : isPositiveNumber(value)) {
			body[key] = value;
		}
	}

	return body;
}

function unwrapResponseData(response: unknown): unknown {
	if (!isDataObject(response)) return response;
	return response.data ?? response.items ?? response;
}

function getSelectedOptionValues(value: unknown): Array<number | string> {
	if (!Array.isArray(value)) return [];

	return value.flatMap((entry) => {
		if (!isDataObject(entry) || !entry.selected || entry.value === undefined) return [];
		return typeof entry.value === 'number' || typeof entry.value === 'string' ? [entry.value] : [];
	});
}

function getContactValues(value: unknown): IDataObject[] {
	if (!Array.isArray(value)) return [];

	return value.flatMap((entry) => {
		if (!isDataObject(entry) || typeof entry.value !== 'string' || !entry.value.trim()) return [];
		return [{ type: entry.type, value: entry.value }];
	});
}

function normalizeResponse(response: unknown): IDataObject[] {
	const data = unwrapResponseData(response);
	const items = Array.isArray(data) ? data : [data];

	return items.map((item) => (isDataObject(item) ? item : { value: item ?? null }));
}

function isDataObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
