interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-[var(--color-x-zone-strong)]">
      {message}
    </p>
  );
}
