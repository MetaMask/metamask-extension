# Getting Started with Tailwind CSS in MetaMask Extension

This guide will help you get started with Tailwind CSS in the MetaMask extension project. Tailwind CSS is a utility-first CSS framework that allows you to rapidly build modern interfaces by composing classes directly in your HTML/JSX.

## Table of Contents

- [VSCode Setup](#vscode-setup)
- [Understanding Tailwind in MetaMask](#understanding-tailwind-in-metamask)
- [Example Usage](#example-usage)
- [ESLint Configuration](#eslint-configuration)
- [Best Practices](#best-practices)
- [Design System Integration](#design-system-integration)

## VSCode Setup

### 1. Install Tailwind CSS IntelliSense Extension

The project recommends the Tailwind CSS IntelliSense extension for better development experience. It provides:

- Autocomplete for class names
- Syntax highlighting
- Hover previews
- Error detection for invalid classes

**Installation:**
- Open VSCode
- Go to Extensions (Ctrl+Shift+X)
- Search for "Tailwind CSS IntelliSense"
- Install the extension by Brad Cornes

The extension is already configured in `.vscode/extensions.json` and will be recommended when you open the project.

### 2. Verify Extension is Working

1. Open a TypeScript/TSX file in the `ui/` directory
2. Try typing `className="text-`
3. You should see Tailwind class suggestions
4. Hover over existing Tailwind classes to see their CSS properties

## Understanding Tailwind in MetaMask

### Current Implementation

The MetaMask extension uses Tailwind CSS alongside the MetaMask Design System React components. The design system provides:

- Consistent design tokens
- Pre-built React components
- Tailwind utility classes for layout and spacing

### Integration with Design System

The design system components work seamlessly with Tailwind classes:

```tsx
import { Box, Text } from '@metamask/design-system-react';

<Box className="p-4 bg-muted rounded-lg">
  <Text className="text-lg font-semibold">Hello World</Text>
</Box>
```

## Example Usage

### Basic Layout with Tailwind

Based on the design system stories, here's how to use Tailwind classes effectively:

```tsx
import React from 'react';
import {
  Box,
  Text,
  Button,
  Icon,
  IconName,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';

const WalletComponent = () => {
  return (
    <Box className="min-h-screen md:flex md:items-center md:justify-center md:bg-alternative md:py-4">
      {/* Container with responsive design */}
      <Box className="mx-auto w-full bg-default md:max-w-xl md:rounded-3xl md:py-4">
        
        {/* Header with flexbox utilities */}
        <Box className="border-muted p-4 md:px-8">
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Between}
          >
            <Text className="text-lg font-semibold">Account</Text>
            <Icon name={IconName.Menu} className="cursor-pointer" />
          </Box>
        </Box>

        {/* Content area with spacing */}
        <Box className="p-4 md:px-8">
          <Text className="text-2xl font-bold mb-2">$10,528.46</Text>
          <Text className="text-gray-600">Balance</Text>
        </Box>

        {/* Action buttons with grid layout */}
        <Box className="grid grid-cols-2 gap-4 p-4 md:px-8">
          <Button className="h-auto flex-col py-4 bg-muted rounded-lg hover:bg-muted-hover">
            <Icon name={IconName.Send} className="mb-2" />
            Send
          </Button>
          <Button className="h-auto flex-col py-4 bg-muted rounded-lg hover:bg-muted-hover">
            <Icon name={IconName.Receive} className="mb-2" />
            Receive
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
```

### Responsive Design

Use Tailwind's responsive prefixes:

```tsx
<Box className="p-4 md:p-6 lg:p-8">
  <Text className="text-sm md:text-base lg:text-lg">
    Responsive text
  </Text>
</Box>
```

### Common Utility Classes

```tsx
// Spacing
<Box className="p-4 m-2 px-6 py-3" />

// Layout
<Box className="flex flex-col items-center justify-between" />

// Typography
<Text className="text-lg font-semibold text-center" />

// Colors (use design system tokens when possible)
<Box className="bg-default text-default border-muted" />

// Sizing
<Box className="w-full h-screen max-w-md" />

// Borders and shadows
<Box className="rounded-lg border shadow-md" />
```

## ESLint Configuration

### Current Configuration

The project has Tailwind CSS ESLint rules configured for TypeScript files in the `ui/` directory:

```javascript
// .eslintrc.js
{
  files: ['ui/**/*.ts', 'ui/**/*.tsx'],
  plugins: ['tailwindcss'],
  rules: {
    'tailwindcss/classnames-order': 'error',
    'tailwindcss/enforces-negative-arbitrary-values': 'error',
    'tailwindcss/enforces-shorthand': 'error',
    'tailwindcss/no-arbitrary-value': 'off',
    'tailwindcss/no-custom-classname': 'warn',
    'tailwindcss/no-contradicting-classname': 'error',
    'tailwindcss/no-unnecessary-arbitrary-value': 'error',
  },
}
```

### Enabling for Additional Directories

To enable Tailwind CSS linting for your workspace directory, add it to the ESLint configuration:

```javascript
// Add to .eslintrc.js in the overrides section
{
  files: ['ui/**/*.ts', 'ui/**/*.tsx', 'your-workspace-folder/**/*.{ts,tsx}'],
  plugins: ['tailwindcss'],
  rules: {
    // ... existing Tailwind rules
  },
}
```

**Note:** Tailwind CSS linting is currently limited to specific directories to avoid violations in legacy SCSS code throughout the codebase.

## Best Practices

### 1. Prefer Design System Components

Use MetaMask Design System components when available:

```tsx
// Good
import { Button, ButtonVariant } from '@metamask/design-system-react';
<Button variant={ButtonVariant.Primary} className="w-full">
  Click me
</Button>

// Avoid recreating design system components
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Click me
</button>
```

### 2. Use Semantic Class Names

Combine Tailwind with meaningful class names:

```tsx
// Good
<Box className="wallet-balance-card p-4 rounded-lg bg-default">
  <Text className="balance-amount text-2xl font-bold">$1,234.56</Text>
</Box>
```

### 3. Responsive Design Patterns

```tsx
// Mobile-first approach
<Box className="flex flex-col md:flex-row md:items-center gap-4">
  <Text className="text-sm md:text-base">Mobile first</Text>
</Box>
```

### 4. Avoid Arbitrary Values for Colors

Use design system tokens instead of arbitrary color values:

```tsx
// Good
<Box className="bg-default text-default border-muted" />

// Avoid
<Box className="bg-[#ff0000] text-[#333333]" />
```

### 5. Group Related Classes

```tsx
// Layout classes first, then appearance
<Box className="flex flex-col items-center justify-center p-4 bg-default rounded-lg shadow-md">
```

## Design System Integration

### Using Design System with Tailwind

The design system provides both component props and Tailwind classes:

```tsx
import {
  Box,
  Text,
  BoxFlexDirection,
  BoxAlignItems,
  TextVariant,
  FontWeight,
} from '@metamask/design-system-react';

// Using both design system props and Tailwind classes
<Box
  flexDirection={BoxFlexDirection.Row}
  alignItems={BoxAlignItems.Center}
  className="p-4 bg-muted rounded-lg"
>
  <Text
    variant={TextVariant.HeadingMd}
    fontWeight={FontWeight.Medium}
    className="mr-2 truncate"
  >
    Account Name
  </Text>
</Box>
```

### Design Tokens

The design system provides CSS custom properties that work with Tailwind:

```css
/* Available design tokens */
--color-background-default
--color-text-default
--color-border-muted
--color-primary-default
/* ... and many more */
```

### Common Patterns

```tsx
// Card component
<Box className="bg-default border border-muted rounded-lg p-4 shadow-sm">
  <Text className="text-lg font-semibold mb-2">Card Title</Text>
  <Text className="text-alternative">Card content</Text>
</Box>

// Button group
<Box className="flex gap-2">
  <Button className="flex-1">Primary</Button>
  <Button className="flex-1" variant={ButtonVariant.Secondary}>
    Secondary
  </Button>
</Box>

// List item
<Box className="flex items-center justify-between py-2 border-b border-muted last:border-b-0">
  <Text className="font-medium">Item name</Text>
  <Text className="text-alternative">Value</Text>
</Box>
```

## Troubleshooting

### IntelliSense Not Working

1. Ensure the Tailwind CSS extension is installed and enabled
2. Check that you're working in a supported file type (`.ts`, `.tsx`, `.jsx`)
3. Verify the `tailwind.config.js` file is in the project root
4. Restart VSCode if needed

### ESLint Errors

1. Check that your files are included in the Tailwind ESLint configuration
2. Run `yarn lint:fix` to auto-fix formatting issues
3. Ensure class names are valid Tailwind utilities

### Style Not Applying

1. Check that Tailwind CSS is properly configured in the build process
2. Verify class names are spelled correctly
3. Check for CSS specificity issues with existing styles

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MetaMask Design System](https://github.com/MetaMask/metamask-design-system)
- [Design System Storybook](https://metamask.github.io/design-system)
- [Tailwind CSS IntelliSense Extension](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

## Contributing

When contributing code that uses Tailwind CSS:

1. Follow the existing patterns in the codebase
2. Use design system components when available
3. Write responsive code with mobile-first approach
4. Ensure ESLint rules pass
5. Test across different screen sizes

For questions or issues, please reach out on the #metamask-design-system Slack channel or create an issue in the repository.