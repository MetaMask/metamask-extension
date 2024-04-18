import type {
  AssetType,
  TokenStandard,
} from '../../../../../shared/constants/transaction';
import type { Asset } from '../../../../ducks/send';

export type NFT = {
  address: string;
  description: string | null;
  favorite: boolean;
  image: string | null;
  isCurrentlyOwned: boolean;
  name: string | null;
  standard: TokenStandard;
  tokenId: string;
  tokenURI?: string;
};

export type Token = {
  address: string | null;
  symbol: string;
  decimals: number;
  image: string;
  balance: string;
  string: string;
  type: AssetType;
  isSelected: boolean;
};

export type Collection = {
  collectionName: string;
  collectionImage: string | null;
  nfts: NFT[];
};

export { Asset };
