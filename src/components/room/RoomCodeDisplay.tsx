import { CopyLinkButton } from "@/components/common/CopyLinkButton";
import { QrCode } from "@/components/common/QrCode";
import { useQrValue } from "@/hooks/useQrValue";

interface RoomCodeDisplayProps {
  code: string;
}

export function RoomCodeDisplay({ code }: RoomCodeDisplayProps) {
  const shareUrl = useQrValue(`/room/${code}/character`);

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-gray-50 p-5">
      <p className="text-sm text-gray-500">방 코드</p>
      <p className="text-4xl font-black tracking-[0.2em] text-[var(--color-ink)]">{code}</p>
      <QrCode value={shareUrl} size={120} />
      <CopyLinkButton value={shareUrl} />
    </div>
  );
}
