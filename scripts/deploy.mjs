import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backend = path.join(root, "backend");
const action = process.argv[2];
const isRender = process.env.RENDER === "true";

if (action !== "build" && action !== "start" && action !== "migrate") {
  console.error("Usage: node scripts/deploy.mjs <build|start|migrate>");
  process.exit(2);
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (isRender) {
  if (action === "build") {
    run("npm", ["install"], backend);
    run("npm", ["run", "db:generate"], backend);
    run("npm", ["run", "build"], backend);
  } else if (action === "migrate") {
    run("npm", ["run", "db:migrate"], backend);
  } else {
    run("npm", ["start"], backend);
  }
} else {
  const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
  run(process.execPath, [nextCli, action], root);
}