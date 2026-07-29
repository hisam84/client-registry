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
    window.dispatchEvent(new Event("user-session-changed"));
  } catch (err) {
    console.error("Failed to store user:", err);
  }
}

export function clearStoredUser() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("imperial_active_user");
    window.dispatchEvent(new Event("user-session-changed"));
  } catch (err) {
    console.error("Failed to clear stored user:", err);
  }
}

export function useUserSession() {
  const [currentUser, setCurrentUser] = useState<Employee>(SUPER_ADMIN_USER);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCurrentUser(getStoredUser());
    setMounted(true);

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
