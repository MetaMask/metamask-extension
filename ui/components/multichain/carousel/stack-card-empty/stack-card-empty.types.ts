export interface StackCardEmptyProps {
  isVisible?: boolean;
  isBackground?: boolean;
  onTransitionToEmpty?: () => void;
  onExited?: () => void;
  className?: string;
}

export interface EmptyStateComponentProps {
  onComplete: () => void;
  isBackground?: boolean;
}
