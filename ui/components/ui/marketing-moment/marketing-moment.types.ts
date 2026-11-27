import type { ReactNode, Ref } from 'react';
import type {
  BoxProps,
  ButtonProps,
  TextProps,
} from '@metamask/design-system-react';

/**
 * A pinned action on a marketing moment. Everything except `label` is spread
 * onto the design-system `Button`.
 */
export type MarketingMomentAction = Omit<
  ButtonProps,
  'variant' | 'children' | 'ref'
> & {
  /**
   * Button label. Callers pass already-localized copy.
   */
  label: ReactNode;
  /**
   * Test id forwarded to the button. Declared explicitly because `Omit` on
   * the design-system button union drops DOM data attributes.
   */
  'data-testid'?: string;
};

/**
 * Full-screen marketing moment: title and description at the top, flexible
 * artwork, and a primary action with a tertiary dismiss action pinned to the
 * bottom.
 */
export type MarketingMomentProps = {
  /**
   * Page heading. Strings render in the hero title. Any other node replaces it.
   */
  title?: ReactNode;
  /**
   * Props spread onto `MarketingMomentTitle` when `title` is a string.
   * The template sets `w-full text-center`. `className` is merged after that.
   */
  titleProps?: Partial<TextProps>;
  /**
   * Supporting copy under the title. Strings render in the body `Text`. Any
   * other node replaces it.
   */
  description?: ReactNode;
  /**
   * Props spread onto the body `Text` when `description` is a string.
   */
  descriptionProps?: Partial<TextProps>;
  /**
   * Optional content under the description, such as tags or attribution.
   */
  children?: ReactNode;
  /**
   * Product artwork. It fills the space between the copy and the actions.
   */
  artwork?: ReactNode;
  /**
   * Props spread onto the box that sizes `artwork`. Defaults to centered.
   * `className` is merged onto the box layout classes. `ref` stays on `Box`.
   */
  artworkWrapperProps?: Omit<BoxProps, 'children' | 'ref'>;
  /**
   * Recommended action.
   */
  primaryAction?: MarketingMomentAction;
  /**
   * Ref forwarded to the primary button. Use this when a parent dialog needs
   * to place initial focus on that button.
   */
  primaryActionRef?: Ref<HTMLButtonElement>;
  /**
   * Dismiss action, rendered as a tertiary button.
   */
  secondaryAction?: MarketingMomentAction;
  /**
   * Additional classes for the root. Merged after the layout classes.
   */
  className?: string;
  /**
   * Optional test id for the root.
   */
  'data-testid'?: string;
};
