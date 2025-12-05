---
description: General Coding Guidelines for MetaMask Extension
alwaysApply: true
---

Reference: [MetaMask Coding Guidelines](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/CODING_GUIDELINES.md)

# MetaMask Extension - General Coding Guidelines

## TypeScript

### Use TypeScript for All New Code
- **ALWAYS write new components and utilities in TypeScript**
- Enforce proper typing (avoid `any` unless absolutely necessary)
- Refactor existing JavaScript to TypeScript when time allows
- If replacing a component, use TypeScript

Reference: [MetaMask TypeScript Guidelines](https://github.com/MetaMask/contributor-docs/blob/main/docs/typescript.md)

### TypeScript Best Practices
- Define explicit types for function parameters and return values
- Use interfaces for object shapes
- Use type aliases for complex types
- Leverage union types and discriminated unions
- Use `unknown` instead of `any` when type is truly unknown

Example:
```typescript
✅ CORRECT:
interface Token {
  address: string;
  symbol: string;
  decimals: number;
}

function addToken(token: Token): void {
  // Implementation
}

const tokens: Token[] = [];

❌ WRONG:
function addToken(token: any) { // No return type, uses any
  // Implementation
}

const tokens = []; // No type annotation
```

## React Components

### Use Functional Components and Hooks
- **ALWAYS use functional components instead of class components**
- Use hooks for state management and side effects
- Functional components are more concise and readable

Example:
```tsx
✅ CORRECT: Functional component with hooks
import React, { useState, useEffect } from 'react';

const TokenList = ({ initialTokens }: TokenListProps) => {
  const [tokens, setTokens] = useState<Token[]>(initialTokens);

  useEffect(() => {
    fetchTokens().then(setTokens);
  }, []);

  return (
    <div>
      {tokens.map(token => <TokenItem key={token.address} token={token} />)}
    </div>
  );
};

❌ WRONG: Class component
class TokenList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { tokens: props.initialTokens };
  }

  componentDidMount() {
    fetchTokens().then(tokens => this.setState({ tokens }));
  }

  render() {
    return (
      <div>
        {this.state.tokens.map(token => (
          <TokenItem key={token.address} token={token} />
        ))}
      </div>
    );
  }
}
```

### Component Optimization

#### Break Down Large Components
- Avoid large return statements
- Break components into smaller, focused sub-components
- Each component should have a single responsibility

Example:
```tsx
❌ WRONG: Large monolithic component
const Dashboard = () => {
  return (
    <div>
      <header>
        <div className="logo">...</div>
        <nav>...</nav>
        <div className="user-menu">...</div>
      </header>
      <main>
        <div className="sidebar">...</div>
        <div className="content">
          <div className="stats">...</div>
          <div className="charts">...</div>
          <div className="transactions">...</div>
        </div>
      </main>
    </div>
  );
};

✅ CORRECT: Broken into sub-components
const Dashboard = () => {
  return (
    <div>
      <DashboardHeader />
      <DashboardMain />
    </div>
  );
};

const DashboardHeader = () => (
  <header>
    <Logo />
    <Navigation />
    <UserMenu />
  </header>
);

const DashboardMain = () => (
  <main>
    <Sidebar />
    <DashboardContent />
  </main>
);

const DashboardContent = () => (
  <div className="content">
    <Stats />
    <Charts />
    <TransactionList />
  </div>
);
```

#### Use Memoization Techniques
- Use `useMemo` for expensive computed values
- Use `useCallback` for function references passed to child components
- Follow React's recommended guidance on optimization
- Don't over-optimize - profile first

Example:
```tsx
✅ CORRECT: Using memoization
import React, { useMemo, useCallback } from 'react';

const TokenList = ({ tokens, onTokenClick }: TokenListProps) => {
  // Memoize expensive computation
  const sortedTokens = useMemo(() => {
    return [...tokens].sort((a, b) =>
      b.balance.localeCompare(a.balance)
    );
  }, [tokens]);

  // Memoize callback to prevent child re-renders
  const handleTokenClick = useCallback(
    (token: Token) => {
      onTokenClick(token.address);
    },
    [onTokenClick],
  );

  return (
    <div>
      {sortedTokens.map(token => (
        <TokenItem
          key={token.address}
          token={token}
          onClick={handleTokenClick}
        />
      ))}
    </div>
  );
};

❌ WRONG: No memoization, causing unnecessary re-renders
const TokenList = ({ tokens, onTokenClick }: TokenListProps) => {
  // Recalculated on every render
  const sortedTokens = [...tokens].sort((a, b) =>
    b.balance.localeCompare(a.balance)
  );

  // New function created on every render
  const handleTokenClick = (token: Token) => {
    onTokenClick(token.address);
  };

  return (
    <div>
      {sortedTokens.map(token => (
        <TokenItem
          key={token.address}
          token={token}
          onClick={handleTokenClick} // Causes TokenItem to re-render
        />
      ))}
    </div>
  );
};
```

#### Use useEffect Judiciously
- Use `useEffect` for side effects (data fetching, DOM manipulation, subscriptions)
- Don't overuse effects - many things don't need effects
- Consider if the operation should happen during render instead
- Always clean up side effects

Reference: [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

Example:
```tsx
✅ CORRECT: Appropriate useEffect usage
const TokenBalance = ({ address }: TokenBalanceProps) => {
  const [balance, setBalance] = useState<string>('0');

  useEffect(() => {
    let cancelled = false;

    fetchBalance(address).then(newBalance => {
      if (!cancelled) {
        setBalance(newBalance);
      }
    });

    // Cleanup function
    return () => {
      cancelled = true;
    };
  }, [address]);

  return <div>{balance}</div>;
};

❌ WRONG: Unnecessary effect
const TokenDisplay = ({ token }: TokenDisplayProps) => {
  const [displayName, setDisplayName] = useState('');

  // This doesn't need an effect!
  useEffect(() => {
    setDisplayName(`${token.symbol} (${token.name})`);
  }, [token]);

  return <div>{displayName}</div>;
};

✅ CORRECT: Compute during render
const TokenDisplay = ({ token }: TokenDisplayProps) => {
  const displayName = `${token.symbol} (${token.name})`;
  return <div>{displayName}</div>;
};
```

### Use Object Destructuring for Props
- **ALWAYS destructure props in function parameters**
- Improves readability and avoids repetitive `props.` references
- Makes it clear what props the component uses

Example:
```tsx
✅ CORRECT:
interface MyComponentProps {
  id: string;
  title: string;
  onClose: () => void;
}

const MyComponent = ({ id, title, onClose }: MyComponentProps) => {
  return (
    <div id={id}>
      <h1>{title}</h1>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

❌ WRONG:
const MyComponent = (props: MyComponentProps) => {
  return (
    <div id={props.id}>
      <h1>{props.title}</h1>
      <button onClick={props.onClose}>Close</button>
    </div>
  );
};
```

## File Organization

### Organize Related Files in One Folder
- Group all files related to a component in a single directory
- Follow consistent structure across components
- Use index.ts for clean imports

Standard component structure:
```
component-name/
├── component-name.tsx          # Main component file
├── component-name.types.ts     # TypeScript types/interfaces
├── component-name.test.tsx     # Unit tests
├── component-name.stories.tsx  # Storybook stories
├── component-name.scss         # Component styles
├── __snapshots__/              # Jest snapshots
│   └── component-name.test.tsx.snap
├── README.md                   # Component documentation
└── index.ts                    # Public exports
```

Example index.ts:
```typescript
export { ComponentName } from './component-name';
export type { ComponentNameProps } from './component-name.types';
```

## Naming Conventions

### Component Names
- **ALWAYS use PascalCase for components**
- Names should be descriptive and specific
- Avoid generic names like `Component` or `Container`

Examples:
```typescript
✅ CORRECT:
TextField
NavMenu
SuccessButton
TokenListItem
AccountAvatar

❌ WRONG:
textfield
nav_menu
success-button
component
Container
```

### Function Names
- **Use camelCase for functions declared inside components**
- Use descriptive action verbs
- Handlers should start with `handle`

Examples:
```typescript
✅ CORRECT:
const handleInputChange = () => { };
const handleSubmit = () => { };
const showElement = () => { };
const validateForm = () => { };
const fetchUserData = () => { };

❌ WRONG:
const HandleInput = () => { };
const submit = () => { };
const show_element = () => { };
const validate = () => { };
```

### Hook Names
- **Use `use` prefix for custom hooks**
- Name should describe what the hook does

Examples:
```typescript
✅ CORRECT:
const useTokenBalance = () => { };
const useAccountData = () => { };
const useDebounce = () => { };
const useLocalStorage = () => { };

❌ WRONG:
const tokenBalance = () => { };
const withAccountData = () => { };
const getDebounce = () => { };
```

### Higher-Order Component Names
- **Use `with` prefix for HOCs**
- Describe the functionality being added

Examples:
```typescript
✅ CORRECT:
const withAuth = (Component) => { };
const withLoading = (Component) => { };
const withErrorBoundary = (Component) => { };

❌ WRONG:
const authHOC = (Component) => { };
const loading = (Component) => { };
```

## Code Reusability

### Avoid Repetitive Code (DRY Principle)
- **If writing duplicated code, extract into reusable utilities**
- Create shared components for repeated UI patterns
- Create custom hooks for repeated logic
- Use "scalable intention" - abstract when it makes sense

Reference: [The Wrong Abstraction](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction)

Example:
```tsx
❌ WRONG: Duplicated code
const TokenA = () => {
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchBalance(addressA)
      .then(setBalance)
      .finally(() => setLoading(false));
  }, []);

  return <div>{loading ? 'Loading...' : balance}</div>;
};

const TokenB = () => {
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchBalance(addressB)
      .then(setBalance)
      .finally(() => setLoading(false));
  }, []);

  return <div>{loading ? 'Loading...' : balance}</div>;
};

✅ CORRECT: Extracted into custom hook
const useTokenBalance = (address: string) => {
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchBalance(address)
      .then(setBalance)
      .finally(() => setLoading(false));
  }, [address]);

  return { balance, loading };
};

const TokenA = () => {
  const { balance, loading } = useTokenBalance(addressA);
  return <div>{loading ? 'Loading...' : balance}</div>;
};

const TokenB = () => {
  const { balance, loading } = useTokenBalance(addressB);
  return <div>{loading ? 'Loading...' : balance}</div>;
};
```

## Documentation

### Document Components
- **Add documentation for all public components**
- Include props descriptions
- Include usage examples
- Document any non-obvious behavior

Example component README:
```markdown
# TokenListItem

Displays a single token in a list with its symbol, name, and balance.

## Props

- `token` (Token): The token object to display
- `onClick` (function): Callback when the item is clicked
- `isSelected` (boolean): Whether this token is currently selected

## Usage

\`\`\`tsx
<TokenListItem
  token={{ symbol: 'DAI', name: 'Dai Stablecoin', balance: '100' }}
  onClick={(token) => console.log(token)}
  isSelected={false}
/>
\`\`\`
```

### Document Utilities with TSDoc
- **Use TSDoc format for all utility functions**
- Document parameters, return values, and exceptions
- Include examples for complex functions
- Add links to relevant resources

Example:
```typescript
/**
 * Formats a token balance for display, handling decimals and large numbers.
 *
 * @param balance - The raw token balance as a string
 * @param decimals - Number of decimal places for the token
 * @param options - Formatting options
 * @returns Formatted balance string suitable for display
 *
 * @example
 * ```typescript
 * formatBalance('1000000000000000000', 18)
 * // Returns: '1.00'
 *
 * formatBalance('123456789', 6, { maximumFractionDigits: 4 })
 * // Returns: '123.4567'
 * ```
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
 */
export function formatBalance(
  balance: string,
  decimals: number,
  options?: FormatOptions,
): string {
  // Implementation
}
```

## Testing

### Write Tests for All Components and Utilities
- **ALWAYS write tests for new code**
- Tests reduce possibilities of errors and regressions
- Ensure components behave as expected
- Use Jest as the testing framework

Reference: [MetaMask Unit Testing Guidelines](https://github.com/MetaMask/contributor-docs/blob/main/docs/unit-testing.md)

Example:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TokenListItem } from './token-list-item';

describe('TokenListItem', () => {
  const mockToken = {
    address: '0x123',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    balance: '100',
  };

  describe('rendering', () => {
    it('displays token symbol and name', () => {
      render(<TokenListItem token={mockToken} />);

      expect(screen.getByText('DAI')).toBeInTheDocument();
      expect(screen.getByText('Dai Stablecoin')).toBeInTheDocument();
    });

    it('displays token balance', () => {
      render(<TokenListItem token={mockToken} />);

      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<TokenListItem token={mockToken} onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledWith(mockToken);
    });
  });
});
```

## External Packages

### Use Well-Maintained Packages Only
- **Only add packages if functionality doesn't exist and can't be easily implemented**
- Before adding a package, check if a small utility function would suffice
- Use [Snyk Advisor](https://snyk.io/advisor/) to assess:
  - Popularity and adoption
  - Maintenance status
  - Security analysis
  - License compatibility
- Package must be in good standing to be added

### Evaluation Checklist
Before adding a package:
- [ ] Functionality can't be implemented with a small utility
- [ ] Package is actively maintained (recent updates)
- [ ] Package has good security score on Snyk
- [ ] Package has reasonable bundle size
- [ ] Package has TypeScript support (types included or available)
- [ ] Package has good documentation
- [ ] Package license is compatible with project

### Update Dependencies
- **Update dependencies when you notice they are out of date**
- Check for security vulnerabilities regularly
- Test thoroughly after updates
- Update incrementally rather than in large batches

## Code Style

### General Guidelines
- Use consistent formatting (Prettier handles this)
- Follow ESLint rules configured in the project
- Keep functions small and focused
- Avoid deep nesting (max 3-4 levels)
- Use early returns to reduce nesting
- Add comments for complex logic only
- Remove commented-out code
- Remove console.logs before committing

### Early Returns
Example:
```typescript
❌ WRONG: Deep nesting
function processToken(token: Token | null) {
  if (token) {
    if (token.balance) {
      if (token.balance > 0) {
        return formatBalance(token.balance);
      } else {
        return '0';
      }
    } else {
      return 'Unknown';
    }
  } else {
    return null;
  }
}

✅ CORRECT: Early returns
function processToken(token: Token | null): string | null {
  if (!token) {
    return null;
  }

  if (!token.balance) {
    return 'Unknown';
  }

  if (token.balance <= 0) {
    return '0';
  }

  return formatBalance(token.balance);
}
```

## Checklist for New Code

Before submitting a PR, ensure:

### TypeScript
- [ ] New code is written in TypeScript
- [ ] Types are explicitly defined (no implicit any)
- [ ] Interfaces/types are properly documented

### React Components
- [ ] Functional components used (not classes)
- [ ] Hooks used appropriately
- [ ] Props are destructured
- [ ] Component is broken into smaller sub-components if needed
- [ ] Memoization used where appropriate (but not over-optimized)
- [ ] useEffect used judiciously with proper cleanup

### File Organization
- [ ] Files organized in component-specific folders
- [ ] Follows standard structure (component, types, tests, styles)
- [ ] index.ts exports public API

### Naming
- [ ] Components use PascalCase
- [ ] Functions use camelCase
- [ ] Hooks use `use` prefix
- [ ] HOCs use `with` prefix
- [ ] Names are descriptive and meaningful

### Code Quality
- [ ] No duplicated code
- [ ] Reusable utilities/components extracted
- [ ] Code is readable and maintainable
- [ ] Early returns used to reduce nesting
- [ ] No console.logs or commented code

### Documentation
- [ ] Component has README with props and examples
- [ ] Utility functions have TSDoc comments
- [ ] Complex logic has explanatory comments

### Testing
- [ ] Unit tests written for components
- [ ] Unit tests written for utilities
- [ ] Tests follow naming conventions
- [ ] Tests cover happy paths and error cases

### Dependencies
- [ ] No new dependencies added without justification
- [ ] New dependencies evaluated with Snyk Advisor
- [ ] Dependencies are up to date

### Linting & Formatting
- [ ] Code passes ESLint checks
- [ ] Code is formatted with Prettier
- [ ] No TypeScript errors
- [ ] All imports are used

## References

- [MetaMask Coding Guidelines](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/CODING_GUIDELINES.md)
- [MetaMask TypeScript Guidelines](https://github.com/MetaMask/contributor-docs/blob/main/docs/typescript.md)
- [MetaMask Unit Testing Guidelines](https://github.com/MetaMask/contributor-docs/blob/main/docs/unit-testing.md)
- [React Documentation](https://react.dev/)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [TSDoc](https://tsdoc.org/)
