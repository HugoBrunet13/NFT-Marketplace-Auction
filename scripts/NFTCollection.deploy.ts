import { deploy } from "./deployUtils";

deploy("NFTCollection", []).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
