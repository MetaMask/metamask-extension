import { Claim } from '@metamask/claims-controller';
import { useCallback, useEffect, useState } from 'react';

const CLAIM_DRAFTS_STORAGE_KEY = 'metamask-claim-drafts';

const generateDraftId = (): string => {
  return `dft-${Date.now()}`;
};

const getStoredDrafts = (): Claim[] => {
  try {
    const stored = localStorage.getItem(CLAIM_DRAFTS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Claim[];
    }
  } catch (error) {
    console.error('Failed to parse claim drafts from localStorage:', error);
  }
  return [];
};

const setStoredDrafts = (drafts: Claim[]): void => {
  try {
    localStorage.setItem(CLAIM_DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error('Failed to save claim drafts to localStorage:', error);
  }
};

export const useClaimDraft = () => {
  const [drafts, setDrafts] = useState<Claim[]>([]);

  // Load drafts from localStorage on mount
  useEffect(() => {
    setDrafts(getStoredDrafts());
  }, []);

  const saveDraft = useCallback(
    (
      draftData: Omit<Claim, 'id' | 'createdAt' | 'updatedAt'>,
      existingDraftId?: string,
    ): Claim => {
      const now = new Date().toISOString();
      let updatedDrafts: Claim[];
      let savedDraft: Claim;

      if (existingDraftId) {
        // Update existing draft
        updatedDrafts = drafts.map((draft) => {
          if (draft.id === existingDraftId) {
            savedDraft = {
              ...draft,
              ...draftData,
              updatedAt: now,
            };
            return savedDraft;
          }
          return draft;
        });

        // If draft wasn't found, create a new one
        if (!savedDraft!) {
          savedDraft = {
            id: generateDraftId(),
            ...draftData,
            createdAt: now,
            updatedAt: now,
          };
          updatedDrafts = [savedDraft, ...drafts];
        }
      } else {
        // Create new draft
        savedDraft = {
          id: generateDraftId(),
          ...draftData,
          createdAt: now,
          updatedAt: now,
        };
        updatedDrafts = [savedDraft, ...drafts];
      }

      setDrafts(updatedDrafts);
      setStoredDrafts(updatedDrafts);
      return savedDraft;
    },
    [drafts],
  );

  const getDraft = useCallback(
    (draftId: string): Claim | undefined => {
      return drafts.find((draft) => draft.id === draftId);
    },
    [drafts],
  );

  const deleteDraft = useCallback(
    (draftId: string): void => {
      const updatedDrafts = drafts.filter((draft) => draft.id !== draftId);
      setDrafts(updatedDrafts);
      setStoredDrafts(updatedDrafts);
    },
    [drafts],
  );

  return {
    drafts,
    saveDraft,
    getDraft,
    deleteDraft,
  };
};
