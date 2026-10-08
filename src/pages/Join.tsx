import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { MobileShell } from "@/components/layout/MobileShell";

export default function Join() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const canSubmit = code.length === 6;

  function handleSubmit() {
    if (!canSubmit) return;
    // 코드 유효성 검사는 CharacterSelect에서 join_room RPC가 수행한다.
    // rooms 테이블은 참가 전 사용자에게 RLS로 비공개이므로, 여기서 직접
    // SELECT로 미리 확인할 수 없다(의도된 설계).
    navigate(`/room/${code}/character`);
  }

  return (
    <MobileShell>
      <div className="flex flex-1 flex-col justify-center gap-6 px-6 py-8">
        <h1 className="text-2xl font-black text-[var(--color-ink)]">방 입장하기</h1>
        <p className="text-sm text-gray-500">방장에게 받은 6자리 코드를 입력하세요.</p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          placeholder="042817"
          className="min-h-11 w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-3xl font-bold tracking-[0.3em]"
        />

        <Button onClick={handleSubmit} disabled={!canSubmit}>
          입장하기
        </Button>
      </div>
    </MobileShell>
  );
}
