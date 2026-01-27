import { ClaimDraft } from '@metamask/claims-controller';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { deleteClaimDraft, saveClaimDraft } from '../../store/actions';
import { getClaimDrafts } from '../../selectors/shield/claims';
import { MAX_DRAFT_CLAIMS } from '../../pages/settings/transaction-shield-tab/claims-form/constants';

export const useClaimDraft = () => {
  const drafts = useSelector(getClaimDrafts);

  const saveDraft = useCallback(
    async (draftData: Partial<ClaimDraft>): Promise<ClaimDraft> => {
      const savedDraft = await saveClaimDraft(draftData);
      return savedDraft;
    },
    [],
  );

  const getDraft = useCallback(
    (draftId: string): ClaimDraft | undefined => {
      return drafts.find((draft) => draft.draftId === draftId);
    },
    [drafts],
  );

  const deleteDraft = useCallback(async (draftId: string): Promise<void> => {
    await deleteClaimDraft(draftId);
  }, []);

  const hasMaxDrafts = useMemo(() => {
    return drafts.length >= MAX_DRAFT_CLAIMS;
  }, [drafts]);

  return {
    drafts,
    hasMaxDrafts,
    saveDraft,
    getDraft,
    deleteDraft,
  };
};
