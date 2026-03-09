# Designer Mode — Agent Collaboration

## When to Activate

Activate this workflow when the user says any of:
- "start designer mode"
- "run designer mode"
- "listen for design requests"
- "collaborate with the designer"
- "designer loop"

## Workflow

1. **Start the server** (once, in background with `block_until_ms: 0`):
   ```bash
   yarn designer-server
   ```
   Wait a few seconds, then read the terminal output to confirm it says
   "Listening on http://localhost:3334".

2. **Tell the user** how to send requests. Print a short message like:
   > Designer Mode is ready. In the extension:
   > 1. Go to Settings → Developer Options and enable Designer Mode
   > 2. Click the 🎨 button or press Ctrl+Shift+D to activate the inspector
   > 3. Click an element, then type a message and hit Send
   >
   > Waiting for your first request...
   > Please accept the next command so I can start listening.

3. **Run `yarn designer-wait`** with `block_until_ms: 600000` (ten minutes).
   This blocks until the designer sends a request, prints the structured
   prompt, and exits.

4. **Read the output** — it contains:
   - The selected element (component, path, test ID, CSS classes)
   - Inline edits the designer made (original → new values)
   - The designer's message (e.g. "make this button red")

5. **Apply the requested changes** to the source code.

6. **Send a response** to the designer panel:
   ```bash
   curl -s -X POST http://localhost:3334/api/response \
     -H "Content-Type: text/plain" \
     -d "Done — <brief summary of what you changed>"
   ```

7. **IMMEDIATELY run `yarn designer-wait` again** — go back to step 3.

## CRITICAL: Always Re-run designer-wait

The number one failure mode is the agent forgetting to run `designer-wait`
again after applying changes. **Every time** you finish steps 4 and 5,
you MUST run `yarn designer-wait` again. No exceptions.

The correct sequence after every request is:
1. Apply code changes
2. Send curl response
3. Run `yarn designer-wait` ← do NOT skip this

If `designer-wait` gets backgrounded (exceeds `block_until_ms`), read
its terminal output file to check if a request arrived. Then run
`yarn designer-wait` again for the next one.

## Key Details

- Use `block_until_ms: 600000` for `yarn designer-wait` so it has time to
  receive the request before Cursor backgrounds it.
- The designer is watching via **hot reload** — they see your changes live
  after the extension rebuilds (can take a few seconds).
- Inline edits from the panel are **ephemeral** (DOM only). You must apply
  equivalent changes to the source files.
- The prompt includes a changeset diff — use it to know exactly what CSS
  properties or text content to change and where.
- The relay server runs on **localhost:3334** (override via `DESIGNER_PORT`).
