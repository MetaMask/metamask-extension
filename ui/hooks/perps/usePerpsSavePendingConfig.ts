import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { OrderFormState } from '../../components/app/perps/order-entry/order-entry.types';
import { submitRequestToBackground } from '../../store/background-connection';
import { pendingDraftFromFormState } from './perps-pending-trade-config';

export type UsePerpsSavePendingConfigOptions = {
  /** Market the draft belongs to. */
  asset?: string;
  /** Latest form snapshot; ignored while null. */
  formState: OrderFormState | null;
  /** When false, unmount/symbol-change must not write a draft (close/modify). */
  enabled: boolean;
  /** Set true after a successful order so unmount does not re-save the filled form. */
  skipRef: MutableRefObject<boolean>;
};

/**
 * Persist the live order form when the user leaves `/perps/trade/:symbol`
 * or switches markets. Restored by `selectPendingTradeConfiguration` if they
 * return to the same symbol inside the product TTL.
 *
 * Writes only on unmount / symbol change — not on every keystroke — so the
 * TTL clock starts at the moment they leave, matching mobile.
 *
 * @param options - Asset, form snapshot, and skip/enabled flags.
 * @param options.asset
 * @param options.formState
 * @param options.enabled
 * @param options.skipRef
 */
export function usePerpsSavePendingConfig({
  asset,
  formState,
  enabled,
  skipRef,
}: UsePerpsSavePendingConfigOptions): void {
  const formStateRef = useRef(formState);
  const enabledRef = useRef(enabled);

  useLayoutEffect(() => {
    formStateRef.current = formState;
    enabledRef.current = enabled;
  });

  const saveForAsset = useCallback(
    (symbol: string | undefined) => {
      if (skipRef.current || !enabledRef.current || !symbol) {
        return;
      }
      const { current } = formStateRef;
      if (!current) {
        return;
      }
      submitRequestToBackground('perpsSavePendingTradeConfiguration', [
        symbol,
        pendingDraftFromFormState(current),
      ]).catch((error) => {
        console.warn('[Perps] Save pending trade configuration failed:', error);
      });
    },
    [skipRef],
  );

  useEffect(() => {
    return () => {
      saveForAsset(asset);
    };
  }, [asset, saveForAsset]);
}
