import React from 'react';
import classnames from 'clsx';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  FlexWrap,
} from '../../../helpers/constants/design-system';
import { type PolymorphicRef, type BoxProps, Box } from '../box';
import { Button, ButtonSize, ButtonVariant, type ButtonProps } from '../button';
import { Container, ContainerMaxWidth } from '../container';
import { ModalFooterProps, ModalFooterComponent } from './modal-footer.types';

/**
 * @deprecated This component is deprecated and will be removed in a future release.
 * Please use the ModalFooter component from @metamask/design-system-react instead.
 * @see {@link https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#modalfooter-component | Migration Guide}
 * @see {@link https://metamask.github.io/metamask-design-system/?path=/docs/react-components-modalfooter--docs | Storybook Documentation}
 * @see {@link https://github.com/MetaMask/metamask-design-system/tree/main/packages/design-system-react/src/components/ModalFooter | Component Source}
 */
export const ModalFooter: ModalFooterComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'footer'>(
    {
      className = '',
      children,
      submitButtonProps,
      onSubmit,
      cancelButtonProps,
      onCancel,
      containerProps,
      ...props
    }: ModalFooterProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const t = useI18nContext();
    return (
      <Box
        className={classnames('mm-modal-footer', className)}
        ref={ref}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
        {...(props as BoxProps<C>)}
      >
        {children}
        <Container
          maxWidth={ContainerMaxWidth.Sm}
          display={Display.Flex}
          alignItems={AlignItems.center}
          flexWrap={FlexWrap.Wrap}
          marginLeft="auto"
          marginRight="auto"
          gap={4}
          {...containerProps}
        >
          {onCancel && (
            <Button
              onClick={onCancel}
              children={t('cancel')}
              variant={ButtonVariant.Secondary}
              {...(cancelButtonProps as ButtonProps<'button'>)}
              size={ButtonSize.Lg} // TODO: There is a type issue with using variant, size and spreading props after size
              className={classnames(
                'mm-modal-footer__button',
                cancelButtonProps?.className || '',
              )}
            />
          )}
          {onSubmit && (
            <Button
              size={ButtonSize.Lg}
              onClick={onSubmit}
              children={t('confirm')}
              {...submitButtonProps}
              className={classnames(
                'mm-modal-footer__button',
                submitButtonProps?.className || '',
              )}
            />
          )}
        </Container>
      </Box>
    );
  },
);

export default ModalFooter;
