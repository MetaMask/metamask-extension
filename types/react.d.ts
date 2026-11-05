declare namespace React {
  import * as CSS from 'csstype';

  // Add custom CSS properties so that they can be used in `style` props
  // This interface was created before this ESLint rule was added.
  // Convert to a `type` in a future major version.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  export interface CSSProperties extends CSS.Properties<string | number> {
    '--progress'?: string;
    anchorName?: string;
    positionAnchor?: string;
    positionTryFallbacks?: string;
  }

  // Augment the existing interface so popover / invoker attributes merge with
  // the rest of React's DOM typings instead of replacing them.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  export interface HTMLAttributes<Target> {
    popover?: 'auto' | 'manual' | 'hint' | boolean;
    interestfor?: string;
    commandfor?: string;
    command?: string;
  }
}
