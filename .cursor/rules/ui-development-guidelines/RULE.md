---
description: UI Development Guidelines for MetaMask Extension
globs:
  - 'ui/**/*.{tsx,jsx,ts,js}'
alwaysApply: true
---

# MetaMask Extension React UI Development Guidelines

## Core Principle

Always prioritize `@metamask/design-system-react` components and Tailwind CSS patterns over custom implementations. **Never write SASS** - we are actively reducing CSS file size by eliminating SASS usage.

## Component Hierarchy (STRICT ORDER)

### The Rule: Check Design System First
**Before writing any new component or choosing what to use, ask: "Does `@metamask/design-system-react` have this?"**

1. **FIRST**: Use `@metamask/design-system-react` components
   - **Always use for**: Box (layout), Text (typography), Button/ButtonBase/ButtonIcon, Icon, Checkbox
   - **Always use for**: Avatar variants (AvatarAccount, AvatarBase, AvatarFavicon, AvatarGroup, AvatarIcon, AvatarNetwork, AvatarToken)
   - **Always use for**: Badge variants (BadgeCount, BadgeIcon, BadgeNetwork, BadgeStatus, BadgeWrapper)
   - **Rule**: If it exists in the design system, you MUST use it

2. **SECOND**: Use `ui/components/component-library` ONLY if design system lacks it
   - **Use for**: Modal, ModalOverlay, ModalContent, ModalBody, ModalHeader, ModalFooter, ModalFocus
   - **Use for**: BannerBase, BannerAlert, BannerTip
   - **Use for**: Container, HeaderBase, HelpText, Input, Label, Popover, PopoverHeader
   - **Use for**: PickerNetwork, SensitiveText, Tag, TagUrl, TextFieldSearch, Textarea, Skeleton
   - **Use for**: SelectButton, SelectOption, SelectWrapper
   - **Rule**: These are MetaMask-specific implementations not (yet) in the design system
   - **Important**: component-library components should themselves use design system primitives internally

3. **THIRD**: Feature-specific components
   - **Use for**: Complex, domain-specific UI that combines multiple design system/component-library components
   - **Examples**: `ConnectAccountsModal`, `AssetPickerModal`, `NotificationDetailAsset`
   - **Rule**: Must be built using Box, Text, and other design system primitives - NO SASS, minimal CSS
   - **Reuse**: Search for existing feature components before building new ones to avoid duplication

4. **LAST RESORT**: Custom components with minimal CSS
   - **Only when**: Highly specialized one-off needs with no design system equivalent AND no component-library equivalent
   - **Requires**: Strong justification why design system primitives can't be composed
   - **NEVER**: Write SASS files - use Tailwind classes only

### Decision Tree
```
Need a component?
  ├─ Is it Box, Text, Button, Icon, Avatar, Badge, or Checkbox?
  │  └─ YES → Use @metamask/design-system-react [STOP]
  │
  ├─ Is it Modal, Banner, Popover, Input, Label, Tag, Textarea, etc?
  │  └─ YES → Use ui/components/component-library [STOP]
  │
  ├─ Is it feature-specific UI (e.g., ConnectAccountsModal, AssetPicker)?
  │  ├─ Does it already exist? (search codebase for similar components)
  │  │  ├─ YES → Reuse existing component [STOP]
  │  │  └─ NO → Build new component using design system primitives [STOP]
  │  └─
  │
  └─ Can I compose it from Box + Text + other primitives?
     ├─ YES → Compose from design system [STOP]
     └─ NO → Consider if custom implementation is truly necessary
```

### Why This Hierarchy Matters
- **Consistency**: Design system ensures consistent look, feel, and behavior
- **Maintenance**: Centralized updates benefit all consumers
- **Accessibility**: Design system components built with accessibility in mind
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Performance**: Optimized components reduce bundle size
- **No SASS**: Reduces CSS file size and build complexity

## Required Imports for Extension

```tsx
// ALWAYS prefer these imports
import {
  Box,
  Text,
  Button,
  ButtonBase,
  ButtonIcon,
  Icon,
  TextVariant,
  IconName,
  IconColor,
  IconSize,
  FontWeight,
  TextColor,
  ButtonVariant,
  ButtonSize,
  // Avatar components
  AvatarAccount,
  AvatarBase,
  AvatarFavicon,
  AvatarGroup,
  AvatarIcon,
  AvatarNetwork,
  AvatarToken,
  // Badge components
  BadgeCount,
  BadgeIcon,
  BadgeNetwork,
  BadgeStatus,
  BadgeWrapper,
  // Box enums
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxFlexWrap,
  // ... other design system components
} from '@metamask/design-system-react';
```

## Component Documentation Access

### Type Definitions & Documentation
All `@metamask/design-system-react` components have comprehensive TypeScript definitions:

