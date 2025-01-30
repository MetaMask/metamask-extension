declare namespace React {
  /* eslint-disable-next-line import/no-extraneous-dependencies */
  import * as CSS from 'csstype';

  // Add custom CSS properties so that they can be used in `style` props
  // This interface was created before this ESLint rule was added.
  // Convert to a `type` in a future major version.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  export interface CSSProperties extends CSS.Properties<string | number> {
    '--progress'?: string;
  }
}
