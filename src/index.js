import { wallet } from "./wallet.js";

async function main() {
  const address = await wallet.getAddress();

  console.log(address.toString(true, true, true));
}

main();
