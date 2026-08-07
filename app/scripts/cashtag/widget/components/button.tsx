import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'link';

type ButtonProps = {
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  'aria-label'?: string;
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    'inline-flex h-12 cursor-pointer items-center justify-center rounded-full border-0 bg-text-default text-s-body-md font-medium text-background-default transition hover:-translate-y-px hover:bg-icon-default-hover',
  secondary:
    'inline-flex h-12 cursor-pointer items-center justify-center rounded-full border-0 bg-subsection text-s-body-md font-medium text-default transition hover:-translate-y-px hover:bg-default-pressed',
  link: 'inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-s-body-sm font-medium text-alternative hover:text-default',
};

export function Button({
  variant = 'secondary',
  children,
  className,
  onClick,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const classes = className
    ? `${variantClassNames[variant]} ${className}`
    : variantClassNames[variant];

  return (
    <button
      type="button"
      className={classes}
      aria-label={ariaLabel}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick?.(event);
      }}
    >
      {children}
    </button>
  );
}
