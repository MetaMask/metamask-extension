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
  }

  export type HTMLAttributes<Tag> = {
    popover?: 'auto' | 'manual' | 'hint' | boolean;
    interestfor?: string;
    commandfor?: string;
    command?: string;
  };
}
