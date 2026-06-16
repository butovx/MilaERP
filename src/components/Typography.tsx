import React from "react";

type HeadingProps = {
  children: React.ReactNode;
  className?: string;
};

export function H1({ children, className = "" }: HeadingProps) {
  return (
    <h1
      className={`text-2xl sm:text-3xl font-semibold text-[var(--text-color-primary)] mb-6 tracking-tight ${className}`}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className = "" }: HeadingProps) {
  return (
    <h2
      className={`text-xl sm:text-2xl font-semibold text-[var(--text-color-primary)] mb-4 tracking-tight ${className}`}
    >
      {children}
    </h2>
  );
}

export function H3({ children, className = "" }: HeadingProps) {
  return (
    <h3
      className={`text-lg sm:text-xl font-semibold text-[var(--text-color-primary)] mb-3 tracking-tight ${className}`}
    >
      {children}
    </h3>
  );
}

export function H4({ children, className = "" }: HeadingProps) {
  return (
    <h4
      className={`text-base sm:text-lg font-medium text-[var(--text-color-primary)] mb-2 tracking-tight ${className}`}
    >
      {children}
    </h4>
  );
}

type TextProps = {
  children: React.ReactNode;
  className?: string;
};

export function Text({ children, className = "" }: TextProps) {
  return (
    <p className={`text-sm sm:text-base text-[var(--text-color-secondary)] leading-relaxed mb-4 ${className}`}>
      {children}
    </p>
  );
}

export function LargeText({ children, className = "" }: TextProps) {
  return (
    <p className={`text-base sm:text-lg text-[var(--text-color-secondary)] leading-relaxed mb-4 ${className}`}>
      {children}
    </p>
  );
}

export function SmallText({ children, className = "" }: TextProps) {
  return (
    <p className={`text-xs sm:text-sm text-[var(--text-color-secondary)] leading-relaxed mb-3 ${className}`}>
      {children}
    </p>
  );
}

type LabelProps = {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
};

export function Label({ children, className = "", htmlFor }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-xs sm:text-sm font-medium text-[var(--text-color-primary)] mb-1.5 ${className}`}
    >
      {children}
    </label>
  );
}

export function ErrorText({ children, className = "" }: TextProps) {
  return (
    <p className={`text-sm sm:text-base text-red-500 dark:text-red-400 font-medium mb-3 ${className}`}>
      {children}
    </p>
  );
}

export function SuccessText({ children, className = "" }: TextProps) {
  return (
    <p className={`text-sm sm:text-base text-emerald-500 dark:text-emerald-400 font-medium mb-3 ${className}`}>
      {children}
    </p>
  );
}

export function Caption({ children, className = "" }: TextProps) {
  return (
    <p className={`text-xs text-[var(--text-color-muted)] mb-2 ${className}`}>{children}</p>
  );
}

export function Blockquote({ children, className = "" }: TextProps) {
  return (
    <blockquote
      className={`pl-4 border-l-4 border-[var(--card-border)] text-[var(--text-color-secondary)] italic mb-4 ${className}`}
    >
      {children}
    </blockquote>
  );
}