- **Box**: `/node_modules/@metamask/design-system-react/dist/components/Box/*.d.cts`
- **Text**: `/node_modules/@metamask/design-system-react/dist/components/Text/*.d.cts`
- **Button**: `/node_modules/@metamask/design-system-react/dist/components/Button/*.d.cts`

When unsure about component APIs:
1. Read the `.d.cts` files for complete prop documentation
2. Reference `ui/pages/design-system/design-system.stories.tsx` for usage examples
3. Check GitHub source: https://github.com/MetaMask/metamask-design-system/tree/main/packages/design-system-react/src/components

### Box Component Quick Reference
- **Spacing**: Use `gap`, `padding`, `margin` props or Tailwind classes
- **Flexbox**: Use `flexDirection`, `alignItems`, `justifyContent` enum props
- **Colors**: Use `className` with semantic Tailwind tokens (e.g., `bg-default`, `text-primary`)
- **Tailwind**: Use `className` prop for all Tailwind utilities

## Styling Rules (ENFORCE STRICTLY)

### ✅ ALWAYS DO:

- Use `Box` component instead of `div` for layout
- Use `Text` component with variants instead of raw text elements
- Use `className` prop for Tailwind utilities
- Use design system color tokens: `bg-default`, `text-primary`, `border-muted`
- Use component props first: `variant`, `color`, `size`, etc.
- Use Tailwind classes from `@metamask/design-system-tailwind-preset`

### ❌ NEVER SUGGEST:

- SASS files (`.scss`) - we are eliminating SASS
- `StyleSheet.create()` or CSS-in-JS
- Raw `div` or semantic HTML without design system wrappers
- Arbitrary color values like `bg-[#3B82F6]` or `text-[#000000]`
- Inline style objects unless for truly dynamic values
- Custom CSS files for new components

## Code Pattern Templates

### Basic Container:

```tsx
const MyComponent = () => {
  return (
    <Box className="w-full bg-default p-4">
      <Text variant={TextVariant.HeadingMd}>Title</Text>
    </Box>
  );
};
```

### Flex Layout:

```tsx
<Box
  flexDirection={BoxFlexDirection.Row}
  alignItems={BoxAlignItems.Center}
  justifyContent={BoxJustifyContent.Between}
  gap={3}
  className="p-4"
>
  <Text variant={TextVariant.BodyMd}>Content</Text>
</Box>
```

### Interactive Element:

```tsx
<ButtonBase
  className="h-auto rounded-lg bg-muted px-4 py-2 hover:bg-muted-hover active:bg-muted-pressed"
  onClick={handleClick}
>
  <Icon name={IconName.Bank} />
  <Text fontWeight={FontWeight.Medium}>Button Text</Text>
</ButtonBase>
```

### Using Avatars and Badges:

```tsx
<BadgeWrapper
  badge={
    <BadgeNetwork
      name="Ethereum"
      src="https://example.com/ethereum-logo.png"
    />
  }
>
  <AvatarToken
    name="ETH"
    src="https://example.com/eth-logo.png"
    size={AvatarTokenSize.Md}
  />
</BadgeWrapper>
```

## Box Component Best Practices

### Prefer Props Over className for Layout
✅ **DO** - Use typed props for type safety and consistency:
```tsx
<Box
  flexDirection={BoxFlexDirection.Row}
  alignItems={BoxAlignItems.Center}
  justifyContent={BoxJustifyContent.Between}
  gap={3}
  padding={4}
  margin={2}
>
```

❌ **DON'T** - Use className for properties that have dedicated props:
```tsx
<Box className="flex flex-row items-center justify-between gap-3 p-4 m-2">
```

### When to Use className
Use `className` for:
- Width and height: `w-full`, `h-20`, `w-96`
- Complex positioning: `absolute`, `relative`, `top-0`, `left-0`
- Borders: `rounded-lg`, `border`, `border-t`
- Shadows and opacity: `shadow-lg`, `opacity-50`
- Background and text colors: `bg-default`, `text-primary`
- Utilities not covered by props: `overflow-hidden`, `z-10`, `truncate`

### Color Tokens
Always use semantic color tokens from `@metamask/design-system-tailwind-preset`:
```tsx
// ✅ Semantic tokens
<Box className="bg-default">
<Box className="bg-alternative">
<Box className="bg-muted hover:bg-muted-hover active:bg-muted-pressed">
<Text color={TextColor.TextPrimary}>
<Text color={TextColor.TextAlternative}>
<Icon color={IconColor.IconDefault}>

// ❌ Arbitrary colors
<Box className="bg-[#3B82F6]">
<Box style={{ backgroundColor: '#FF0000' }}>
```

## Component Conversion Guide

