import { useMusdConversionToastStatus } from '../../../hooks/musd/useMusdConversionToastStatus';
import { useMusdConversionConfirmTrace } from '../../../hooks/musd/useMusdConversionConfirmTrace';

// Non-rendering listener. The MUSD conversion toast itself now comes from the
// generic transaction toast listener; this only preserves MUSD analytics and
// the Sentry confirmation trace previously bundled with the custom toast.
export function MusdConversionListener() {
  const { activeTransactionId } = useMusdConversionToastStatus();

  useMusdConversionConfirmTrace(activeTransactionId ?? '');

  return null;
}
