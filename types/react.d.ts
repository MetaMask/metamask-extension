declare namespace React {
  /* eslint-disable-next-line import/no-extraneous-dependencies */
  import * as CSS from 'csstype';

  // Add custom CSS properties so that they can be used in `style` props
  export interface CSSProperties extends CSS.Properties<string | number> {
    '--progress'?: string;
  }
}
