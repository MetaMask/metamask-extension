# Page Object Inspector — Design

**Date:** 2026-08-06
**Status:** Layer 1 (generator and overlap detection) implemented. Matching
engine, overlay UI, and build wiring not yet started.

## Implementation notes

Recorded as the design met reality. See
[Implementation deviations](#implementation-deviations) for detail.

| Metric | Measured against the live codebase |
| --- | --- |
| Files parsed | 190 |
| Page-object classes | 152 |
| Selectors extracted | 1,534 |
| Unresolved | 11 (5 unanchored, 6 uninterpretable) |
| Overlaps found | 120 (111 cross-family, 8 sibling, 1 shadowing) |

## Problem

The E2E page-object layer has grown to 190 TypeScript files under
`test/e2e/page-objects/` (150 under `pages/`, 38 under `flows/`, one under
`components/`, plus `common.ts`). Files are organised into feature folders —
`home`, `send`, `bridge`, `confirmations`, `perps`, `onboarding`, `settings`,
and others — but the mapping between a screen a developer is looking at and the
page-object file that models it is not discoverable.

The concrete failure this causes: a developer writing an E2E test sees a UI
element and has no reliable way to answer *"which page object owns this, and
which method do I call?"* short of grepping 190 files.

**Overlap is already measurably present.** Of 656 distinct `data-testid` values
referenced across the page-object layer, **84 are declared in two or more
different files** — roughly 13%. Concrete cases include
`data-testid="sort-by-networks"` and `data-testid="page-header-back-button"`
(4 files each), and `data-testid="confirm-footer-button"` (3 files). Two page
objects owning the same element is not desired: it means a UI change breaks in
several places, and a test author has no way to know which owner is canonical.

The third effect is silent gaps where no page object exists at all.

## Goal

Make page-object ownership visible and interactive inside the running wallet. A
developer builds with `yarn start`, enables a flag, hovers any element, and sees
which page object and method covers it — or that nothing does, or that **more
than one does**.

The primary job is **discovery while writing a test**. Detecting and eliminating
ownership overlap is an explicit secondary goal with its own deliverable (see
[Overlap detection](#overlap-detection)). Impact analysis and onboarding are
welcome side effects but do not drive the design.

## Key insight

`data-testid` is already a join key between the running UI and the page-object
layer, and at runtime *every* selector shape becomes resolvable.

`test/e2e/page-objects/common.ts` already defines the authoritative locator
contract, referenced 111 times across the layer:

```ts
export type RawLocator =
  | string
  | { css?: string; text?: string }
  | { tag: string; text: string }
  | { testId: string };
```

The generator's taxonomy must mirror this union rather than invent its own.
Measured key occurrences across `test/e2e/page-objects/**` (these are raw key
counts and are not disjoint — a `{ css, text }` object contributes to two rows):

| Shape | Occurrences |
| --- | --- |
| `data-testid="…"` inside selector strings | 800, across 115 of 190 files |
| `text:` key | 756 |
| `css:` key | 326 |
| `tag:` key | 312 |
| `testId:` key | 288 |
| `xpath:` key | 25 |

The wider app defines 2,633 `data-testid` attributes across `ui/` and `app/`,
so the page-object layer references roughly a third of them. That delta is
itself a coverage signal.

Static analysis alone could only resolve the testid-bearing subset — about 70%
of selectors. A runtime inspector resolves all of them, because it can simply
execute each selector against the real DOM using the same semantics
`test/e2e/webdriver/driver.js` uses. This is the decisive advantage of the
runtime approach over a static map or a screenshot atlas.

## Rejected alternatives

**Storybook overlay.** The repo has 462 stories (313 under `ui/components`, 149
under `ui/pages`, against 55 page directories). Coverage is not the problem;
shape is. Storybook renders components in isolation with mocked state, so it has
no routing, no "modal opened from the home screen", and no cross-page flows.
`NetworkManager` exists only as a modal reached from home; `bridge.flow.ts`
spans several screens. Storybook structurally cannot represent the page graph,
which is the thing that is hard to see. Stories also compose differently from
real pages, so the mapping would drift.

**Screenshot atlas harvested from E2E runs.** A static site of captured
screenshots with clickable ownership hotspots. Rejected because the interactive
inspector achieves the same outcome without solving state reachability — the
developer navigates to the state, so no crawler or capture pipeline is needed.

**Hand-maintained diagram or wiki page.** Fast to produce, dead within a
quarter. With 190 files and a growing app, anything not generated from source is
a liability.

## Architecture

Three independently testable pieces connected by one artifact:

```
test/e2e/page-objects/**  ──[ts AST]──>  index.json  ──>  matching engine  ──>  overlay UI
                           (generator)    (contract)       (DOM stamping)      (React root)
```

The index is the only contract between pieces. Later consumers — an editor
command, an agent-queryable lookup — attach to the index without touching the
overlay.

### Component 1: index generator

**Location:** `development/page-object-inspector/`
**Invocation:** `yarn page-objects:index` writes the artifact,
`yarn page-objects:overlaps` prints the report. Both run through `tsx`, the
runner already used by every other script in `development/`.
**Output:** `development/page-object-inspector/.generated/index.json`, gitignored
and imported by webpack only under the flag

Parses each page-object class with the TypeScript compiler API and emits:

```
{
  version, generatedAt,
  pageObjects: [{
    className,
    relativePath,
    extendsClass,          // resolved parent class name, or null
    selectors: [{
      id, kind, value | pattern, params, propertyName, line,
      isDynamic, declaredBy
    }],
    methods: [{ name, line, selectorIds }]
  }],
  overlaps: [ /* see Overlap detection */ ],
  unresolved: [{ relativePath, propertyName, line, reason }]
}
```

`kind` mirrors the `RawLocator` union from `common.ts`: `string` (raw CSS),
`cssText`, `tagText`, `testId`, plus `xpath`.

**Inheritance must be resolved, not flattened.** Twenty page objects extend
another — `TokensTab`, `ActivityTab`, `DeFiTab`, `NftsTab`, `NonEvmHomepage`,
and `PerpsPositionsBase` all extend `HomePage`; ten confirmation classes descend
from `Confirmation` or `TransactionConfirmation`. Every selector records the
class that **declares** it in `declaredBy`. Without this, a single home-screen
element would report six owners and the overlap signal would be pure noise.

**Dynamic selectors** are the main extraction complexity. Many selectors are
arrow functions returning template literals:

```ts
private readonly networkListItem = (networkName: string) =>
  `[data-testid="network-list-item-${networkName}"]`;
```

These become patterns with named holes, so a match against
`network-list-item-Ethereum` recovers `networkName = 'Ethereum'` and the
inspector can report the exact call to write. Extraction is tiered: plain string
literals first, then template patterns, then an `unresolved` bucket.

**Patterns with no literal anchor must be rejected.** Four files declare
`` `[data-testid="${networkName}"]` ``, which as a pattern would match *every*
element carrying any testid and claim ownership of the whole DOM. Any pattern
whose literal portion is empty — or shorter than a minimum threshold — goes to
`unresolved` rather than becoming a matcher.

**The `unresolved` bucket is load-bearing.** Composed selectors such as the
`:is(...)` combinators in `pages/network-manager.ts` will not extract cleanly.
Rather than dropping them silently, the generator reports a count. That number
is the honest coverage ceiling and is expected to shrink over time.

The artifact is not committed. Avoiding a checked-in file avoids diff churn;
freshness is guaranteed by regenerating on every build rather than by diffing.

### Component 2: matching engine

**Location:** `ui/dev/page-object-inspector/`
**Form:** pure TypeScript module, no React

Takes an index and a `Document`. Runs every selector and stamps matched elements
with `data-po-owner`, `data-po-selector-id`, `data-po-args`, and — when more
than one declaring class matches the same element — `data-po-conflict`.

Runs on activation and on a `MutationObserver` debounced at 250ms, and only
while the inspector is toggled on.

**Multiple owners are recorded and classified, never silently arbitrated.**
When selectors declared by two unrelated classes match the same element, both
are stamped and the element is marked as conflicting. Resolution is a human
decision, so the engine's job is to make the conflict impossible to miss.

Two cases must *not* be treated as conflicts, or the signal drowns:

- **Inheritance.** A selector declared on `HomePage` and reached through
  `TokensTab` has one owner, `HomePage`. The engine compares `declaredBy`, not
  the classes that can access the selector.
- **Nesting.** Stamps are per-element, so a child owned by `TokensTab` inside a
  container owned by `HomePage` produces two separately-stamped elements, not a
  conflict. Only two owners on the *same* node count.

Each selector executes inside its own try/catch. A malformed selector increments
a diagnostics counter rather than aborting the pass.

### Component 3: overlay UI

**Location:** `ui/dev/page-object-inspector/`
**Mount:** a second `createRoot` sibling to the app root in `ui/index.js`

The overlay lives entirely outside the app's React tree, so it cannot perturb
application rendering or interact with the React Compiler.

`ui/dev/` is a new top-level directory, chosen deliberately over burying dev
tooling inside `ui/components/app/`. Nothing in `ui/` imports from `ui/dev/`
except the single flag-guarded entry point in `ui/index.js`.

**Hover mode** docks a fixed strip rather than floating a tooltip — the popup
viewport is 360×600, and a floating panel would cover the element under
inspection. The strip shows:

- owning page-object class and `file:line`
- the selector that matched
- methods that use that selector
- a copy button yielding the call to write, e.g.
  `await networkManager.checkNetworkIsSelected('Ethereum')`
- a `cursor://file/...` deep link opening the page object at the right line

Elements carrying a `data-testid` with no owner get a distinct treatment, with
the testid ready to copy. That is the "no page object exists yet" signal.

**Outline mode** stops following the cursor and tints every stamped element,
colour derived from a hash of the file path so colours are stable across
sessions. It renders a legend of files present on screen and a coverage count
(e.g. "18 of 23 elements owned, across 3 page objects").

Outline mode is the delimitation view: overlaps appear as elements claimed by
two files, gaps as untinted regions.

**Conflicting elements override both modes' normal styling** with a distinct
treatment (hatched border), and in hover mode the strip lists every declaring
class with a `file:line` link to each, so a developer can open both sides of a
duplicate and merge them immediately.

## Overlap detection

Two page objects owning the same element is a defect, not a curiosity. Detection
runs at three tiers, cheapest first, and the first tier ships before any UI
exists.

### Tier 1 — identical selectors across files (static)

Pure string comparison at generation time. No DOM, no browser, no runtime.
Across all selector kinds this finds **120 duplicated selectors** today (the
testid-only subset is 84), so it delivers a concrete backlog on day one.

Emitted into the index as an `overlaps` array and rendered as a human-readable
report by `yarn page-objects:overlaps`. A real finding from the current
codebase:

```
data-testid="sort-by-networks"  declared in 4 files
  pages/network-manager.ts:53        networkManagerToggle
  pages/home/tokens-tab.ts:112       networksToggle
  pages/home/defi-tab.ts:50          networksToggle
  pages/home-network-filter.ts:13    networksToggle
```

### Tier 2 — inheritance-aware classification (static)

Tier 1's raw duplicates are not all the same defect. Using the resolved
`extendsClass` graph, each duplicate is classified:

- **Shadowing** — a subclass redeclares a selector its parent already declares.
  The fix is mechanical: delete the child's copy. Safe, low-risk cleanups.
- **Sibling duplication** — two classes sharing an ancestor each declare the
  same selector, but the ancestor does not. The `sort-by-networks` case above
  shows this: `TokensTab` and `DeFiTab` both extend `HomePage` and both declare
  `networksToggle`. The fix is to hoist the selector to the common ancestor.
- **Cross-family duplication** — two classes with no ancestor in common declare
  the same selector. In the same example, `NetworkManager` and
  `HomeNetworkFilter` are unrelated to the `HomePage` family. This is the real
  problem: a human must decide which page object is canonical, or extract a
  shared component page object.
- **Expected** — an explicit allowlist for cases deliberately shared, keyed by
  selector plus the set of owning files, with a required justification comment.
  Anything not on the allowlist is a finding.

### Tier 3 — distinct selectors, same element (runtime)

Only the overlay can catch two *different* selectors resolving to one node — say
`HomePage` matching by testid and another class matching the same button by
`{ tag, text }`. Static analysis cannot see this because the strings differ.

The matching engine already stamps `data-po-conflict` for these. Beyond the
visual treatment, the overlay keeps a per-session conflict log that can be
exported, so a developer sweeping through screens accumulates findings rather
than having to notice each one in the moment.

### Regression control

Once the existing 120 duplicates are triaged, Tier 1 and Tier 2 become a CI check
with a ratchet: the recorded count may fall but not rise. That prevents the
backlog from silently regrowing while it is being paid down. The check must not
be turned on as a hard failure until the initial backlog is either fixed or
allowlisted, otherwise it blocks every unrelated PR from day one.

## Build and toggle wiring

**Build flag:** `PAGE_OBJECT_INSPECTOR`, declared in `builds.yml` and resolved
through the existing precedence chain (env vars > `.metamaskprodrc` >
`.metamaskrc` > `builds.yml`). Both `PAGE_OBJECT_INSPECTOR=1 yarn start` and a
line in `.metamaskrc` work.

The flag guards the index import and the overlay entry point, so webpack
eliminates both from production builds. No bundle-size or LavaMoat surface in
production.

**Runtime toggle:** a switch in the existing
`ui/pages/settings/debug-tab/`, which `ui/pages/settings/settings-registry.ts`
already gates behind
`ENABLE_SETTINGS_PAGE_DEV_OPTIONS || IN_TEST`. This reuses established
machinery and lets a developer switch the overlay off without rebuilding when it
is in the way.

This mirrors the dev-flag pattern already used throughout `ui/index.js` for
`METAMASK_DEBUG`, `IN_TEST`, and `ENABLE_SETTINGS_PAGE_DEV_OPTIONS`.

## Error handling

- The overlay sits behind an error boundary in its own React root. A crash there
  leaves the wallet fully usable.
- A missing or unreadable index renders a banner pointing at
  `yarn page-objects:index` rather than failing silently.
- Per-selector try/catch keeps one malformed selector from aborting a pass;
  failures surface in a diagnostics count.

## Performance

Roughly 1,100 selector definitions run against a popup-sized DOM should complete
in single-digit milliseconds. Passes only run while the inspector is toggled on,
and are debounced at 250ms behind the `MutationObserver`. A pass exceeding 100ms
logs a warning so cost stays visible.

## Testing

- **Generator** carries the bulk of coverage: fixture page-object source files
  in, expected index out, explicitly covering plain literals, dynamic template
  patterns, unanchored patterns that must be rejected, inheritance resolution of
  `declaredBy`, and the unresolvable cases.
- **Overlap classifier** gets its own fixtures per category — shadowing, sibling
  duplication, cross-family duplication, and allowlisted-expected — since
  misclassification here is what would make the report untrustworthy.
- **Matching engine** gets unit tests against a fixture DOM covering the
  same-element conflict case, the two non-conflict cases (inheritance and
  nesting) that must stay silent, and the malformed-selector path.
- **Overlay** gets light component tests for hover and outline modes, including
  the conflict treatment.

All new code is TypeScript with colocated `.test.ts` / `.test.tsx` files, per
repo convention.

## Out of scope for v1

- **Test-dapp page objects.** Eight files (`test-dapp.ts`, `test-dapp-solana.ts`,
  `test-dapp-multichain.ts`, `test-dapp-bitcoin.ts`, and others) target separate
  origins the wallet build cannot inject into. They would need the overlay
  shipped into the test dapp separately.
- **Snap UIs.** Rendered in sandboxed iframes, unreachable from the overlay.
- **Flows.** The 38 `*.flow.ts` files orchestrate across screens rather than
  owning elements, so they do not fit the hover model. A later addition could
  show "flows that use the page objects on this screen" in a side panel.

## Implementation deviations

Five things changed once the generator ran against the real codebase.

**The TypeScript compiler API replaced `ts-morph`.** `ts-morph` is not a
dependency, and adding one would require the full lockfile dedupe,
`allow-scripts`, LavaMoat policy regeneration, and attributions workflow.
Everything the generator needs is syntactic — class declarations, property
initializers, heritage clauses — so no type checker is required, and
`typescript ~5.6.0` is already installed.

**Computed text must be retained, not dropped.** The first version kept only
string-literal object properties, which silently discarded the `text` from
locators like `{ css: 'p', text: tEn('interactingWith') }` and collapsed eleven
distinct confirmation selectors into one bogus shared `css: 'p'` overlap. The
extractor now records the source of a computed value in `textExpression`, and
the canonical key includes it.

**Arrow-function properties are both selectors and methods.** Page objects
declare action methods as arrow properties (`approveModal = async () => {…}`).
Treating every arrow property as a candidate selector inflated the unresolved
count with 78 false entries. A block body or an `async` modifier now marks a
method, which is ignored rather than reported.

**The anchoring rule works on the whole selector, not each hole.** Rejecting
any hole that fills an attribute value wrongly rejected
`[data-testid="to-amount"][value="${amount}"]`, which is well anchored by its
testid. The rule now removes the holes and any attribute selectors left empty
by their removal, then asks whether identifying literal text remains.

**`this.` references resolve within a class.** Composite locators frequently
reference a sibling selector, as in `{ css: this.address, text: 'Etherscan' }`.
Resolving these against the class's own literal selectors recovered 21
selectors that were otherwise uninterpretable. Resolution is order-independent,
since the referenced property may be declared later in the file.

Together these took unresolved selectors from 113 down to 11, about 99%
extraction coverage. The 5 remaining unanchored entries are genuine findings —
selectors such as `[data-testid="${networkName}"]` that really would match
anything. The 6 uninterpretable ones are `By.xpath(…)` wrappers and a ternary.

`xpath` is worth noting as a schema gap: five files use it even though it is
absent from the `RawLocator` union in `common.ts`.

## Follow-on opportunities

- The same index can back an editor command or an agent-queryable lookup, so a
  Cursor agent writing an E2E test can resolve ownership without grepping.
- The `unresolved` count, the owned/unowned element ratio, and the overlap
  ratchet give three measurable reasons to migrate text- and XPath-based
  selectors toward stable, singly-owned testids.
- Document the tool in `test/e2e/AGENTS.md` and the E2E creation skill so both
  humans and agents discover it.
