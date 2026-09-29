export default async function handler(req, res) {
  try {
    const address =
      req.query.address ||
      "Vote111111111111111111111111111111111111111";

    const response = await fetch(
      "https://api.mainnet-beta.solana.com",
      {
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
      }
    );

    const data = await response.json();

    res.status(200).json({
      success: true,
      address: address,
      transactions: data.result || []
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}