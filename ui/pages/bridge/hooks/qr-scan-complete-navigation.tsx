import { useNavigateOnQrScanComplete } from './useNavigateOnQrScanComplete';

/**
 * Globally mounted listener that navigates to the activity tab when a QR
 * hardware wallet transaction signature completes. Must live outside route-
 * specific pages so sidebar and fullscreen tabs both receive navigation.
 */
export function QrScanCompleteNavigation() {
  useNavigateOnQrScanComplete();
  return null;
}
