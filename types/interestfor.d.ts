declare module 'interestfor';

declare global {
  // Declaration merging requires interface, not type
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface HTMLButtonElement {
    interestForElement?: unknown;
  }
}
