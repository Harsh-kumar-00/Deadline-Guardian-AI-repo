import React, { useEffect, useState } from "react";
import { auth, googleProvider, setCachedAccessToken } from "../lib/firebase";
import { signInAnonymously, signInWithPopup, signOut, onAuthStateChanged, User, GoogleAuthProvider } from "firebase/auth";
import { LogIn, LogOut, Shield, User as UserIcon, RefreshCw } from "lucide-react";

interface UserAuthProps {
  onUserChanged: (user: User | null) => void;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  onRetry?: () => void;
}

export default function UserAuth({ onUserChanged, syncStatus, onRetry }: UserAuthProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      onUserChanged(currentUser);
      if (!currentUser) {
        setCachedAccessToken(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [onUserChanged]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
      }
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      // Fallback anonymous sign in if popups are blocked inside iframe!
      try {
        await signInAnonymously(auth);
      } catch (anonErr) {
        console.error("Anonymous Sign-In Fallback Error:", anonErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      setLoading(true);
      await signInAnonymously(auth);
    } catch (err) {
      console.error("Anonymous Sign-In Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (err) {
      console.error("Sign-Out Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
        <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
        <span className="text-xs text-gray-500 font-mono">Securing connection...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white px-3.5 py-1.5 rounded-xl border border-gray-200 shadow-sm">
      {user ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Avatar" 
                className="w-5 h-5 rounded-full referrer-no-referrer border border-blue-500/20"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-5 h-5 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center">
                <UserIcon className="w-3 h-3 text-blue-600" />
              </div>
            )}
            <span className="text-xs font-medium text-gray-700 max-w-[120px] truncate">
              {user.isAnonymous ? "Sandbox Account" : (user.displayName || "Active User")}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-gray-200" />

          {/* Cloud sync status badge */}
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${
              syncStatus === "synced" ? "bg-green-500" :
              syncStatus === "syncing" ? "bg-blue-500 animate-pulse" :
              syncStatus === "error" ? "bg-red-500" : "bg-gray-400"
            }`} />
            <span className="text-[10px] font-mono uppercase text-gray-500 font-semibold tracking-wider">
              {syncStatus === "synced" ? "Cloud Synced" :
               syncStatus === "syncing" ? "Syncing..." :
               syncStatus === "error" ? "Sync Error" : "Offline"}
            </span>
            {syncStatus === "error" && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="ml-1 px-2 py-0.5 text-[9px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition flex items-center gap-1 cursor-pointer shadow-xs"
                title="Retry connection"
              >
                <RefreshCw className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '3s' }} /> Retry Connection
              </button>
            )}
          </div>

          <div className="h-4 w-[1px] bg-gray-200" />

          <button 
            onClick={handleSignOut} 
            className="text-gray-400 hover:text-gray-600 text-xs transition flex items-center gap-1.5"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase mr-1 tracking-wider">Cloud Sync:</span>
          {syncStatus === "error" && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium text-[11px] px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} /> Retry Connection
            </button>
          )}
          <button 
            onClick={handleGoogleSignIn}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 border border-blue-500/10 shadow-sm cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" /> Google Sync
          </button>
          <button 
            onClick={handleAnonymousSignIn}
            className="bg-white hover:bg-gray-50 text-gray-700 font-medium text-[11px] px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 border border-gray-200 shadow-sm cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" /> Sandbox
          </button>
        </div>
      )}
    </div>
  );
}

