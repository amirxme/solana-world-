export default async function handler(req, res) {
  try {
    const address =
      req.query.address ||
      "Vote111111111111111111111111111111111111111";

    const rpc = "https://api.mainnet-beta.solana.com";

    // Получаем последние транзакции адреса
    const signaturesResponse = await fetch(rpc, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [
          address,
          {
            limit: 10,
            commitment: "confirmed"
          }
        ]
      })
    });

    const signaturesData = await signaturesResponse.json();
    const signatures = signaturesData.result || [];

    // Получаем подробности транзакций
    const transactions = await Promise.all(
      signatures.slice(0, 10).map(async (item) => {
        try {
          const response = await fetch(rpc, {
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
                  commitment: "confirmed",
                  encoding: "jsonParsed",
                  maxSupportedTransactionVersion: 0
                }
              ]
            })
          });

          const data = await response.json();
          const tx = data.result;

          if (!tx) return null;

          const accounts =
            tx.transaction?.message?.accountKeys || [];

          const wallets = accounts
            .map(account => {
              if (typeof account === "string") {
                return account;
              }

              return account.pubkey;
            })
            .filter(Boolean)
            .slice(0, 8);

          return {
            signature: item.signature,
            slot: item.slot,
            blockTime: item.blockTime,
            wallets
          };

        } catch {
          return null;
        }
      })
    );

    res.status(200).json({
      success: true,
      address,
      transactions: transactions.filter(Boolean)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}