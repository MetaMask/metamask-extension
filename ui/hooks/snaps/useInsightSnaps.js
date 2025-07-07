import { useSelector } from 'react-redux';
import { SeverityLevel } from '@metamask/snaps-sdk';
import { getSnapInsights } from '../../selectors';

export function useInsightSnaps(id) {
  const insight = useSelector((state) => {
    const result = getSnapInsights(state, id);
    return result;
  });

  const data = insight ? Object.values(insight) : [];

  const warnings = data.filter(
    (result) => result.severity === SeverityLevel.Critical,
  );

  return { data, warnings };
}
