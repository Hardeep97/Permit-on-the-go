const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
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
config.resolver.unstable_conditionNames = ["react-native", "browser", "require", "default", "import"];

// 5. Force axios to use the browser build instead of the Node.js build
const rootNodeModules = path.resolve(monorepoRoot, "node_modules");
const forcedModules = {
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

  // Force @babel/runtime helpers to use CJS (not ESM) to avoid
  // "is not a function" errors on web where Metro picks ESM via exports map
  if (moduleName.startsWith("@babel/runtime/helpers/") && !moduleName.includes("/esm/")) {
    const helperName = moduleName.replace("@babel/runtime/helpers/", "");
    const cjsPath = path.resolve(rootNodeModules, "@babel/runtime/helpers", helperName + ".js");
    return {
      filePath: cjsPath,
      type: "sourceFile",
    };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  configPath: path.resolve(projectRoot, "tailwind.config.js"),
  projectRoot,
});
