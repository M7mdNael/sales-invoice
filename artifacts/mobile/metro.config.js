const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

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

module.exports = config;
