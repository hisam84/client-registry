"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export function AutoLogout() {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Don't enforce auto-logout on public pages like login or change-password
    if (pathname === '/login' || pathname === '/change-password') {
      return;
    }

    const logout = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
      } catch (err) {
        console.error("Auto logout failed", err);
      }
    };

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // 10 minutes = 10 * 60 * 1000 milliseconds
      timeoutRef.current = setTimeout(logout, 10 * 60 * 1000);
    };

    // Initialize timer
    resetTimer();

    // Event listeners for user activity
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Throttle the event listeners slightly if needed, but for simple timeout reset, it's usually fine
    // However, to avoid too many calls, we just clear and reset the timeout.
    events.forEach((event) => window.addEventListener(event, resetTimer));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [pathname, router]);

  return null;
}
