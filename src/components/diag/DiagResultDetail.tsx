interface DiagResultDetailProps {
  message: string;
}

export function DiagResultDetail({ message }: DiagResultDetailProps) {
  return (
    <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>
  );
}
