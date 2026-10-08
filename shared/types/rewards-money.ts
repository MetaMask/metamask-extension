export type ReferralRole = 'REFERRER' | 'REFEREE' | 'BOTH' | 'NONE';

export type ReferralVariant = 'REFERRER' | 'REFEREE' | 'NONE';

export type ReferralLocalizedText = {
  inviteTitle: string;
  inviteMessageBody: string;
  inviteReferralCode: string;
  inviteDecline: string;
  inviteAccept: string;
  inviteAcceptedEyebrow: string;
  inviteAcceptedTitle: string;
  inviteAcceptedBody: string;
  inviteAcceptedCloseA11y: string;
  inviteAcceptedStartTrading: string;
  inviteAcceptedViewRewards: string;
};

export type ThemeImage = {
  lightModeUrl: string;
  darkModeUrl: string;
};

export type ReferredByView = {
  cashback_earning_end: string | null;
};

export type ReferralMeDto = {
  role: ReferralRole;
  variant: ReferralVariant;
  localized_text: ReferralLocalizedText;
  invite_hero: ThemeImage | null;
  referred_by: ReferredByView | null;
  excluded_regions: string[];
};

export type RegisterRefereeDto = {
  code: string;
};

export type GetReferralMeDto = {
  forceFresh?: boolean;
};
