"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { clearStoredUser } from "@/lib/userSession";

// 24 hours = 24 * 60 * 60 * 1000 milliseconds
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
const LAST_ACTIVITY_KEY = "imperial_last_activity";
const SESSION_START_KEY = "imperial_session_start";

export function AutoLogout() {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Don't enforce auto-logout on public pages like login or change-password
    if (pathname === "/login" || pathname === "/change-password") {
      return;
    }

    const logout = async () => {
      try {
        clearStoredUser();
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      } catch (err) {
        console.error("Auto logout failed", err);
      }
    };

    const checkExpiryAndSchedule = () => {
      const now = Date.now();
      const sessionStart = parseInt(localStorage.getItem(SESSION_START_KEY) || "0", 10);
      const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || "0", 10);

      // If either session start or inactivity has exceeded 24 hours, log out immediately
      if (
        (sessionStart > 0 && now - sessionStart >= SESSION_DURATION_MS) ||
        (lastActivity > 0 && now - lastActivity >= SESSION_DURATION_MS)
      ) {
        logout();
        return;
      }

      // Calculate remaining time until the 24-hour limit
      const referenceTime = sessionStart || lastActivity || now;
      const elapsed = now - referenceTime;
      const remainingTime = Math.max(1000, SESSION_DURATION_MS - elapsed);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(logout, remainingTime);
    };

    const handleUserActivity = () => {
      const now = Date.now();
      const sessionStart = parseInt(localStorage.getItem(SESSION_START_KEY) || "0", 10);
      const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || "0", 10);

      // Check if session has already expired before recording new activity
      if (
        (sessionStart > 0 && now - sessionStart >= SESSION_DURATION_MS) ||
        (lastActivity > 0 && now - lastActivity >= SESSION_DURATION_MS)
      ) {
        logout();
        return;
      }

      // Throttle updating localStorage activity timestamp (at most once every 30 seconds)
      if (!lastActivity || now - lastActivity > 30 * 1000) {
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      }
    };

    // Initialize session start and activity timestamp if not present
    if (!localStorage.getItem(SESSION_START_KEY)) {
      localStorage.setItem(SESSION_START_KEY, Date.now().toString());
    }
    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }

    // Schedule check
    checkExpiryAndSchedule();

    // Check on tab focus or visibility change (e.g. laptop woke up after 24h)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkExpiryAndSchedule();
      }
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", checkExpiryAndSchedule);

    // Event listeners for user activity
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((event) => window.addEventListener(event, handleUserActivity, { passive: true }));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", checkExpiryAndSchedule);
      events.forEach((event) => window.removeEventListener(event, handleUserActivity));
    };
  }, [pathname, router]);

  return null;
}
