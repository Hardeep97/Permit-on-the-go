const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3. Ensure Metro resolves react-native and browser fields from package.json
// This fixes axios and similar packages that have platform-specific exports
config.resolver.resolverMainFields = ["react-native", "browser", "main"];

// 4. Enable package exports condition names for react-native
config.resolver.unstable_conditionNames = ["react-native", "browser", "require", "import"];

// 5. Force single React instance by redirecting all React-related requires
// to the mobile app's node_modules (React 18.3.1)
const mobileNodeModules = path.resolve(projectRoot, "node_modules");
const rootNodeModules = path.resolve(monorepoRoot, "node_modules");
const forcedModules = {
  react: path.resolve(mobileNodeModules, "react/index.js"),
  "react/jsx-runtime": path.resolve(mobileNodeModules, "react/jsx-runtime.js"),
  "react/jsx-dev-runtime": path.resolve(mobileNodeModules, "react/jsx-dev-runtime.js"),
  "react-dom": path.resolve(mobileNodeModules, "react-dom/index.js"),
  "react-native": path.resolve(rootNodeModules, "react-native/index.js"),
  // Force axios to use the browser build instead of Node.js build
  axios: path.resolve(rootNodeModules, "axios/dist/browser/axios.cjs"),
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (forcedModules[moduleName]) {
    return {
      filePath: forcedModules[moduleName],
      type: "sourceFile",
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
