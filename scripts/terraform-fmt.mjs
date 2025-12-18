import { execSync } from "node:child_process";
import { resolve } from "node:path";

const terraformDir = resolve("backend");

console.log("Formatting Terraform files in:", terraformDir);

try {
  // terraform fmt -recursive formats all .tf files in directory and subdirectories
  execSync("terraform fmt -recursive", {
    cwd: terraformDir,
    stdio: "inherit",
  });
  console.log("✓ Terraform formatting complete");
} catch (error) {
  console.error("✗ Terraform formatting failed:", error.message);
  process.exit(1);
}

