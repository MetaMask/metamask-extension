import { getLabelKeys } from '../../../shared/lib/activity/label-keys';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import type { I18NSubstitution } from '../../../shared/lib/i18n';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../shared/constants/bridge';
import { shortenAddress } from '../../helpers/utils/util';
import { useI18nContext } from '../../hooks/useI18nContext';

type LabelSubstitutions = {
  description?: I18NSubstitution[];
  title?: I18NSubstitution[];
};

function getSubstitutions(activity: ActivityListItem): LabelSubstitutions {
  switch (activity.type) {
    // Token in title, sender in description
    case 'receive':
      return {
        title: [activity.data.token?.symbol ?? ''],
        description: [shortenAddress(activity.data.from)],
      };
    // Token in title, recipient in description
    case 'send':
      return {
        title: [activity.data.token?.symbol ?? ''],
        description: [shortenAddress(activity.data.to)],
      };
    // Source and destination in title
    case 'swap':
      return {
        title: [
          activity.data.sourceToken?.symbol ?? '',
          activity.data.destinationToken?.symbol ?? '',
        ],
      };
    case 'convert':
      return {
        title: [activity.data.destinationToken?.symbol ?? ''],
      };
    // Destination chain in title, source token in description
    case 'bridge': {
      const destChainId =
        activity.data.destinationToken?.assetId?.split('/')[0];
      const destChainName = destChainId
        ? NETWORK_TO_SHORT_NETWORK_NAME_MAP[
            destChainId as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
          ]
        : undefined;
      return {
        title: [destChainName ?? ''],
        description: [activity.data.sourceToken?.symbol ?? ''],
      };
    }
    // Source in title
    case 'swapIncomplete':
      return {
        title: [activity.data.sourceToken?.symbol ?? ''],
      };
    // Token in title, token in description
    case 'buy':
    case 'claim':
    case 'lendingDeposit':
      return {
        title: [activity.data.token?.symbol ?? ''],
        description: [activity.data.token?.symbol ?? ''],
      };
    case 'nftMint':
      return {
        title: [activity.data.token?.symbol ?? 'NFT'],
      };
    case 'contractInteraction':
      return {
        description: [shortenAddress(activity.data.to) || 'Contract'],
      };
    // Token in description
    case 'approveSpendingCap':
    case 'increaseSpendingCap':
    case 'revokeSpendingCap':
      return {
        description: [activity.data.token?.symbol ?? ''],
      };
    // No substitutions
    default:
      return {};
  }
}

export function useGetLabel(activity: ActivityListItem) {
  const t = useI18nContext();
  const labelKeys = getLabelKeys({
    type: activity.type,
    status: activity.status,
  });
  const substitutions = getSubstitutions(activity);

  if (activity.type === 'convert') {
    const sourceSymbol = activity.data.sourceToken?.symbol;
    const destinationSymbol = activity.data.destinationToken?.symbol;

    return {
      title: t(labelKeys.title.key, substitutions.title),
      description:
        sourceSymbol && destinationSymbol
          ? `${sourceSymbol} → ${destinationSymbol}`
          : t(labelKeys.description.key, substitutions.title),
    };
  }

  return {
    title: t(labelKeys.title.key, substitutions.title),
    description: t(labelKeys.description.key, substitutions.description),
  };
}
