import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

export enum ContainerMaxWidth {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

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

export type ContainerProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, ContainerStyleUtilityProps>;

export type ContainerComponent = <C extends React.ElementType = 'div'>(
  props: ContainerProps<C>,
) => React.ReactElement | null;
