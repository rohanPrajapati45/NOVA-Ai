import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import proxy from "express-http-proxy";

dotenv.config();

const PORT = process.env.PORT || 8000;

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────

// Parse cookies (needed to forward session cookies to services)
app.use(cookieParser());

// CORS — credentials: true required for session cookies,
// must use exact origin (not wildcard "*")
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ─── Proxy Routes ───────────────────────────────────────────────────

// Forward /api/auth/* → auth service
// The proxy strips the /api/auth prefix and forwards the rest.
app.use(
  "/api/auth",
  proxy(process.env.AUTH_SERVICE, {
    proxyReqPathResolver: (req) => {
      // /api/auth/google → /google
      // /api/auth/me     → /me
      // /api/auth/logout  → /logout
      return req.url;
    },
    // Preserve cookies and headers
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      if (srcReq.headers.cookie) {
        proxyReqOpts.headers["cookie"] = srcReq.headers.cookie;
      }
      return proxyReqOpts;
    },
    // Forward Set-Cookie headers from auth service back to client
    userResHeaderDecorator: (headers) => {
      return headers;
    },
  })
);

// ─── Start Server ───────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});