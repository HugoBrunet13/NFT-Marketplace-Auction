import { deploy } from "./deployUtils";

deploy("ERC20", ["100000", "MyToken", "MTK"]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
