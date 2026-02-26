import { TextColor } from '../../../../helpers/constants/design-system';

export const isValidAmount = (value: unknown): value is number =>
  typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value);

export const determineBalanceColor = (
  changeValue: number | undefined,
  privacyMode: boolean,
): TextColor => {
  if (privacyMode) {
    return TextColor.textAlternative;
  }

  const val = changeValue ?? 0;
  if (val > 0) {
    return TextColor.successDefault;
  }
  if (val < 0) {
    return TextColor.errorDefault;
  }
  return TextColor.textDefault;
};
