import { useCallback, useContext } from 'react';
import { NameType } from '@metamask/name-controller';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { FormComboFieldOption } from '../../../ui/form-combo-field/form-combo-field';

export function usePetnamesMetrics({
  initialSources,
  name,
  proposedNameOptions,
  savedName,
  savedSourceId,
  selectedSourceId,
  type,
}: {
  initialSources?: string[];
  name?: string;
  proposedNameOptions: FormComboFieldOption[];
  savedName: string | null;
  savedSourceId: string | null;
  selectedSourceId?: string;
  type: NameType;
}) {
  const { trackEvent } = useContext(MetaMetricsContext);

  const trackPetnamesEvent = useCallback(
    (
      event: MetaMetricsEventName,

      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      additionalProperties: Record<string, any> = {},
    ) => {
      const suggestedNameSources = [
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...new Set(proposedNameOptions.map((option: any) => option.sourceId)),
      ];

      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const properties: Record<string, any> = {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        petname_category: type,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        suggested_names_sources: suggestedNameSources,
        ...additionalProperties,
      };

      trackEvent({
        event,
        category: MetaMetricsEventCategory.Petnames,
        properties,
      });
    },
    [trackEvent, type, proposedNameOptions],
  );

  const trackPetnamesSaveEvent = useCallback(() => {
    const petnameSource = selectedSourceId ?? null;
    const isDeleted = savedName?.length && !name?.length;
    const isUpdated = savedName?.length && name?.length && name !== savedName;
    const isCreated = !savedName?.length && name?.length;

    let event: MetaMetricsEventName | null = null;

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let additionalProperties: Record<string, any> = {};

    if (isDeleted) {
      event = MetaMetricsEventName.PetnameDeleted;

      additionalProperties = {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        petname_previous_source: savedSourceId,
      };
    }

    if (isUpdated) {
      event = MetaMetricsEventName.PetnameUpdated;

      additionalProperties = {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        petname_previous_source: savedSourceId,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        petname_source: petnameSource,
      };
    }

    if (isCreated) {
      event = MetaMetricsEventName.PetnameCreated;

      additionalProperties = {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        petname_source: petnameSource,
      };
    }

    if (!event) {
      return;
    }

    trackPetnamesEvent(event, additionalProperties);
  }, [trackPetnamesEvent, name, selectedSourceId, savedName, savedSourceId]);

  const trackPetnamesOpenEvent = useCallback(() => {
    trackPetnamesEvent(MetaMetricsEventName.PetnameModalOpened, {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      has_petname: Boolean(savedName?.length),
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      suggested_names_sources: initialSources,
    });
  }, [trackPetnamesEvent, savedName, initialSources]);

  return { trackPetnamesOpenEvent, trackPetnamesSaveEvent };
}
