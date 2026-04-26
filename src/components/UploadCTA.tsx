"use client";

import type { ReactNode } from "react";

type Props = {
  variant?: "primary" | "secondary";
  children: ReactNode;
};

export default function UploadCTA({ variant = "secondary", children }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md font-medium px-5 py-3 text-sm sm:text-base transition-colors";
  const styles =
    variant === "primary"
      ? "bg-teal-600 hover:bg-teal-700 text-white"
      : "bg-white hover:bg-stone-100 border border-stone-300 text-stone-900";

  function openPicker() {
    const target = document.getElementById("start");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      const input = document.getElementById(
        "huantuk-file-input",
      ) as HTMLInputElement | null;
      input?.click();
    }, 450);
  }

  return (
    <button type="button" onClick={openPicker} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}
