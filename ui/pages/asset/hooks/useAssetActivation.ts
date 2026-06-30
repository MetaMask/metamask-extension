import { useCallback } from "react";
import { requestStellarChangeTrustOptDelete } from "../utils/stellar-snap-client-requests";
import { CaipAssetType, CaipChainId, isCaipChainId, parseCaipAssetId } from "@metamask/utils";
import { Asset } from "../types/asset";
import { getInternalAccountBySelectedAccountGroupAndCaip } from "ui/selectors/multichain-accounts/account-tree";
import { useSelector } from "react-redux";
import { InternalAccount } from "@metamask/keyring-internal-api";

export const useAssetActivation = ({
  asset,
}: {
  asset:  {
    assetId: string;
  };
}) => {
  // TODO: keep all activate / inactive asset logic here
  // And keep the state to control the loading status and error message for each operation


  const [isDeactivating, setIsDeactivating] =
    useState(false);
  const [trustlineRemoveErrorMessage, setTrustlineRemoveErrorMessage] =
    useState<string | null>(null);
  const dismissTrustlineRemoveErrorToast = useCallback(() => {
    setTrustlineRemoveErrorMessage(null);
  }, []);
  const caipChainId = parseCaipAssetId(asset.assetId);

  const selectedAccount = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, caipChainId as CaipChainId),
  ) as InternalAccount;

  const deactivateAsset = useCallback(async (assetId: string) => {
    try {
      await requestStellarChangeTrustOptDelete({
        accountId: selectedAccount.id,
        assetId: assetId as CaipAssetType,
        scope: caipChainId as CaipChainId,
      });
    } catch (error) {
      console.error(error);
    }
  }, [selectedAccount, asset]);


  const canDeactivate = isTrustlineAsset(asset.assetId);


  return { deactivateAsset, canDeactivate, isDeactivating, trustlineRemoveErrorMessage, dismissTrustlineRemoveErrorToast };
}
