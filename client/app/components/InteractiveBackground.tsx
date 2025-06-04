"use client";

import { useEffect, useRef } from "react";

export default function InteractiveBackground() {
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!backgroundRef.current) return;

      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      backgroundRef.current.style.setProperty("--x", `${x * 100}%`);
      backgroundRef.current.style.setProperty("--y", `${y * 100}%`);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={backgroundRef}
      className="fixed inset-0 -z-10 bg-[#F4F1FF] overflow-hidden"
      style={{
        background: `radial-gradient(circle at var(--x, 50%) var(--y, 50%), #7754F6 0%, transparent 30%),
                    radial-gradient(circle at calc(100% - var(--x, 50%)) calc(100% - var(--y, 50%)), #B4ED1C 0%, transparent 20%),
                    radial-gradient(circle at calc(var(--x, 50%)) calc(100% - var(--y, 50%)), #F6DD4B 0%, transparent 20%),
                    #F4F1FF`,
        transition: "background-position 0.3s ease",
      }}
    >
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
    </div>
  );
}
