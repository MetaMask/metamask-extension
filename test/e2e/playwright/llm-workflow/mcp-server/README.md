# MetaMask MCP Server (Index)

This file is a lightweight index for MCP server internals.

For all operator workflows, tool behavior, context switching, and mock server setup, use the canonical runbook:

- [`../README.md`](../README.md)

## Scope

- This file: server entrypoints and implementation pointers.
- `../README.md`: source of truth for command snippets and end-to-end usage.

## Server Entrypoints

- [`server.ts`](./server.ts): Creates workflow context, wires session manager, starts MCP server.
- [`metamask-provider.ts`](./metamask-provider.ts): `MetaMaskSessionManager` implementation and context/capability coordination.

## Canonical Runbook Sections

- Tool reference: [`../README.md#available-tools`](../README.md#available-tools)
- Context switching: [`../README.md#context-switching`](../README.md#context-switching)
- Launch modes: [`../README.md#launch-modes`](../README.md#launch-modes)
- Smart contract seeding: [`../README.md#smart-contract-seeding`](../README.md#smart-contract-seeding)
- Knowledge store: [`../README.md#knowledge-store`](../README.md#knowledge-store)

## Run Locally

```bash
yarn tsx test/e2e/playwright/llm-workflow/mcp-server/server.ts
```
