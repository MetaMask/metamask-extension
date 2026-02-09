# Designer Mode — Agent Collaboration

## When to Activate

Activate this workflow when the user says any of:
- "start designer mode"
- "listen for design requests"
- "collaborate with the designer"
- "designer loop"

## Workflow

1. **Start the server** (once, in background):
   ```bash
   yarn designer-server
   ```

2. **Enter the wait loop**:
   ```bash
   yarn designer-wait
   ```
   This blocks until the designer sends a request from the browser panel.

3. **Read the output** — it is a structured prompt containing:
   - The selected element (component, path, test ID, CSS classes)
   - Inline edits the designer made (original → new values)
   - The designer's message (e.g. "make this button red")

4. **Apply the requested changes** to the source code.

5. **Run `yarn designer-wait` again** to receive the next request.

6. **Repeat** until told to stop.

## Key Details

- The designer is watching via **hot reload** — they see your changes live.
- Inline edits from the panel are **ephemeral** (DOM only). You must apply
  equivalent changes to the source files.
- The prompt includes a changeset diff — use it to know exactly what CSS
  properties or text content to change and where.
- The relay server runs on **localhost:3334** (override via `DESIGNER_PORT`).
- The `designer-wait` output is **self-documenting** — it includes instructions
  for the agent even if this rule was not read.
