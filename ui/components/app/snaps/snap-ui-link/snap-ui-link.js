import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Display } from '../../../../helpers/constants/design-system';
import {
  ButtonLink,
  ButtonLinkSize,
  Icon,
  IconName,
  IconSize,
} from '../../../component-library';
import SnapLinkWarning from '../snap-link-warning';
import useSnapNavigation from '../../../../hooks/snaps/useSnapNavigation';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import { getHideSnapBranding } from '../../../../selectors';

export const SnapUILink = ({ href, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const isMetaMaskUrl = href.startsWith('metamask:');
  const { navigate } = useSnapNavigation();

  const { snapId } = useSnapInterfaceContext();
  const hideSnapBranding = useSelector((state) =>
    getHideSnapBranding(state, snapId),
  );

  const handleMetaMaskLinkClick = () => {
    navigate(href);
  };

  const handleLinkClick = () => {
    setIsOpen(true);
  };

  const handleModalClose = () => {
    setIsOpen(false);
  };

  if (isMetaMaskUrl) {
    return (
      <ButtonLink
        as="a"
        size={ButtonLinkSize.Inherit}
        className="snap-ui-renderer__link"
        onClick={handleMetaMaskLinkClick}
      >
        {children}
      </ButtonLink>
    );
  }

  // hideSnapBranding disables the modal and allows direct external links.
  if (hideSnapBranding) {
    return (
      <ButtonLink
        as="a"
        href={href}
        externalLink
        size={ButtonLinkSize.Inherit}
        display={Display.Inline}
        className="snap-ui-renderer__link"
        style={{
          // Prevents the link from taking up the full width of the parent.
          width: 'fit-content',
        }}
        textProps={{
          display: Display.Inline,
        }}
      >
        {children}
        <Icon name={IconName.Export} size={IconSize.Inherit} marginLeft={1} />
      </ButtonLink>
    );
  }

  return (
    <>
      <SnapLinkWarning isOpen={isOpen} onClose={handleModalClose} url={href} />
      <ButtonLink
        as="a"
        onClick={handleLinkClick}
        externalLink
        size={ButtonLinkSize.Inherit}
        display={Display.Inline}
        className="snap-ui-renderer__link"
        style={{
          // Prevents the link from taking up the full width of the parent.
          width: 'fit-content',
        }}
        textProps={{
          display: Display.Inline,
        }}
      >
        {children}
        <Icon name={IconName.Export} size={IconSize.Inherit} marginLeft={1} />
      </ButtonLink>
    </>
  );
};

SnapUILink.propTypes = {
  children: PropTypes.string,
  href: PropTypes.string,
};
