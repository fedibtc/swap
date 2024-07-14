export const tokens = [
  {
    code: "BTC",
    contract_address: "",
    name: "BTC",
    network: "bitcoin",
  },
  {
    code: "USDCETH",
    contract_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    name: "USDC",
    network: "ethereum",
  },
  // {
  //   code: "USDCTRC",
  //   contract_address: "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8",
  //   name: "USDC",
  //   network: "tron",
  // },
  {
    code: "USDT",
    contract_address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    name: "USDT",
    network: "ethereum",
  },
  {
    code: "USDTTRC",
    contract_address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    name: "USDT",
    network: "tron",
  },
];

export type Token = (typeof tokens)[number]["code"];
