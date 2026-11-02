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

const COMPACT_ADDRESS_EDGE_LENGTH = 4;

type AssetPageHeaderProps = {
  /** Token name rendered as the header title. Falls back to the symbol. */
  name?: string;
  /** Token symbol shown under the name when it differs from the title. */
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
 * Compact contract address for the token details header.
 *
 * EVM addresses render as `0x..` plus the last four characters. Other
 * addresses render as the first and last four characters.
 *
 * @param address - Contract address to display
 * @returns The compact display form
 */
const formatCompactContractAddress = (address: string): string => {
  const formatted = address.trim();
  const tail = formatted.slice(-COMPACT_ADDRESS_EDGE_LENGTH);

  if (formatted.toLowerCase().startsWith('0x')) {
    return `0x..${tail}`;
  }

  if (formatted.length <= COMPACT_ADDRESS_EDGE_LENGTH * 2) {
    return formatted;
  }

  return `${formatted.slice(0, COMPACT_ADDRESS_EDGE_LENGTH)}..${tail}`;
};

/**
 * Ticker and compact contract address shown beneath the token name.
 *
 * The ticker uses the title color. The address stays muted and does not
 * shrink, so a long ticker ellipsizes instead of pushing the address away.
 *
 * @param props - Component props
 * @param props.ticker - Symbol shown when it differs from the token name
 * @param props.address - Contract address to display and copy
 * @returns The rendered subtitle
 */
const AssetPageHeaderSubtitle = ({
  ticker,
  address,
}: {
  ticker?: string;
  address?: string;
}) => {
  const t = useI18nContext();
  // useCopyToClipboard analysis: Copies a public token contract address
  const [copied, handleCopy] = useCopyToClipboard();

  return (
    <div
      className="flex w-full min-w-0 items-center gap-1"
      data-testid="asset-page-header-subtitle"
    >
      {ticker ? (
        <Text
          ellipsis
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextDefault}
          className="min-w-0 shrink"
          data-testid="asset-page-header-ticker"
        >
          {ticker}
        </Text>
      ) : null}
      {address ? (
        <button
          type="button"
          onClick={() => handleCopy(address)}
          aria-label={t('copyToClipboard')}
          className={classnames(
            'inline-flex shrink-0 items-center gap-1 rounded-full border-0 bg-transparent p-0',
            'hover:bg-hover active:bg-pressed',
          )}
          data-testid="asset-page-header-address"
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={
              copied ? TextColor.SuccessDefault : TextColor.TextAlternative
            }
          >
            {formatCompactContractAddress(address)}
          </Text>
          <Icon
            name={copied ? IconName.CopySuccess : IconName.Copy}
            size={IconSize.Xs}
            color={
              copied ? IconColor.SuccessDefault : IconColor.IconAlternative
            }
          />
        </button>
      ) : null}
    </div>
  );
};

/**
 * Subpage header for the asset (token details) page. Holds the back button, the
 * token identity (avatar with network badge, name, ticker, badges, and
 * contract address for non-native assets), and the asset options overflow menu.
 *
 * @param props - Component props
 * @param props.name - Token name rendered as the title
 * @param props.symbol - Token symbol shown under the name when it differs
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
  name,
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
  const tokenName = name?.trim() || symbol;
  const showTickerBelowName = Boolean(
    symbol && tokenName && symbol !== tokenName,
  );

  const avatar = useMemo(
    () => (
      <BadgeWrapper
        badge={<BadgeNetwork name={networkName} src={networkImage} />}
      >
        <AvatarToken
          name={tokenName}
          src={image}
          size={AvatarTokenSize.Md}
          data-testid="asset-page-header-avatar"
        />
      </BadgeWrapper>
    ),
    [image, networkImage, networkName, tokenName],
  );

  const subtitle =
    showTickerBelowName || contractAddress ? (
      <AssetPageHeaderSubtitle
        ticker={showTickerBelowName ? symbol : undefined}
        address={contractAddress}
      />
    ) : undefined;

  return (
    <HeaderSubpage
      avatar={avatar}
      title={tokenName}
      titleProps={{ 'data-testid': 'asset-name' }}
      titleEndAccessory={titleEndAccessory}
      description={subtitle}
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
