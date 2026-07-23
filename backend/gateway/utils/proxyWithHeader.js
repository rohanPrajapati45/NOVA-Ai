import axios from "axios";

/**
 * createProxyWithAuth(targetServiceUrl)
 *
 * Returns an Express middleware that:
 * 1. Assumes verifySession has already run (req.userId is set)
 * 2. Forwards the request to the target microservice
 * 3. Attaches x-user-id header (so the downstream service knows who's calling)
 * 4. Does NOT forward cookies — downstream services trust the header, not raw sessions
 * 5. Pipes the downstream response back to the original client
 *
 * Why axios instead of http-proxy-middleware:
 *   - We need selective header forwarding (add x-user-id, strip cookies)
 *   - axios is already a known dependency pattern in this project
 *   - Simpler than configuring http-proxy-middleware's onProxyReq hooks
 */
export const createProxyWithAuth = (targetServiceUrl) => {
  return async (req, res) => {
    try {
      const url = `${targetServiceUrl}${req.originalUrl.replace(/^\/api\/chat/, "")}`;

      const response = await axios({
        method: req.method,
        url,
        data: req.body,
        headers: {
          "Content-Type": "application/json",
          "x-user-id": req.userId, // Forwarded from verifySession
          // Intentionally NOT forwarding cookies — chat service doesn't need them
        },
        // Don't let axios throw on non-2xx — we want to forward the exact status
        validateStatus: () => true,
      });

      // Forward the downstream status code and body back to the client
      return res.status(response.status).json(response.data);
    } catch (error) {
      console.error("Proxy error:", error.message);
      return res.status(502).json({ message: "Bad Gateway — downstream service unreachable" });
    }
  };
};
