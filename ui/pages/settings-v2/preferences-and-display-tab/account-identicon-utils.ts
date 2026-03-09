import { AvatarAccountVariant } from '@metamask/design-system-react';

// Avatar variants with their corresponding translation keys.
export const AVATAR_OPTIONS: {
  value: AvatarAccountVariant;
  labelKey: string;
}[] = [
  { value: AvatarAccountVariant.Maskicon, labelKey: 'maskicons' },
  { value: AvatarAccountVariant.Jazzicon, labelKey: 'jazzicons' },
  { value: AvatarAccountVariant.Blockies, labelKey: 'blockies' },
];

// Map of avatar variants to their translation keys.
export const AVATAR_LABEL_MAP: Record<AvatarAccountVariant, string> =
  Object.fromEntries(
    AVATAR_OPTIONS.map(({ value, labelKey }) => [value, labelKey]),
  ) as Record<AvatarAccountVariant, string>;

/**
 * Resolves the current avatar variant from preferences.
 * Handles legacy `useBlockie` fallback for backwards compatibility.
 *
 * @param avatarType - The avatarType preference value
 * @param useBlockie - The legacy useBlockie preference value
 * @returns The resolved AvatarAccountVariant
 */
export function getAvatarVariant(
  avatarType: AvatarAccountVariant | undefined,
  useBlockie: boolean | undefined,
): AvatarAccountVariant {
  if (avatarType !== undefined) {
    return avatarType;
  }
  if (useBlockie) {
    return AvatarAccountVariant.Blockies;
  }
  return AvatarAccountVariant.Maskicon;
}
