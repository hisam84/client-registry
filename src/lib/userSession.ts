import { useEffect, useState } from "react";
import { Employee } from "./types";

export const SUPER_ADMIN_USER: Employee = {
  id: "super-admin",
  name: "Super Admin",
  email: "admin@imperialit.com",
  role: "SUPER_ADMIN",
  orderSerial: 0,
  designation: "Administrator",
  avatarColor: "#0b7677",
};

export function getStoredUser(): Employee {
  if (typeof window === "undefined") return SUPER_ADMIN_USER;
  try {
    const saved = localStorage.getItem("imperial_active_user");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id) return parsed;
    }
  } catch (err) {
    console.error("Failed to parse stored user:", err);
  }
  return SUPER_ADMIN_USER;
}

export function setStoredUser(user: Employee) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("imperial_active_user", JSON.stringify(user));
    localStorage.setItem("imperial_last_activity", Date.now().toString());
    localStorage.setItem("imperial_session_start", Date.now().toString());
    window.dispatchEvent(new Event("user-session-changed"));
  } catch (err) {
    console.error("Failed to store user:", err);
  }
}

export function clearStoredUser() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("imperial_active_user");
    localStorage.removeItem("imperial_last_activity");
    localStorage.removeItem("imperial_session_start");
    window.dispatchEvent(new Event("user-session-changed"));
  } catch (err) {
    console.error("Failed to clear stored user:", err);
  }
}

export function useUserSession() {
  const [currentUser, setCurrentUser] = useState<Employee>(() => getStoredUser());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = getStoredUser();
    setCurrentUser(initial);
    setMounted(true);

    const syncProfileFromDB = async () => {
      try {
        const stored = getStoredUser();
        const res = await fetch("/api/employees");
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            let matched = list.find((e: Employee) => e.id === stored.id || e.email === stored.email);
            if (!matched && (stored.id === "super-admin" || stored.role === "SUPER_ADMIN")) {
              matched = list.find((e: Employee) => e.role === "SUPER_ADMIN" || e.email === "admin@imperialit.com");
            }
            if (matched) {
              const updated = { ...stored, ...matched };
              setCurrentUser(updated);
              setStoredUser(updated);
            }
          }
        }
      } catch (err) {
        console.error("Failed to sync profile from DB:", err);
      }
    };

    syncProfileFromDB();

    const handleStorage = () => {
      setCurrentUser(getStoredUser());
    };

    window.addEventListener("user-session-changed", handleStorage);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("user-session-changed", handleStorage);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return {
    currentUser,
    setCurrentUser: (u: Employee) => {
      setCurrentUser(u);
      setStoredUser(u);
    },
    isSuperAdmin: currentUser.role === "SUPER_ADMIN",
    mounted,
  };
}
