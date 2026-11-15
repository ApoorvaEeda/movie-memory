"use client";

import { useState } from "react";

export function initials(name: string | null, email: string | null) {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (name ? (parts[1]?.[0] ?? "") : "")).toUpperCase();
}

export function Avatar({ src, name, email }: { src: string | null; name: string | null; email: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-hidden
        className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-600"
      >
        {initials(name, email)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name ? `${name}'s photo` : "Profile photo"}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-14 w-14 rounded-full object-cover"
    />
  );
}
