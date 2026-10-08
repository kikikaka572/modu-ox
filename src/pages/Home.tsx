import { useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { QrCode } from "@/components/common/QrCode";
import { MobileShell } from "@/components/layout/MobileShell";
import { useQrValue } from "@/hooks/useQrValue";

export default function Home() {
  const navigate = useNavigate();
  const qrValue = useQrValue("/");

  return (
    <MobileShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-10">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center gap-2 text-5xl font-black">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-o-zone)] text-white">
              O
            </span>
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-x-zone)] text-white">
              X
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-black text-[var(--color-ink)]">모두의 OX</h1>
          <p className="mt-2 text-gray-500">다 같이 뛰어드는 실시간 OX 퀴즈</p>
        </div>

        <QrCode value={qrValue} />

        <div className="flex w-full flex-col gap-3">
          <Button onClick={() => navigate("/create")}>방 만들기</Button>
          <Button variant="secondary" onClick={() => navigate("/join")}>
            방 입장하기
          </Button>
        </div>
      </div>
    </MobileShell>
  );
}
