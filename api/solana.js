export default async function handler(req, res) {
  const RPC = "https://api.mainnet-beta.solana.com";

  const sourceAddress =
    "Vote111111111111111111111111111111111111111";

  try {
    const response = await fetch(RPC, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [
          sourceAddress,
          {
            limit: 10
          }
        ]
      })
    });

    const data = await response.json();

    const signatures = data.result || [];
    const transactions = [];

    for (const item of signatures) {
      const txResponse = await fetch(RPC, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTransaction",
          params: [
            item.signature,
            {
              encoding: "jsonParsed",
              maxSupportedTransactionVersion: 0
            }
          ]
        })
      });

      const txData = await txResponse.json();
      const tx = txData.result;

      if (!tx) continue;

      const accountKeys =
        tx.transaction?.message?.accountKeys || [];

      const wallets = accountKeys
        .map(account =>
          typeof account === "string"
            ? account
            : account.pubkey
        )
        .filter(Boolean);

      transactions.push({
        signature: item.signature,
        slot: item.slot,
        blockTime: item.blockTime,
        wallets
      });
    }

    const uniqueWallets = [
      ...new Set(
        transactions.flatMap(
          tx => tx.wallets
        )
      )
    ];

    const balances = {};

    for (const address of uniqueWallets) {
      const balanceResponse = await fetch(RPC, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [address]
        })
      });

      const balanceData =
        await balanceResponse.json();

      const lamports =
        balanceData.result?.value;

      if (typeof lamports === "number") {
        balances[address] =
          lamports / 1000000000;
      }
    }

    res.status(200).json({
      success: true,
      address: sourceAddress,
      balances,
      transactions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}