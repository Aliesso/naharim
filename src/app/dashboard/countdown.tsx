"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function Countdown({ expiresAt }: { expiresAt: string }) {
  const router = useRouter();
  const end = new Date(expiresAt).getTime();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const ms = end - Date.now();
      setLeft(ms);
      if (ms <= 0) {
        clearInterval(id);
        router.refresh();
      }
    };
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [end, router]);

  if (left === null) return <p className="text-sm text-stone-500">&nbsp;</p>;
  if (left <= 0) return <p className="text-sm font-semibold text-red-600">Kuponun vaxtı bitdi</p>;

  const m = Math.floor(left / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return (
    <p className="text-sm text-stone-600">
      Qalan vaxt: <span className="font-mono font-semibold">{m}:{s.toString().padStart(2, "0")}</span>
    </p>
  );
}
