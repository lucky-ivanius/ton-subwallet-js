import TonWeb from "tonweb";
import TonWebMnemonic from "tonweb-mnemonic";
import dotenv from "dotenv";

dotenv.config();

const BN = TonWeb.utils.BN;

const { SECRET_KEYS, TONCENTER_MAINNET_API_KEY } = process.env;

const tonweb = new TonWeb(
  new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
    apiKey: TONCENTER_MAINNET_API_KEY,
  })
);

const seed = await TonWebMnemonic.mnemonicToSeed(SECRET_KEYS.split(" "));
const keyPair = TonWeb.utils.keyPairFromSeed(seed);

const WalletClass = tonweb.wallet.all.v3R2;

// Subwallet ID
const walletId = 1;

const wallet = new WalletClass(tonweb.provider, {
  publicKey: keyPair.publicKey,
  walletId,
});

// https://github.com/toncenter/examples/blob/main/withdrawals-jettons.js
const USDT_JETTONS_INFO = {
  address: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
  decimals: 6,
};

const prepare = async () => {
  const hotWalletAddress = await wallet.getAddress();
  const jettonMinter = new TonWeb.token.jetton.JettonMinter(tonweb.provider, {
    address: USDT_JETTONS_INFO.address,
  });
  const jettonWalletAddress = await jettonMinter.getJettonWalletAddress(
    hotWalletAddress
  );
  console.log(
    "My jetton wallet for" + jettonWalletAddress.toString(true, true, true)
  );
  const jettonWallet = new TonWeb.token.jetton.JettonWallet(tonweb.provider, {
    address: jettonWalletAddress,
  });
  USDT_JETTONS_INFO.jettonMinter = jettonMinter;
  USDT_JETTONS_INFO.jettonWalletAddress = jettonWalletAddress;
  USDT_JETTONS_INFO.jettonWallet = jettonWallet;
};

const doWithdraw = async (withdrawalRequest) => {
  const seqno = (await wallet.methods.seqno().call()) || 0; // get the current wallet `seqno` from the network
  const hotWalletAddress = await wallet.getAddress();

  await prepare();

  const toncoinAmount = TonWeb.utils.toNano("0.011"); // 0.011 TON
  const jettonWalletAddress = USDT_JETTONS_INFO.jettonWalletAddress.toString(
    true,
    true,
    true
  );
  const jettonBalance = (await USDT_JETTONS_INFO.jettonWallet.getData())
    .balance;

  if (new BN(withdrawalRequest.amount).gt(jettonBalance)) {
    console.log(
      "there is not enough Jetton balance to process the Jetton withdrawal"
    );
    return false;
  }

  const transfer = await wallet.methods.transfer({
    secretKey: keyPair.secretKey,
    toAddress: jettonWalletAddress,
    amount: toncoinAmount,
    seqno: seqno,
    payload: await USDT_JETTONS_INFO.jettonWallet.createTransferBody({
      queryId: seqno, // any number
      jettonAmount: withdrawalRequest.amount, // jetton amount in units
      toAddress: new TonWeb.utils.Address(withdrawalRequest.toAddress),
      responseAddress: hotWalletAddress,
    }),
  });

  const ret = await transfer.send(); // send transfer request to network
  console.log(
    ` => ${seqno} ${withdrawalRequest.withdrawId} ${withdrawalRequest.withdrawAmount} sent`
  );
  return true;
};

export { doWithdraw, wallet };
