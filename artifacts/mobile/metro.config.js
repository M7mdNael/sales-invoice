const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const http = require("http");

const projectRoot = path.resolve(__dirname);
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.projectRoot = projectRoot;

config.watchFolders = [
  workspaceRoot,
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(workspaceRoot, "lib/db"),
  path.resolve(workspaceRoot, "lib/api-zod"),
  path.resolve(workspaceRoot, "lib/api-spec"),
  path.resolve(workspaceRoot, "lib/api-client-react"),
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url && req.url.startsWith("/api/")) {
        const proxyOptions = {
          hostname: "localhost",
          port: 8080,
          path: req.url,
          method: req.method,
          headers: { ...req.headers, host: "localhost:8080" },
        };
        const proxyReq = http.request(proxyOptions, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        });
        proxyReq.on("error", () => {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "API server unavailable" }));
        });
        req.pipe(proxyReq, { end: true });
      } else {
        middleware(req, res, next);
      }
    };
  },
};

module.exports = config;
