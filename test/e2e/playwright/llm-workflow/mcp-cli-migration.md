# Migrating from MCP Server to `mm` CLI

The MetaMask visual testing tooling previously ran as an MCP (Model Context Protocol) server over stdio. It has been replaced by a standalone HTTP daemon + `mm` CLI. If you were using the MCP server, follow the steps below.

## 1. Remove your MCP server configuration

The MCP server entry point (`mcp-server/server.ts`) has been deleted. Any existing MCP configuration pointing at it will fail.

**Claude Desktop** (`claude_desktop_config.json`) — remove the `metamask` entry:

```diff
 {
   "mcpServers": {
-    "metamask": {
-      "command": "/path/to/node",
-      "args": [
-        "/path/to/metamask-extension/node_modules/.bin/tsx",
-        "/path/to/metamask-extension/test/e2e/playwright/llm-workflow/mcp-server/server.ts"
-      ]
-    }
   }
 }
```

**Cursor** (`.cursor/mcp.json`) — remove the `metamask` entry if present.

**Any other MCP client** — remove the MetaMask MCP server entry.

## 2. Use the `mm` CLI instead

No MCP configuration is needed. The `mm` CLI is a project dependency that talks to a local HTTP daemon. The daemon auto-starts when you run `mm launch`.

```bash
# From the metamask-extension project root:
npx mm launch              # Start browser + extension (daemon auto-starts)
npx mm describe-screen     # See what's on screen
npx mm click e3            # Interact using refs from describe-screen
npx mm cleanup --shutdown  # Stop browser + daemon
```

## 3. What changed

| Before (MCP)                                        | After (CLI)                                      |
| --------------------------------------------------- | ------------------------------------------------ |
| MCP server over stdio                               | HTTP daemon + CLI                                |
| Configured in `claude_desktop_config.json` / Cursor | No configuration needed                          |
| Tool names: `mm_launch`, `mm_click`, `mm_type`      | CLI commands: `mm launch`, `mm click`, `mm type` |
| Always-on subprocess                                | Auto-starts on `mm launch`, idle timeout 30m     |
| Required `tsx` to run the server entry point        | `npx mm` (project dependency)                    |

For the full command reference, see the [SKILL.md](/.claude/skills/metamask-visual-testing/SKILL.md) or the [README](./README.md).
