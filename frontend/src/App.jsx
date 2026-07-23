import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setUser, clearUser } from "./store/authSlice";
import api from "./utils/axios";
import Home from "./pages/Home";

function App() {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  // On mount — check if there's an existing valid session (cookie-based)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await api.get("/api/auth/me");
        dispatch(setUser(response.data.user));
      } catch {
        // No valid session — user needs to sign in
        dispatch(clearUser());
      }
    };

    checkSession();
  }, [dispatch]);

  // Show spinner while the session check is in progress
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export default App;