# Storybook CSF 2.0 to CSF 3.0 Conversion Progress

## Overview
Converting all Storybook stories from CSF 2.0 to CSF 3.0 format with TypeScript migration.

## Current Status
- **Total JavaScript files:** 222
- **Total TypeScript files:** 237
- **Files converted:** 5 complete + 1 partial

## Completed Conversions

### ✅ TypeScript Files (CSF 2.0 → CSF 3.0)

1. **popover-header.stories.tsx** - Complete
   - Updated imports: `ComponentStory, ComponentMeta` → `Meta, StoryObj`
   - Converted Template.bind() pattern to object stories
   - Added proper TypeScript typing
   - Maintained all story functionality

2. **modal-focus.stories.tsx** - Complete
   - Complex stateful stories with React hooks
   - Converted Template.bind() and custom render functions
   - Preserved all interactive functionality

3. **label.stories.tsx** - Complete
   - Mixed Template.bind() and direct component stories
   - Converted with proper args and render functions
   - Maintained form interaction logic

4. **badge-wrapper.stories.tsx** - Complete
   - Complex component with multiple story variants
   - Converted large file with many Template.bind() instances
   - Preserved all visual variations

5. **text-field.stories.tsx** - Complete
   - Advanced patterns with useArgs hook
   - Multiple story types with different render patterns
   - Maintained all interactive functionality

6. **box.stories.tsx** - ⚠️ Partial (945 lines)
   - Started conversion but needs completion
   - Mixed ComponentStory function patterns
   - Large file with extensive argTypes

## Conversion Pattern Applied

### Before (CSF 2.0)
```typescript
import { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
  title: 'Components/Button',
  component: Button,
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = (args) => <Button {...args} />;

export const Primary = Template.bind({});
Primary.args = { primary: true };
```

### After (CSF 3.0)
```typescript
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Button> = {
  component: Button,
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { primary: true },
};
```

## Remaining Work

### 1. Complete box.stories.tsx
- Finish converting remaining ComponentStory references
- Handle complex responsive props stories
- Maintain all visual examples

### 2. JavaScript Files Conversion (222 files)
Need to convert all `.stories.js` files to `.stories.ts` with proper CSF 3.0 format.

#### Sample JavaScript files to convert:
- `ui/components/ui/card/card.stories.js`
- `ui/components/ui/chip/chip.stories.js`
- `ui/components/ui/icon/icon.stories.js`
- `ui/components/ui/logo/logo.stories.js`
- `ui/components/ui/menu/menu.stories.js`
- `ui/components/ui/tabs/tabs.stories.js`
- And 216 more...

#### JavaScript Conversion Steps:
1. **Rename files**: `.js` → `.ts`, `.jsx` → `.tsx`
2. **Update imports**: Add proper TypeScript imports
3. **Convert to CSF 3.0**: Apply object-based story format
4. **Add TypeScript types**: Ensure proper typing
5. **Validate**: Check that all stories render correctly

## Systematic Conversion Strategy

### Phase 1: Complete TypeScript Files
- [ ] Finish box.stories.tsx conversion
- [ ] Verify all 6 TypeScript files work correctly

### Phase 2: JavaScript Files in Batches
**Batch 1: UI Components (Simple)**
- [ ] card.stories.js → card.stories.ts
- [ ] chip.stories.js → chip.stories.ts
- [ ] icon.stories.js → icon.stories.ts
- [ ] logo.stories.js → logo.stories.ts
- [ ] menu.stories.js → menu.stories.ts

**Batch 2: UI Components (Complex)**
- [ ] tabs.stories.js → tabs.stories.ts
- [ ] Complex interactive components
- [ ] Components with custom render functions

**Batch 3: App Components**
- [ ] Assets components
- [ ] NFT components
- [ ] Permission components
- [ ] Network components

**Batch 4: Pages and Complex Features**
- [ ] Confirmation pages
- [ ] Onboarding flows
- [ ] Settings pages
- [ ] Advanced features

### Phase 3: Validation
- [ ] Build test: `npm run storybook:build`
- [ ] Type checking: `npx tsc --noEmit`
- [ ] Visual regression testing
- [ ] Story interaction testing

## Key Conversion Patterns

### 1. Simple Story Conversion
```javascript
// Before (JS)
export const Default = (args) => <Component {...args} />;
Default.args = { prop: 'value' };

// After (TS)
export const Default: Story = {
  args: { prop: 'value' },
};
```

### 2. Complex Render Function
```javascript
// Before (JS)
export const WithState = (args) => {
  const [state, setState] = useState(false);
  return <Component {...args} state={state} onChange={setState} />;
};

// After (TS)
export const WithState: Story = {
  render: (args) => {
    const [state, setState] = useState(false);
    return <Component {...args} state={state} onChange={setState} />;
  },
};
```

### 3. Story with Custom Props
```javascript
// Before (JS)
export const CustomStory = () => (
  <CustomWrapper>
    <Component prop="custom" />
  </CustomWrapper>
);

// After (TS)
export const CustomStory: Story = {
  render: () => (
    <CustomWrapper>
      <Component prop="custom" />
    </CustomWrapper>
  ),
};
```

## Automation Opportunities

### File Renaming Script
```bash
# Rename all .stories.js files to .stories.ts
find /workspace -name "*.stories.js" -exec bash -c 'mv "$1" "${1%.js}.ts"' _ {} \;
```

### Batch Import Updates
```bash
# Update imports in all story files
find /workspace -name "*.stories.ts" -exec sed -i 's/import React from '\''react'\'';/import React from '\''react'\'';\nimport type { Meta, StoryObj } from '\''@storybook\/react'\'';/' {} \;
```

## Quality Checklist

For each converted file:
- [ ] File renamed to .ts/.tsx
- [ ] Imports updated to CSF 3.0 format
- [ ] Default export uses Meta<typeof Component>
- [ ] All stories use Story = StoryObj<typeof Component>
- [ ] Args properly typed
- [ ] Render functions preserve functionality
- [ ] No TypeScript errors
- [ ] Stories render correctly in Storybook

## Timeline Estimate

- **Phase 1 (Complete TS)**: 2 hours
- **Phase 2 (JS Conversion)**: 15-20 hours
- **Phase 3 (Validation)**: 3-5 hours

**Total**: 20-27 hours

## Next Steps

1. Complete box.stories.tsx conversion
2. Create automation scripts for bulk conversion
3. Start with simple JS files batch conversion
4. Validate each batch before proceeding
5. Final validation and testing

## Benefits of Conversion

1. **Modern Storybook**: Latest CSF 3.0 features
2. **Better TypeScript**: Improved type safety
3. **Cleaner Code**: Object-based stories are more readable
4. **Future-proof**: Compatible with Storybook 7.x+
5. **Better DX**: Enhanced development experience
6. **Maintainability**: Easier to maintain and extend

## Risks and Mitigation

**Risk**: Breaking existing stories
**Mitigation**: Batch conversion with validation at each step

**Risk**: Type errors in complex components
**Mitigation**: Gradual conversion with thorough testing

**Risk**: Lost functionality
**Mitigation**: Careful preservation of render functions and interactions