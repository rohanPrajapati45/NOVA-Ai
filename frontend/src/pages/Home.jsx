import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../redux/userSlice";
import api from "../utils/axios";
import GoogleSignInButton from "../components/GoogleSignInButton";

const Home = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post("/api/auth/logout");
      dispatch(clearUser());
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  // ─── Authenticated view ────────────────────────────────────────────
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center border border-gray-100 animate-fade-in">
          {/* Avatar */}
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.name}
              className="w-24 h-24 rounded-full mx-auto mb-5 border-4 border-purple-100 shadow-md object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto mb-5 bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold shadow-md">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}

          {/* User Info */}
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            Welcome, {user.name || "User"}
          </h2>
          <p className="text-gray-400 text-sm mb-8">{user.email}</p>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-8 py-2.5 border-2 border-red-400 text-red-500 rounded-xl hover:bg-red-50 hover:border-red-500 active:scale-[0.97] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Unauthenticated view ──────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center border border-gray-100 animate-fade-in">
        {/* App Logo / Name */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-white text-2xl font-bold">N</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-1">NOVA AI</h1>
        <p className="text-gray-400 text-sm mb-10">
          Sign in to access your multi-agent workspace
        </p>

        {/* Google Sign-In */}
        <GoogleSignInButton />

        {/* Footer */}
        <p className="text-gray-300 text-xs mt-8">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};

export default Home;
