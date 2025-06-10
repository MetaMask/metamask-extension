import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

export enum ContainerMaxWidth {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface ContainerStyleUtilityProps extends StyleUtilityProps {
  /*
   * Additional classNames to be added to the Container component
   */
  className?: string;
  /**
   * maxWidth prop sets the max-width of the Container component
   * Sm (360px)
   * Md (480px)
   * Lg (720px)
   */
  maxWidth?: ContainerMaxWidth;
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type ContainerProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, ContainerStyleUtilityProps>;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type ContainerComponent = <C extends React.ElementType = 'div'>(
  props: ContainerProps<C>,
) => React.ReactElement | null;
