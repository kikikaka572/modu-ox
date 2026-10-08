import { useState } from "react";
import { Button } from "./Button";

interface CopyLinkButtonProps {
  value: string;
}

export function CopyLinkButton({ value }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable (e.g. non-HTTPS LAN access) — silently ignore,
      // the link text itself is still visible/selectable to the user.
    }
  }

  return (
    <Button variant="secondary" onClick={handleCopy}>
      {copied ? "복사됨!" : "링크 복사"}
    </Button>
  );
}
