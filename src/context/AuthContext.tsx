import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

export interface LoginLog {
  _id: string;
  email: string;
  status: "SUCCESS" | "FAILED";
  ipAddress: string;
  hashedIP: string;
  userAgent: string;
  hashedDetails: string;
  timestamp: string;
  userId?: { email: string; isAdmin: boolean };
}

type GoogleResult = { ok: true; email: string } | { ok: false; error: string };

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  hasSkippedLogin: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (email: string, pass: string) => Promise<boolean | string>;
  loginWithGoogle: () => Promise<GoogleResult>;
  resetPassword: (email: string) => Promise<true | string>;
  logout: () => void;
  skipLogin: () => void;
  getToken: () => string | null;
  getLoginHistory: () => Promise<LoginLog[]>;
  getAdminLoginLogs: () => Promise<LoginLog[]>;
}

// .env -> VITE_ADMIN_EMAILS=admin@gzones.in
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

export const isAdminEmail = (email?: string | null) =>
  !!email && ADMIN_EMAILS.includes(email.toLowerCase());

const registerErrorMessage = (code: string) => {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please log in or use Forgot password.";
    case "auth/invalid-email": return "Please enter a valid email address.";
    case "auth/weak-password": return "Password must be at least 6 characters.";
    case "auth/network-request-failed": return "Network error. Please try again.";
    default: return "Registration failed.";
  }
};

const resetErrorMessage = (code: string) => {
  switch (code) {
    case "auth/invalid-email": return "Please enter a valid email address.";
    case "auth/too-many-requests": return "Too many attempts. Please try again later.";
    case "auth/network-request-failed": return "Network error. Please try again.";
    default: return "Could not send the reset email. Please try again.";
  }
};

const googleErrorMessage = (code: string) => {
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return ""; // user closed the popup, no error to show
    case "auth/popup-blocked": return "Popup was blocked. Please allow popups and try again.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email. Log in with your password instead.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase. Add it under Authentication → Settings.";
    case "auth/network-request-failed": return "Network error. Please try again.";
    default: return "Google sign-in failed. Please try again.";
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hasSkippedLogin, setHasSkippedLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  const applyUser = async (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      const result = await fbUser.getIdTokenResult();
      tokenRef.current = result.token;
      setToken(result.token);
      setUser({
        id: fbUser.uid,
        email: fbUser.email ?? "",
        isAdmin: result.claims.admin === true || isAdminEmail(fbUser.email),
      });
    } else {
      tokenRef.current = null;
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    // Clean up leftovers from the old custom-JWT auth
    localStorage.removeItem("pcdoc_token");
    localStorage.removeItem("pcdoc_user");

    if (localStorage.getItem("pcdoc_skipped") === "true") setHasSkippedLogin(true);

    const unsub = onIdTokenChanged(auth, async (fbUser) => {
      await applyUser(fbUser);
      setIsLoading(false);
    });
    return unsub;
  }, []);

  const getToken = () => tokenRef.current;

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      await applyUser(cred.user);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (email: string, pass: string): Promise<boolean | string> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await applyUser(cred.user);
      return true;
    } catch (err: any) {
      return registerErrorMessage(err?.code || "");
    }
  };

  const loginWithGoogle = async (): Promise<GoogleResult> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await applyUser(cred.user);
      return { ok: true, email: cred.user.email ?? "" };
    } catch (err: any) {
      return { ok: false, error: googleErrorMessage(err?.code || "") };
    }
  };

  const resetPassword = async (email: string): Promise<true | string> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err: any) {
      return resetErrorMessage(err?.code || "");
    }
  };

  const logout = () => {
    localStorage.removeItem("pcdoc_skipped");
    setHasSkippedLogin(false);
    signOut(auth);
  };

  const skipLogin = () => {
    localStorage.setItem("pcdoc_skipped", "true");
    setHasSkippedLogin(true);
  };

  const fetchLogs = async (url: string): Promise<LoginLog[]> => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return [];
      const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
      if (!res.ok) return [];
      const data = await res.json();
      return data.logs || [];
    } catch {
      return [];
    }
  };

  const getLoginHistory = () => fetchLogs("/api/auth/login-history");
  const getAdminLoginLogs = () => fetchLogs("/api/auth/admin/login-logs");

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoggedIn: !!user,
      hasSkippedLogin,
      isLoading,
      login,
      register,
      loginWithGoogle,
      resetPassword,
      logout,
      skipLogin,
      getToken,
      getLoginHistory,
      getAdminLoginLogs,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}