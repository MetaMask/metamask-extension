import { getLabelKeys } from '../../../shared/lib/activity/label-keys';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import type { I18NSubstitution } from '../../../shared/lib/i18n';
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
        description: [shortenAddress(activity.data.to ?? '')],
      };
    // Token in description
    case 'approveSpendingCap':
    case 'increaseSpendingCap':
    case 'revokeSpendingCap':
      return {
        description: [activity.data.tokenSymbol ?? ''],
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

  return {
    title: t(labelKeys.title.key, substitutions.title),
    description: t(labelKeys.description.key, substitutions.description),
  };
}
