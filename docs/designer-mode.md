# Designer Mode — Guide for Designers

Designer Mode lets you inspect any UI element in the MetaMask extension, tweak
styles and text live in the browser, and send change requests directly to an AI
coding agent. The agent applies your changes to the source code, hot reload
shows the result, and you keep iterating.

---

## Getting Started

1. **Make sure the extension is running** — You need a development build
   running (`yarn start`) and the extension loaded in Chrome.
2. **Enable Designer Mode** — In the extension, go to **Settings → Developer
   Options** and turn on **Designer Mode**.
3. **Tell the agent "run designer mode"** — In Cursor, ask the AI agent to
   *"run designer mode"*. It will start the relay server and begin listening
   for your requests.
4. **Start designing** — Click the floating **🎨 button** in the bottom-right
   corner to activate the inspector. Hover, click, tweak, and send changes to
   the agent right from the panel.

That's it — you're in the loop.

**Note:** After the agent makes a code change, the extension needs to rebuild
(this can take a few seconds). Once it's ready, **manually refresh the extension
page** to see the updated UI.

---

## Setup Details

Make sure the extension is running a development build (`yarn start`). After
enabling Designer Mode in Developer Options, a floating **paint-palette button**
appears in the bottom-right corner of the extension — that confirms it's ready.

---

## Activating the Inspector

| Action | What it does |
|---|---|
| Click the floating **🎨 button** | Activates the element inspector |
| **Ctrl+Shift+D** (or **Cmd+Shift+D** on Mac) | Toggle the inspector on/off |

When active, a dark **Figma-style panel** appears on the right side of the
extension window.

---

## Inspecting Elements

1. **Hover** over any element — a blue dashed outline follows your cursor, and
   the panel shows live info about the element under your mouse:
   - Component name and React tree path
   - Design tokens detected from class names
   - Computed styles (layout, typography, colors, spacing, borders)

2. **Click** an element to **lock the selection**. The outline turns solid and
   the panel stays pinned to that element even if you move your mouse away.

3. Click the same element again (or press **Esc**, or click **Unlock** in the
   panel) to release the lock.

---

## Editing Values Inline

Once you lock an element, every style value in the panel becomes **editable**.

### Text content
At the top of the panel you'll see a **Text Content** field. Click it to type a
new value — the change appears in the DOM instantly.

### Style properties
Each property row (width, font-size, color, padding, etc.) is click-to-edit:

- **Click** a value to type a new one. Changes apply live on every keystroke.
- **Arrow Up / Down** increments numeric values by 1 (hold **Shift** for ±10).
- **Enter** confirms, **Escape** reverts to the original value.
- **Color** fields show a swatch — click the swatch to open a color picker.

### Spacing editor
The **Spacing** section has a visual cross-layout for margin and padding. Click
any side (top, right, bottom, left) to edit individually.

### Classes & Design Tokens
Expand the **Classes** or **Design Tokens** sections to:
- **Remove** a class/token by clicking the ✕ on its pill.
- **Add** a new one by clicking **+ Add** and typing (e.g., `mm-box--padding-4`).

> All inline edits are **ephemeral** — they only affect the DOM in your current
> session. To make them permanent, send them to the agent (see below).

---

## Sending Changes to the AI Agent

This is the core collaboration loop. The bottom of the panel has a **chat
section** where you communicate with the AI agent.

### Prerequisites
The agent needs to be running two things in their terminal:
```
yarn designer-server    # relay server (run once)
yarn designer-wait      # blocks until you send a request
```
A green **Connected** dot in the panel confirms the relay server is reachable.

### Workflow

1. **Select an element** (click to lock).
2. Optionally **make inline edits** (change text, tweak styles). The panel
   tracks all your edits and shows an **"N unsent edits"** banner.
3. Either:
   - Click **Apply** on the pending-edits banner to send only the edits, or
   - Type a message in the text box (e.g., *"make this button red and larger"*)
     and press **Enter** (or click the ↑ send button).
4. The agent receives your selected element info, any inline edits you made, and
   your message. It modifies the source code accordingly.
5. **Hot reload** updates the extension — you see the result live.
6. The agent's response appears in the chat as a confirmation bubble.
7. Repeat: inspect, tweak, send, see the result.

### What the agent receives
The structured prompt sent to the agent includes:
- Component name, React tree path, test ID, CSS classes
- Design tokens detected from class names
- Component props (serialized)
- A **changeset** of every inline edit you made (original → new value)
- Current computed styles for reference
- Your typed message

---

## Keyboard Shortcuts

| Shortcut | Context | Action |
|---|---|---|
| **Ctrl+Shift+D** / **Cmd+Shift+D** | Anywhere | Toggle inspector on/off |
| **Click** element | Inspector active | Lock/unlock selection |
| **Esc** | Selection locked | Unlock selection |
| **Esc** | No selection locked | Close inspector |
| **C** | Element selected or hovered | Copy element info to clipboard |
| **↑ / ↓** | Editing a numeric value | Increment/decrement by 1 |
| **Shift + ↑ / ↓** | Editing a numeric value | Increment/decrement by 10 |
| **Enter** | Editing a value | Confirm edit |
| **Escape** | Editing a value | Revert to original |

---

## Panel Sections Reference

| Section | What it shows | Editable? |
|---|---|---|
| **Header** | Component name, test ID, path | No |
| **Text Content** | Direct text content of the element | Yes |
| **Layout** | display, position, width, height, flex, gap, overflow | Yes |
| **Spacing** | Margin and padding (visual cross-layout) | Yes |
| **Typography** | font-family, size, weight, line-height, align, color | Yes |
| **Fill & Stroke** | Background, opacity, border, border-radius, box-shadow | Yes |
| **Component** | React component name, test ID, full path, props JSON | No (read-only) |
| **Design Tokens** | Tokens detected from `mm-box--*` / `mm-text--*` classes | Add/Remove |
| **Classes** | All CSS classes on the element | Add/Remove |

---

## Other Panel Controls

| Control | Location | What it does |
|---|---|---|
| **Copy for AI** | Header | Copies all element info as a formatted Markdown prompt to your clipboard (useful for pasting into other AI tools) |
| **▁ / ▢** | Header | Minimize / expand the panel |
| **×** | Header | Close Designer Mode |
| **⠿** drag handle | Header | Drag to reposition the panel |

---

## Tips

- **Start broad, then narrow down.** Hover around to find the right element
  before locking. The component name label that follows your cursor helps.
- **Use the edit log.** Make several tweaks (font size, color, padding), then
  send them all at once via the Apply button — the agent gets a clean diff.
- **Be specific in messages.** "Make this 16px bold red" works better than "make
  it look different."
- **Combine inline edits + messages.** Tweak the padding yourself, then type
  "also add a subtle box shadow" — the agent gets both instructions.
- **Check the Component section** for test IDs and props — this helps you
  understand what the element is and gives the agent precise context.
