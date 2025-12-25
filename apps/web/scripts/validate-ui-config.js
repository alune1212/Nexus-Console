#!/usr/bin/env node

/**
 * UI Configuration Validation Script
 *
 * Validates consistency between components.json and Tailwind configuration
 * to ensure UI components maintain unified styling across the project.
 *
 * Usage: node scripts/validate-ui-config.js
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Read components.json
const componentsJsonPath = join(projectRoot, "components.json");
let componentsConfig;

try {
  const componentsJson = readFileSync(componentsJsonPath, "utf-8");
  componentsConfig = JSON.parse(componentsJson);
} catch (error) {
  console.error(`❌ Failed to read components.json: ${error.message}`);
  process.exit(1);
}

// Read tailwind.config.js
const tailwindConfigPath = join(projectRoot, "tailwind.config.js");
let tailwindConfigContent;

try {
  tailwindConfigContent = readFileSync(tailwindConfigPath, "utf-8");
} catch (error) {
  console.error(`❌ Failed to read tailwind.config.js: ${error.message}`);
  process.exit(1);
}

// Validation results
const errors = [];
const warnings = [];

// Validate components.json structure
console.log("🔍 Validating components.json...\n");

const requiredFields = ["style", "tailwind", "aliases"];
requiredFields.forEach((field) => {
  if (!componentsConfig[field]) {
    errors.push(`Missing required field: ${field}`);
  }
});

// Validate style consistency
if (componentsConfig.style) {
  const validStyles = ["new-york", "default"];
  if (!validStyles.includes(componentsConfig.style)) {
    errors.push(`Invalid style: ${componentsConfig.style}. Must be one of: ${validStyles.join(", ")}`);
  } else {
    console.log(`✅ Style: ${componentsConfig.style}`);
  }
}

// Validate baseColor
if (componentsConfig.tailwind?.baseColor) {
  const validBaseColors = ["slate", "gray", "zinc", "neutral", "stone"];
  if (!validBaseColors.includes(componentsConfig.tailwind.baseColor)) {
    warnings.push(`Uncommon baseColor: ${componentsConfig.tailwind.baseColor}`);
  } else {
    console.log(`✅ Base Color: ${componentsConfig.tailwind.baseColor}`);
  }
}

// Validate CSS variables usage
if (componentsConfig.tailwind?.cssVariables !== true) {
  warnings.push("cssVariables should be true for theme support");
} else {
  console.log(`✅ CSS Variables: enabled`);
}

// Validate aliases
if (componentsConfig.aliases) {
  const requiredAliases = ["components", "utils", "ui"];
  requiredAliases.forEach((alias) => {
    if (!componentsConfig.aliases[alias]) {
      errors.push(`Missing required alias: ${alias}`);
    }
  });
  console.log(`✅ Aliases: configured`);
}

// Validate Tailwind content paths
if (tailwindConfigContent.includes("src")) {
  console.log(`✅ Tailwind content: includes src directory`);
} else {
  warnings.push("Tailwind content should include 'src' directory");
}

// Check for CSS variables in index.css
const indexCssPath = join(projectRoot, "src", "index.css");
try {
  const indexCss = readFileSync(indexCssPath, "utf-8");
  const hasColorVariables = indexCss.includes("--color-");
  if (!hasColorVariables) {
    warnings.push("index.css should define CSS color variables (--color-*)");
  } else {
    console.log(`✅ CSS Variables: defined in index.css`);
  }
} catch (error) {
  warnings.push(`Could not read index.css: ${error.message}`);
}

// Summary
console.log("\n" + "=".repeat(50));
if (errors.length === 0 && warnings.length === 0) {
  console.log("✅ All validations passed!");
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.error("\n❌ Errors found:");
    errors.forEach((error) => console.error(`  - ${error}`));
  }
  if (warnings.length > 0) {
    console.warn("\n⚠️  Warnings:");
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }
  process.exit(errors.length > 0 ? 1 : 0);
}

