import { Currency } from "./ff/types";

export interface CurrencyWithContractAddress extends Currency {
  contractAddress: string;
}

export const lightningCurrency: CurrencyWithContractAddress = {
  code: "BTCLN",
  coin: "BTCLN",
  network: "BTCLN",
  priority: 6,
  name: "Lightning",
  recv: true,
  send: true,
  tag: "",
  logo: "/lightning.svg",
  color: "#9157ff",
  contractAddress: "",
};

export const currencyStats: Array<CurrencyWithContractAddress> = [
  lightningCurrency,
  {
    code: "BTC",
    coin: "BTC",
    network: "BTC",
    priority: 5,
    name: "Bitcoin",
    recv: true,
    send: true,
    tag: "",
    logo: "https://ff.io/assets/images/coins/svg/btc.svg",
    color: "#f7931a",
    contractAddress: "",
  },
  {
    code: "ETH",
    coin: "ETH",
    network: "ETH",
    priority: 4,
    name: "Ethereum",
    recv: true,
    send: false,
    tag: "",
    logo: "https://ff.io/assets/images/coins/svg/eth.svg",
    color: "#000",
    contractAddress: "",
  },
  {
    code: "USDCETH",
    coin: "USDC",
    network: "ETH",
    priority: 0,
    name: "USDC",
    recv: true,
    send: true,
    tag: "",
    logo: "https://ff.io/assets/images/coins/svg/usdceth.svg",
    color: "#2775ca",
    contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  {
    code: "USDT",
    coin: "USDT",
    network: "ETH",
    priority: 4,
    name: "USDT",
    recv: true,
    send: false,
    tag: "",
    logo: "https://ff.io/assets/images/coins/svg/usdt.svg",
    color: "#53ae94",
    contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
  {
    code: "USDTTRC",
    coin: "USDT",
    network: "TRX",
    priority: 4,
    name: "USDTTRC",
    recv: true,
    send: true,
    tag: "",
    logo: "https://ff.io/assets/images/coins/svg/usdttrc.svg",
    color: "#53ae94",
    contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  },
];

export const boltzStatusSteps = ["new", "created", "pending", "done"];

export type BoltzStatus = (typeof boltzStatusSteps)[number];
