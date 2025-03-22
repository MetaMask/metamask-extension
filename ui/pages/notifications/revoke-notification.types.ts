export type ApprovedSpender = {
  spender: string; // hex
  amount: string; // some stupid large number, assume 18 decimals, and anything crazy large we can assume is unlimited
};

export type RevokeAsset = {
  assetSymbol: string;
  assetName: string;
  assetAddress: string;
  assetType: string[];
  approvedSpenders: ApprovedSpender[];
  lastUpdated: string;
  isHoneypot: boolean;
};

export type RevokeData = RevokeAsset[];

export type RevokeNotification = {
  type: 'RevokeNotification';
  data: RevokeData;

  // Base Notification Props
  id: string;
  createdAt: string;
  isRead: boolean;
};
