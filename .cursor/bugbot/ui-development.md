<!-- Condensed from MetaMask/skills v0.4.0 (commit 12753ca099ebe66edfdec57cd97664fbd82df93e):
https://raw.githubusercontent.com/MetaMask/skills/12753ca099ebe66edfdec57cd97664fbd82df93e/domains/ui/skills/ui-development/skill.md
Reference copy only; it is not linked from `.cursor/BUGBOT.md` in the
round-2 experiment, so findings can be attributed to their real source. -->

# MetaMask UI Development — MMDS Guidance (condensed, in-repo)

The MetaMask Design System (MMDS) is the default for MetaMask product UI.
This is a condensed, in-repo copy of the shared `ui-development` skill from
MetaMask/skills, provided so a reviewer can load it without leaving the
repository. The installed package types always win over this summary.

## Choosing a component

Choose in this order, and record the reason whenever you go past step 1:

1. An MMDS component exported by the installed platform package
   (`@metamask/design-system-react` for the extension).
2. A non-deprecated legacy `component-library` component, only when MMDS does
   not cover the need.
3. An existing feature component that already solves it.
4. Custom UI composed from MMDS primitives and tokens, with the reason
   recorded.

- Never invent a component, a prop, or a variant, and never port an API from
  another UI library or platform.
- Do not build raw HTML or hand-rolled wrappers for something an MMDS
  component already covers (common `Box` hacks included).

## Deprecated APIs

- Do not add new usage of anything marked `@deprecated` (a component, prop,
  or enum value) — including `ui/components/component-library` components.
  Use the replacement its JSDoc or README names when the installed MMDS
  package exports it, even if the repository still uses the deprecated one.
- Check with `grep -rn @deprecated` over the component's installed folder
  (`node_modules/@metamask/design-system-react/dist/components/<Name>/`) or
  the source file's JSDoc.

## Foundations: tokens and Tailwind

- Use preset Tailwind classes first for color, type, shadows, motion,
  spacing, and radius. Tailwind comes from the MMDS presets configured in
  this repo. Use only class names those presets generate, including the 4px
  spacing scale (`p-4`, `gap-2`) and the default radii (`rounded-lg`,
  `rounded-xl`, `rounded-2xl`, `rounded-full`). Do not use default Tailwind
  colors.
- When Tailwind does not apply (a prop or style object, a third-party
  component, a chart, an animation), use a semantic token from the installed
  `@metamask/design-tokens` package, in JS or CSS.
- Never use a raw palette value, a hex value, or an arbitrary value
  (`bg-[#...]`, `p-[15px]`, `rounded-[16px]`, `text-[14px]`,
  `borderRadius: 16`), in classes, style objects, or Sass.
- Meet WCAG AA contrast (normal text 4.5:1, large text and UI graphics 3:1)
  and check dark mode.
- Layouts must survive longer translated strings and future RTL without
  clipping or overlap. Avoid fixed-width text boxes.

## Typography

- Set type with the design-system text component and the font family and
  variant options the installed types expose. Never hand-set font sizes,
  line heights, or arbitrary text classes.

## Incremental migration: `Legacy*` aliases

When a file imports the same name from a legacy source and from the MMDS
platform package, alias the legacy import with a `Legacy` prefix and keep
the MMDS import on the plain name (for example `LegacyBox` from
`component-library`, `Box` from `@metamask/design-system-react`). Finishing
the migration is deleting the `Legacy*` import and its usages.

## Accessibility floor

- Every input has a persistent label; a placeholder is not a label.
- Meaningful icons and icon-only buttons have an accessible name; decorative
  icons are hidden.
- Never show state with color alone, and expose that state to assistive
  tech.
- Do not nest interactive controls.
- Announce async status and errors. Overlays and sheets manage focus and
  keep close or back available.
- Respect reduced motion, and meet WCAG AA contrast.

## Review checklist

- [ ] Every MMDS building block was checked for deprecation, and the
      Deprecated APIs rule holds.
- [ ] MMDS was used wherever it covers the need; any step past MMDS has a
      recorded reason.
- [ ] No invented components, props, or variants, and no cross-platform
      ports.
- [ ] Preset Tailwind classes first; semantic tokens where Tailwind does not
      apply. No raw palette values, hex, or arbitrary values.
- [ ] Typography uses the design-system text component with options from the
      installed types.
- [ ] Clashing legacy imports are aliased `Legacy*`; MMDS keeps plain names.
- [ ] The accessibility floor holds for the changed UI.

## Content (copy) rules — pointer

User-facing strings follow the MetaMask content guidelines (sentence case,
clear, no jargon): see
https://raw.githubusercontent.com/MetaMask/skills/12753ca099ebe66edfdec57cd97664fbd82df93e/domains/ui/skills/content-guidelines/skill.md
