import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Box from '../box';
import {
  AlignItems,
  BackgroundColor,
  FLEX_DIRECTION,
  JustifyContent,
  Color,
  DISPLAY,
  TextVariant,
  Size,
  BorderColor,
  IconColor,
  TextAlign,
  BLOCK_SIZES,
} from '../../../helpers/constants/design-system';

import {
  ButtonIcon,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../component-library';

const defaultHeaderProps = {
  padding: [6, 4, 4],
  display: 'flex',
  flexDirection: FLEX_DIRECTION.COLUMN,
  backgroundColor: BackgroundColor.backgroundDefault,
  borderRadius: 'xl',
};

const defaultContentProps = {
  display: 'flex',
  flexDirection: FLEX_DIRECTION.COLUMN,
  justifyContent: JustifyContent.flexStart,
  alignItems: AlignItems.stretch,
  borderRadius: 'xl',
};

const defaultFooterProps = {
  display: 'flex',
  justifyContent: JustifyContent.spaceBetween,
  padding: [4, 6, 6],
};

/**
 * @deprecated The `<Popover>` component has been deprecated in favor of the new `<Modal>` component from the component-library.
 * Please update your code to use the new `<Modal>` component instead, which can be found at ui/components/component-library/modal/modal.tsx.
 * You can find documentation for the new Modal component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-modal--docs}
 * If you would like to help with the replacement of the old Modal component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-extension/issues/19555}
 */

const Popover = ({
  title,
  subtitle = '',
  children,
  footer,
  footerClassName,
  onBack,
  onClose,
  onScroll,
  className,
  contentClassName,
  showArrow,
  CustomBackground,
  popoverRef,
  showScrollDown,
  onScrollDownButtonClick,
  centerTitle,
  headerProps = defaultHeaderProps,
  contentProps = defaultContentProps,
  footerProps = defaultFooterProps,
}) => {
  const t = useI18nContext();
  const showHeader = title || onBack || subtitle || onClose;
  const Header = () => (
    <Box
      {...{ ...defaultHeaderProps, ...headerProps }}
      className="popover-header"
    >
      <Box
        display={DISPLAY.FLEX}
        alignItems={AlignItems.center}
        justifyContent={centerTitle ? null : JustifyContent.spaceBetween}
        className={classnames('popover-header__title', {
          'popover-header__title--center': centerTitle,
        })}
        marginBottom={2}
      >
        {onBack ? (
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            ariaLabel={t('back')}
            onClick={onBack}
            color={Color.iconDefault}
            size={Size.SM}
          />
        ) : null}
        <Text
          textAlign={centerTitle ? TextAlign.Center : TextAlign.Start}
          ellipsis
          variant={TextVariant.headingSm}
          as="h2"
          width={BLOCK_SIZES.FULL}
        >
          {title}
        </Text>
        {onClose ? (
          <ButtonIcon
            iconName={IconName.Close}
            ariaLabel={t('close')}
            data-testid="popover-close"
            onClick={onClose}
            size={Size.SM}
          />
        ) : null}
      </Box>
      {subtitle ? <Text variant={TextVariant.bodySm}>{subtitle}</Text> : null}
    </Box>
  );

  return (
    <div className="popover-container">
      {CustomBackground ? (
        <CustomBackground onClose={onClose} />
      ) : (
        <div className="popover-bg" onClick={onClose} />
      )}
      <section
        className={classnames('popover-wrap', className)}
        ref={popoverRef}
      >
        {showArrow ? <div className="popover-arrow" /> : null}
        {showHeader && <Header />}
        {children ? (
          <Box
            className={classnames('popover-content', contentClassName)}
            onScroll={onScroll}
            {...{ ...defaultContentProps, ...contentProps }}
          >
            {children}
          </Box>
        ) : null}
        {showScrollDown ? (
          <Box
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            borderColor={BorderColor.borderDefault}
            backgroundColor={BackgroundColor.backgroundDefault}
            color={Color.iconDefault}
            onClick={onScrollDownButtonClick}
            className="popover-scroll-button"
            style={{ bottom: footer ? '140px' : '12px' }}
            data-testid="popover-scroll-button"
          >
            <Icon
              name={IconName.ArrowDown}
              color={IconColor.primaryDefault}
              size={IconSize.Md}
              aria-label={t('scrollDown')}
            />
          </Box>
        ) : null}
        {footer ? (
          <Box
            className={classnames('popover-footer', footerClassName)}
            {...{ ...defaultFooterProps, ...footerProps }}
          >
            {footer}
          </Box>
        ) : null}
      </section>
    </div>
  );
};

Popover.propTypes = {
  /**
   * Show title of the popover
   */
  title: PropTypes.node,
  /**
   * Show subtitle label on popover
   */
  subtitle: PropTypes.string,
  /**
   * Show children content could be react child or text
   */
  children: PropTypes.node,
  /**
   * Show footer content could be react child or text
   */
  footer: PropTypes.node,
  /**
   * Add custom CSS class for footer
   */
  footerClassName: PropTypes.string,
  /**
   * onBack handler
   */
  onBack: PropTypes.func,
  /**
   * onClose handler
   */
  onClose: PropTypes.func,
  /**
   * onScroll handler
   */
  onScroll: PropTypes.func,
  CustomBackground: PropTypes.func,
  /**
   * Add custom CSS class for content
   */
  contentClassName: PropTypes.string,
  /**
   * Add custom CSS class
   */
  className: PropTypes.string,
  /**
   * Check if component would show arror
   */
  showArrow: PropTypes.bool,
  /**
   * The ref of the popover-wrap element
   */
  popoverRef: PropTypes.shape({
    current: PropTypes.instanceOf(window.Element),
  }),
  /**
   * Show title of the popover
   */
  showScrollDown: PropTypes.bool,
  /**
   * ScrollDown handler
   */
  onScrollDownButtonClick: PropTypes.func,
  /**
   * Check if use centered title
   */
  centerTitle: PropTypes.bool,
  /**
   * Box props for the header
   */
  headerProps: PropTypes.shape({ ...Box.propTypes }),
  /**
   * Box props for the content
   */
  contentProps: PropTypes.shape({ ...Box.propTypes }),
  /**
   * Box props for the footer
   */
  footerProps: PropTypes.shape({ ...Box.propTypes }),
};

/**
 * @deprecated The `<Popover>` component has been deprecated in favor of the new `<Modal>` component from the component-library.
 * Please update your code to use the new `<Modal>` component instead, which can be found at ui/components/component-library/modal/modal.tsx.
 * You can find documentation for the new Modal component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-modal--docs}
 * If you would like to help with the replacement of the old Modal component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-extension/issues/19555}
 */
export default class PopoverPortal extends PureComponent {
  static propTypes = Popover.propTypes;

  rootNode = document.getElementById('popover-content');

  instanceNode = document.createElement('div');

  componentDidMount() {
    if (!this.rootNode) {
      return;
    }

    this.rootNode.appendChild(this.instanceNode);
  }

  componentWillUnmount() {
    if (!this.rootNode) {
      return;
    }

    this.rootNode.removeChild(this.instanceNode);
  }

  render() {
    const children = <Popover {...this.props} />;
    return this.rootNode
      ? ReactDOM.createPortal(children, this.instanceNode)
      : children;
  }
}
