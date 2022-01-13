import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useI18nContext } from '../../../hooks/useI18nContext';

const Popover = ({
  title,
  subtitle = '',
  children,
  footer,
  footerClassName,
  onBack,
  onClose,
  className,
  contentClassName,
  showArrow,
  CustomBackground,
  popoverRef,
  centerTitle,
}) => {
  const t = useI18nContext();
  const showHeader = title || onBack || subtitle || onClose;
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
        {showHeader && (
          <header className="popover-header">
            <div
              className={classnames(
                'popover-header__title',
                centerTitle ? 'center' : '',
              )}
            >
              <h2 title="popover">
                {onBack ? (
                  <button
                    className="fas fa-chevron-left popover-header__button"
                    title={t('back')}
                    onClick={onBack}
                  />
                ) : null}
                {title}
              </h2>
              {onClose ? (
                <button
                  className="fas fa-times popover-header__button"
                  title={t('close')}
                  data-testid="popover-close"
                  onClick={onClose}
                />
              ) : null}
            </div>
            {subtitle ? (
              <p className="popover-header__subtitle">{subtitle}</p>
            ) : null}
          </header>
        )}
        {children ? (
          <div className={classnames('popover-content', contentClassName)}>
            {children}
          </div>
        ) : null}
        {footer ? (
          <footer className={classnames('popover-footer', footerClassName)}>
            {footer}
          </footer>
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
   * Check if use centered title
   */
  centerTitle: PropTypes.bool,
};

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
