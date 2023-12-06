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
  const trackEvent = useContext(MetaMetricsContext);

  const trackPetnamesEvent = useCallback(
    (
      event: MetaMetricsEventName,
      additionalProperties: Record<string, any> = {},
    ) => {
      const suggestedNameSources = [
        ...new Set(proposedNameOptions.map((option: any) => option.sourceId)),
      ];

      const properties: Record<string, any> = {
        petname_category: type,
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
    let additionalProperties: Record<string, any> = {};

    if (isDeleted) {
      event = MetaMetricsEventName.PetnameDeleted;

      additionalProperties = {
        petname_previous_source: savedSourceId,
      };
    }

    if (isUpdated) {
      event = MetaMetricsEventName.PetnameUpdated;

      additionalProperties = {
        petname_previous_source: savedSourceId,
        petname_source: petnameSource,
      };
    }

    if (isCreated) {
      event = MetaMetricsEventName.PetnameCreated;

      additionalProperties = {
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
      has_petname: Boolean(savedName?.length),
      suggested_names_sources: initialSources,
    });
  }, [trackPetnamesEvent, savedName, initialSources]);

  return { trackPetnamesOpenEvent, trackPetnamesSaveEvent };
}
