import { deploy } from "./deployUtils";

deploy("Marketplace", ["My Marketplace"]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
