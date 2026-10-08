import { QRCodeSVG } from "qrcode.react";

interface QrCodeProps {
  value: string;
  size?: number;
}

export function QrCode({ value, size = 160 }: QrCodeProps) {
  return (
    <div className="inline-block rounded-2xl bg-white p-3 shadow-sm">
      <QRCodeSVG value={value} size={size} />
    </div>
  );
}