| DON'T Use                                  | USE Instead                                |
| ------------------------------------------ | ------------------------------------------ |
| `<div>`                                    | `<Box>`                                    |
| `<span>`, `<p>`, `<h1>`, etc.              | `<Text variant={TextVariant.BodyMd}>`      |
| SASS files (`.scss`)                       | Tailwind `className="..."`                 |
| `style={{ backgroundColor: 'red' }}`       | `className="bg-error-default"`             |
| `style={{ display: 'flex' }}`              | `flexDirection={BoxFlexDirection.Row}`     |
| Manual padding/margin in CSS               | `className="p-4 m-2"`                      |
| Custom CSS classes in `.scss`              | Tailwind utility classes                   |

## Legacy Code Migration Guidelines

### Identifying Legacy Patterns
🚫 **Anti-patterns to refactor when encountered:**
- SASS files (`.scss`) - highest priority to eliminate
- Separate `.styles.ts` or style objects
- Raw `div` components instead of `Box`
- Raw text elements with custom styles instead of design system `Text` with variants
- Inline style objects for static styles
- Custom CSS classes that could be Tailwind utilities

### Migration Priority
1. **High Priority**: Active components using SASS - convert to Tailwind
2. **Medium Priority**: Frequently used shared components with style objects
3. **Low Priority**: Stable legacy components with no active development

### Migration Steps
1. Replace `div` → `Box` from design system
2. Replace text elements → `Text` with appropriate `TextVariant`
3. Convert SASS styles → Tailwind `className` props
4. Convert arbitrary colors → design system color tokens
5. Delete `.scss` files after migration
6. Test thoroughly - layout can shift during migration

### Example Migration

**Before (SASS):**
```tsx
// component.tsx
import './component.scss';

<div className="my-container">
  <h2 className="my-title">Title</h2>
</div>

// component.scss
.my-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16px;
  background-color: #ffffff;
}

.my-title {
  font-size: 16px;
  font-weight: 500;
  color: #000000;
}
```

**After (Tailwind):**
```tsx
import { Box, Text, TextVariant, FontWeight, BoxFlexDirection, BoxAlignItems } from '@metamask/design-system-react';

<Box
  flexDirection={BoxFlexDirection.Row}
  alignItems={BoxAlignItems.Center}
  className="p-4 bg-default"
>
  <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Medium}>
    Title
  </Text>
</Box>
```

## Error Prevention & Code Review Checklist

### Before Committing Code, Verify:
- [ ] No SASS files (`.scss`) created or modified
- [ ] No raw `div` components (use `Box`)
- [ ] No raw text elements without variants (use `Text` with `TextVariant`)
- [ ] No custom CSS files (use Tailwind classes)
- [ ] No arbitrary color values (use design system tokens)
- [ ] No separate `.styles.ts` files for new components
- [ ] Component props used before `className` for layout
- [ ] All colors use semantic tokens from Tailwind preset

### When You See These Patterns, IMMEDIATELY Suggest Alternatives:
- Any `.scss` file → Tailwind classes in `className`
- Any `div` component → `Box` from design system
- Any custom CSS → Tailwind utility classes
- Any arbitrary color values → Design system tokens
- Manual flex properties → Box component props + className

### AI Agent Guidelines
When suggesting code changes:
1. ALWAYS read component type definitions first for accurate API usage
2. ALWAYS check `ui/pages/design-system/design-system.stories.tsx` for real-world patterns
3. ALWAYS search for existing feature-specific components before building new ones
4. REJECT any suggestions that violate the hierarchy
5. REJECT any SASS file creation or modification
6. SUGGEST migrations when encountering legacy patterns
7. EXPLAIN why design system approach is preferred

## Design System Priority

Before suggesting any UI solution:

1. Check if `@metamask/design-system-react` has the component
2. Use component's built-in props (variant, color, size)
3. Add layout/spacing with Box props or `className`
4. Add colors with semantic Tailwind tokens
5. Only suggest component-library or custom components if design system lacks it
6. **NEVER** suggest SASS files

## Tailwind Configuration

The extension uses:
- `@metamask/design-system-tailwind-preset` for design tokens
- `@metamask/design-tokens` for color and spacing values
- Custom `tailwind.config.js` that extends the preset

All Tailwind colors are mapped to design tokens. Use semantic class names:
- `bg-default`, `bg-alternative`, `bg-muted`
- `text-default`, `text-alternative`, `text-muted`
- `border-default`, `border-muted`
- Interactive states: `hover:bg-hover`, `active:bg-pressed`

## Reference Examples

Always reference the patterns from:
- `ui/pages/design-system/design-system.stories.tsx` for design system usage
- `ui/components/component-library/` for component-library patterns
- `ui/components/multichain/` for feature component examples

## Enforcement

- REJECT any code suggestions that create SASS files
- REJECT raw div/span/p usage when Box/Text components exist
- REJECT arbitrary color values not from design tokens
- REQUIRE design system components as first choice
- ENFORCE Tailwind-only styling approach
- PROHIBIT new CSS/SCSS file creation
