# n8n-nodes-uspacy

An n8n community node for the Uspacy CRM and workspace API.

## Beta status

`2.0.0-beta.0` is a webhook-only rebuild of the node. It supports the Uspacy
**Lead** resource with these operations:

- Get Many, Get, Create, Update, and Delete
- Copy a lead
- Move a lead to a kanban stage
- Get lead field definitions

The node uses a full Uspacy Incoming Webhook URL stored as a credential. It
does not use bearer tokens.

## Credentials

In Uspacy, create an Incoming Webhook with CRM Lead permissions, then copy its
full URL into the **Uspacy Incoming Webhook API** credential in n8n. Treat that
URL as a secret.

## Development

```bash
npm install
npm run build
npm run lint
npm run dev
```

Never commit webhook URLs, credentials, or `.env` files.
