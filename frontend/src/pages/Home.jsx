import React from "react";
import { useSelector, useDispatch } from "react-redux";
import GoogleSignInButton from "../components/GoogleSignInButton";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import Artifacts from "../components/Artifacts";
import { toggleArtifactPanel } from "../redux/messageSlice";

const Home = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const { activeArtifact, isArtifactPanelOpen } = useSelector((state) => state.message);

  // ─── Authenticated: Dashboard layout ──────────────────────────────
  if (isAuthenticated && user) {
    return (
      <div
        className="flex h-screen overflow-hidden w-full relative"
        style={{ background: "var(--bg-base)" }}
      >
        <Sidebar />
        <ChatArea
          isArtifactsOpen={isArtifactPanelOpen}
          onToggleArtifacts={() => dispatch(toggleArtifactPanel())}
        />
        {/* Render Artifacts panel if there is an active artifact */}
        {activeArtifact && <Artifacts />}
      </div>
    );
  }

  // ─── Unauthenticated: Login view ─────────────────────────────────
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
