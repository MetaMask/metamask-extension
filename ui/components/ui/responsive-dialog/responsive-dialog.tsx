import React, { ReactNode, ReactEventHandler, Ref } from 'react';

type Props = {
  children: ReactNode;
  dialogRef: Ref<HTMLDialogElement>;
  onClose: ReactEventHandler<HTMLDialogElement>;
};

export function ResponsiveDialog(props: Props) {
  const { children, dialogRef, onClose } = props;

  return (
    <dialog
      ref={dialogRef}
      className="dialog-modal w-full h-dvh max-h-dvh mx-auto p-0 border-0 bg-background-default text-default md:max-w-[480px] md:h-auto md:max-h-[90vh] md:rounded-4xl md:border md:border-alternative md:bg-background-elevated1 open:backdrop:opacity-100 starting:open:backdrop:opacity-0 backdrop:transition-discrete backdrop:transition-all"
      onClose={onClose}
      // @ts-expect-error closedby missing in React types
      // eslint-disable-next-line react/no-unknown-property -- valid on <dialog>
      closedby="any"
    >
      {children}
    </dialog>
  );
}
