"use client";

import { useEffect, useState } from "react";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

      // Calculate scroll progress percentage (0 - 100)
      if (docHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
        setScrollProgress(progress);
      }

      // Show button after scrolling down 280px
      if (scrollY > 280) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once on mount in case page is already scrolled
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
      className={`fixed bottom-6 right-6 z-40 group flex items-center justify-center w-11 h-11 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-xl hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-6 pointer-events-none"
      }`}
    >
      {/* Subtle circular progress track */}
      <svg className="absolute inset-0 w-full h-full -rotate-90 p-0.5 pointer-events-none" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r="19"
          className="stroke-slate-200/50 dark:stroke-slate-800/50"
          strokeWidth="2.5"
          fill="none"
        />
        <circle
          cx="22"
          cy="22"
          r="19"
          className="stroke-blue-500 transition-all duration-150 ease-out"
          strokeWidth="2.5"
          strokeDasharray={119.38}
          strokeDashoffset={119.38 - (119.38 * scrollProgress) / 100}
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Up Arrow Icon */}
      <svg
        className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  );
}
