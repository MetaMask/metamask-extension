import {
  TextVariant,
  OverflowWrap,
  TextColor,
  Display,
} from '../../../../helpers/constants/design-system';
import {
  ButtonLink,
  ButtonLinkSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import SnapLinkWarning from '../snap-link-warning';

export const SnapUILink = ({ href, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLinkClick = () => {
    setIsOpen(true);
  };

  const handleModalClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <SnapLinkWarning
        isOpen={isOpen}
        onClose={handleModalClose}
        url={href}
      />
      <ButtonLink
        as="a"
        onClick={handleLinkClick}
        externalLink
        size={ButtonLinkSize.Inherit}
        display={Display.Inline}
        className="snap-ui-link"
      >
        {children}
        <Icon name={IconName.Export} size={IconSize.Inherit} marginLeft={1} />
      </ButtonLink>
    </>
  );
};
