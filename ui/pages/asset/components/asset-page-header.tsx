import React, { useMemo } from 'react';
import classnames from 'clsx';
import {
  AvatarToken,
  AvatarTokenSize,
  BadgeNetwork,
  BadgeWrapper,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
  HeaderSubpage,
} from '@metamask/design-system-react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { shortenAddress } from '../../../helpers/utils/util';

type AssetPageHeaderProps = {
  /** Token symbol rendered as the header title. */
  symbol: string;
  /** Token image used for the avatar. */
  image?: string;
  /** Network image used for the avatar badge. */
  networkImage?: string;
  /** Network name, used as the badge fallback and accessible name. */
  networkName?: string;
  /** Contract address rendered with a copy control. Omitted for native assets. */
  contractAddress?: string;
  /** Badges rendered next to the title, such as the verified security badge. */
  titleEndAccessory?: React.ReactNode;
  /** The asset options overflow menu. */
  endAccessory?: React.ReactNode;
  /** Navigates away from the asset page. */
  onBack: () => void;
};

/**
 * Truncated contract address with an inline copy control, shown beneath the
 * token symbol for non-native assets.
 *
 * @param props - Component props
 * @param props.address - The contract address to display and copy
 * @returns The rendered copy control
 */
const AssetPageHeaderAddress = ({ address }: { address: string }) => {
  const t = useI18nContext();
  // useCopyToClipboard analysis: Copies a public token contract address
  const [copied, handleCopy] = useCopyToClipboard();

  return (
    <button
      type="button"
      onClick={() => handleCopy(address)}
      aria-label={t('copyToClipboard')}
      className={classnames(
        'inline-flex min-w-0 items-center gap-1 rounded-full border-0 bg-transparent p-0',
        'hover:bg-hover active:bg-pressed',
      )}
      data-testid="asset-page-header-address"
    >
      <Text
        ellipsis
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={copied ? TextColor.SuccessDefault : TextColor.TextAlternative}
      >
        {shortenAddress(address)}
      </Text>
      <Icon
        name={copied ? IconName.CopySuccess : IconName.Copy}
        size={IconSize.Xs}
        color={copied ? IconColor.SuccessDefault : IconColor.IconAlternative}
      />
    </button>
  );
};

/**
 * Subpage header for the asset (token details) page. Holds the back button, the
 * token identity (avatar with network badge, symbol, badges, and contract
 * address for non-native assets), and the asset options overflow menu.
 *
 * @param props - Component props
 * @param props.symbol - Token symbol rendered as the title
 * @param props.image - Token image used for the avatar
 * @param props.networkImage - Network image used for the avatar badge
 * @param props.networkName - Network name for the badge fallback
 * @param props.contractAddress - Contract address rendered with a copy control
 * @param props.titleEndAccessory - Badges rendered next to the title
 * @param props.endAccessory - The asset options overflow menu
 * @param props.onBack - Navigates away from the asset page
 * @returns The rendered asset page header
 */
export const AssetPageHeader = ({
  symbol,
  image,
  networkImage,
  networkName,
  contractAddress,
  titleEndAccessory,
  endAccessory,
  onBack,
}: AssetPageHeaderProps) => {
  const t = useI18nContext();

  const avatar = useMemo(
    () => (
      <BadgeWrapper
        badge={<BadgeNetwork name={networkName} src={networkImage} />}
      >
        <AvatarToken
          name={symbol}
          src={image}
          size={AvatarTokenSize.Md}
          data-testid="asset-page-header-avatar"
        />
      </BadgeWrapper>
    ),
    [image, networkImage, networkName, symbol],
  );

  return (
    <HeaderSubpage
      avatar={avatar}
      title={symbol}
      titleProps={{ 'data-testid': 'asset-name' }}
      titleEndAccessory={titleEndAccessory}
      description={
        contractAddress ? (
          <AssetPageHeaderAddress address={contractAddress} />
        ) : undefined
      }
      onBack={onBack}
      backButtonProps={{
        ariaLabel: t('back'),
        'data-testid': 'asset-page-back-button',
      }}
      endAccessory={endAccessory}
      className="sticky top-0 z-10 bg-background-default"
      data-testid="asset-page-header"
    />
  );
};
