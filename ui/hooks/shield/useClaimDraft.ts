import { ClaimDraft } from '@metamask/claims-controller';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { deleteClaimDraft, saveClaimDraft } from '../../store/actions';
import { getClaimDrafts } from '../../selectors/shield/claims';

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

  return {
    drafts,
    saveDraft,
    getDraft,
    deleteDraft,
  };
};
