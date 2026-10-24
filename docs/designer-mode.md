# Designer Mode

Designer Mode is a **dev-only**, in-app visual inspector for the MetaMask
extension UI. It lets a designer point at any component in the running
extension, see its component name / source file / computed styles, tweak values
live, and send a plain-language change request straight to an AI coding agent
that applies the change to the source code.

It is gated behind the `DESIGNER_MODE` build flag and is **never included in
normal or production builds** — the inspector code is only imported when the
flag is on, so it is dead-code-eliminated otherwise.

---

## Getting started

Designer Mode runs inside a developer's local build and pairs with an AI coding
agent. How you get set up depends on your role.

### For developers

The inspector only appears when the UI was built with `DESIGNER_MODE=true`.

1. Add the flag to your **`.metamaskrc`** (not just `.metamaskrc.dist`):

   ```
   DESIGNER_MODE=true
   ```

2. **Fully restart** the dev build (the flag is read at startup, so a watch
   rebuild from a file save will not pick it up):

   ```bash
   yarn start
   ```

3. Load / reload the unpacked extension in Chrome (`dist/chrome`) and open the
   expanded view (`chrome-extension://<id>/home.html`) — the full-page view is
   the best surface to inspect.

If it is working, the DevTools console logs:

- `[designer-mode] flag on — loading inspector…`
- `[designer-mode] inspector active — press Ctrl+Shift+D`

…and the floating 🎨 button appears in the bottom-right corner.

#### Driving the agent loop (optional but recommended)

For the full "edit → apply to code" loop, you need the `designer-mode` agent
skill. Agent skills are **not committed to this repo** (per ADR #57) — they are
synced on demand into the gitignored `.claude/`, `.cursor/`, and `.agents/`
folders.

The skill is currently **experimental**, so a plain `yarn skills` skips it — it
must be opted into explicitly (explicit includes bypass the maturity filter):

```bash
yarn install                                # refreshes the shared skills cache
yarn skills --include ui/designer-mode      # installs .claude/skills/mms-designer-mode/ etc.
```

See the [AI Agent Skills](../README.md#ai-agent-skills-yarn-skills) section of
the README for configuration (domain selection, private overlay, etc.). If the
skill isn't found after the sync, your skills source may need the private
Consensys overlay configured in `.skills.local`.

Once installed, run the `designer-mode` skill in your AI coding assistant and say
**"enter design mode"**. The skill starts the relay server and listens for
requests. Without it, the panel still opens and inspects components — it will
just show **"Not connected"** and the Send button stays disabled.

### For designers

You don't install or build anything yourself — Designer Mode runs inside a
developer's local build. To get set up, pair with a developer on your team and
ask them to:

1. Start the extension with the **`DESIGNER_MODE=true`** flag (see "For
   developers" above).
2. Install and run the **`designer-mode` agent skill** in their AI coding
   assistant (so your change requests actually get applied to the code).
3. Load the unpacked extension in Chrome and open the **expanded view** — the
   full-page window is the best surface to inspect.

Then keep that developer in the loop while you work: each change you send goes to
the agent on their machine, and they may need to approve steps along the way.

> If you don't see the 🎨 button, ask the developer to confirm the build was
> started with `DESIGNER_MODE=true` (and fully restarted after adding the flag).
> If the panel says **"Not connected"**, ask them to start the `designer-mode`
> skill — you can still inspect, but sending changes is disabled until it's running.

---

## How it works

```
┌─────────────────────────┐        ┌──────────────────┐        ┌─────────────────┐
│  MetaMask extension UI   │  HTTP  │   Relay server   │        │   AI agent      │
│  (DESIGNER_MODE=true)    │ ─────► │  localhost:3334  │ ─────► │  (designer-mode │
│  inspector panel 🎨      │ ◄───── │                  │ ◄───── │   skill)        │
└─────────────────────────┘        └──────────────────┘        └─────────────────┘
        designer                       dev machine                  developer
```

1. The **inspector panel** runs inside the extension UI (enabled with the build flag).
2. It talks to a small **relay server** on `http://localhost:3334`.
3. An **AI agent** (running the `designer-mode` skill) listens to the relay,
   applies the requested change to source, and replies back into the panel.

> Because the extension UI and the relay run on the same machine, the default
> `http://localhost:3334` works with no configuration. `http://localhost` is a
> trustworthy origin, so the `chrome-extension://` page can reach it without any
> manifest or CSP changes.

---

## Using the inspector

### 1. Open the inspector

- Click the floating **🎨 Designer Mode** button (bottom-right), or
- Press **Ctrl+Shift+D** (works on Windows/Linux and macOS).

The button can be dragged anywhere if it is in your way.

### 2. Inspect a component

- **Hover** over any element to highlight it and see its component name.
- **Click** to lock the selection — the panel then shows full details:
  - **Component** name, `data-testid`, and source file (`file.tsx:line`)
  - **Layout** (display, position, size, flex)
  - **Spacing** (margin/padding cross editors)
  - **Typography** (font, size, weight, line height, color)
  - **Fill & Stroke** (background, border, radius, shadow)
  - **Design Tokens** and **CSS classes** applied to the element
- Press **Esc** (or **Unlock**) to release the selection.

### 3. Edit values live

- Click any value to edit it inline; changes apply to the live UI immediately so
  you can preview them.
- For numeric values, use **↑ / ↓** to nudge by 1 (hold **Shift** for 10).
- Use the color swatches to pick colors, and add/remove classes or tokens via
  the pill lists.
- Every edit you make is collected into a **pending edits** list shown above the
  message box.

> Live edits are a **preview only**. They are not written to the codebase until
> you send them to the agent (next step). Refreshing the extension resets them.

### 4. Send a change request

At the bottom of the panel:

- The **status dot** shows whether the agent is connected (green = connected).
- Type a plain-language description of what you want (for example, _"make this
  button bigger and use the primary brand color"_), and/or rely on your pending
  inline edits.
- Press **Enter** or click the **↑** send button.

The agent receives the component info, your inline edits, and your message,
applies the change to the source code, and replies in the panel's message
thread. You can keep iterating — each send is a new request.

> **Copy for AI**: if you would rather paste the details somewhere yourself, the
> **Copy for AI** button in the header copies a formatted summary of the selected
> component and your edits to the clipboard.

---

## Troubleshooting

| Symptom                                     | Likely cause / fix                                                                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No 🎨 button                                | Build was not started with `DESIGNER_MODE=true`, or the build wasn't fully restarted after adding the flag. Check the console for the `[designer-mode]` logs. |
| `[designer-mode] failed to init` in console | The inspector threw on init — share the error with a developer.                                                                                               |
| Panel shows **"Not connected"**             | The relay server isn't running. A developer needs to run the `designer-mode` agent skill ("enter design mode"). Inspection still works; sending is disabled.  |
| Send button disabled                        | Same as above — the agent/relay is not connected.                                                                                                             |
| Sent a request but no reply                 | The agent may be busy or waiting for approval. Check with the developer running the skill.                                                                    |

---

## Notes

- Designer Mode is for **development only**. The `DESIGNER_MODE` flag defaults to
  `false` in `builds.yml`, and the inspector is excluded from any build where the
  flag is off.
- Implementation lives in `ui/helpers/designer-mode/`; the gated entry point is in
  `ui/index.js`.
- The agent side is documented in the `designer-mode` skill
  (`.claude/skills/mms-designer-mode/`), which bundles the relay server.
