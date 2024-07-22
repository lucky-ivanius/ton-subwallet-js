import { doWithdraw, prepare, USDT_JETTONS_INFO, wallet } from "./wallet.js";

async function main() {
  const address = await wallet.getAddress();

  console.log("Address:", address.toString(true, true, true));

  await prepare();

  const walletUsdtData = await USDT_JETTONS_INFO.jettonWallet.getData();
  const usdtBalance = walletUsdtData.balance;

  console.log("USDT Balance:", usdtBalance.toString());

  const recipientAddress = "YOUR_RECIPIENT_ADDRESS";

  const withdrawalRequest = {
    amount: walletUsdtData.balance,
    toAddress: recipientAddress,
  };

  await doWithdraw(withdrawalRequest);
}

main();
