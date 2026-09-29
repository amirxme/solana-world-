export default async function handler(req, res) {
  try {
    const RPC = "https://api.mainnet-beta.solana.com";

    const sourceAddress =
      "Vote111111111111111111111111111111111111111";

    async function rpc(method, params) {
      const response = await fetch(RPC, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method,
          params
        })
      });

      return await response.json();
    }

    const signaturesData = await rpc(
      "getSignaturesForAddress",
      [
        sourceAddress,
        {
          limit: 10
        }
      ]
    );

    const signatures =
      signaturesData.result || [];

    const transactions = [];
    const walletSet = new Set();

    for (const item of signatures) {
      const txData = await rpc(
        "getTransaction",
        [
          item.signature,
          {
            encoding: "jsonParsed",
            maxSupportedTransactionVersion: 0
          }
        ]
      );

      const tx = txData.result;

      if (!tx) continue;

      const accountKeys =
        tx.transaction?.message?.accountKeys || [];

      const wallets =
        accountKeys
          .map(account =>
            typeof account === "string"
              ? account
              : account.pubkey
          )
          .filter(Boolean);

      wallets.forEach(wallet =>
        walletSet.add(wallet)
      );

      transactions.push({
        signature: item.signature,
        slot: item.slot,
        blockTime:
          tx.blockTime ||
          item.blockTime ||
          null,
        wallets
      });
    }

    const balances = {};

    for (const wallet of walletSet) {
      try {
        const balanceData = await rpc(
          "getBalance",
          [wallet]
        );

        const lamports =
          balanceData.result?.value || 0;

        balances[wallet] =
          lamports / 1000000000;

      } catch (error) {
        balances[wallet] = 0;
      }
    }

    res.status(200).json({
      success: true,
      address: sourceAddress,
      balances,
      transactions
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}