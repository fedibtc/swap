import BoltzBase from "./BoltzBase";
import SubmarineSwap from "./SubmarineSwap";
import ReverseSwap from "./ReverseSwap";
import ChainSwap from "./ChainSwap";
import { networks } from "bitcoinjs-lib";

type NetworkType = "mainnet" | "testnet" | "regtest";

export default class Boltz extends BoltzBase {
  private submarineSwap: SubmarineSwap;
  private reverseSwap: ReverseSwap;
  private chainSwap: ChainSwap;

  constructor(networkType: NetworkType = "mainnet") {
    const { endpoint, wsEndpoint, network } =
      Boltz.getNetworkConfig(networkType);
    super(endpoint, wsEndpoint, network);
    this.submarineSwap = new SubmarineSwap(endpoint, wsEndpoint, network);
    this.reverseSwap = new ReverseSwap(endpoint, wsEndpoint, network);
    this.chainSwap = new ChainSwap(endpoint, wsEndpoint, network);
  }

  private static getNetworkConfig(networkType: NetworkType) {
    switch (networkType) {
      case "testnet":
        return {
          endpoint: "https://api.testnet.boltz.exchange/v2",
          wsEndpoint: "wss://api.testnet.boltz.exchange/v2/ws",
          network: networks.testnet,
        };
      case "regtest":
        return {
          endpoint: "http://127.0.0.1:9001/v2",
          wsEndpoint: "ws://127.0.0.1:9001/v2/ws",
          network: networks.regtest,
        };
      case "mainnet":
      default:
        return {
          endpoint: "https://api.boltz.exchange/v2",
          wsEndpoint: "wss://api.boltz.exchange/v2/ws",
          network: networks.bitcoin,
        };
    }
  }

  public async createSubmarineSwap(
    invoice: string,
    refundAddress: string
  ): Promise<void> {
    return this.submarineSwap.submarineSwap(invoice, refundAddress);
  }

  public async createReverseSwap(
    amount: number,
    destinationAddress: string
  ): Promise<void> {
    return this.reverseSwap.reverseSwap(amount, destinationAddress);
  }

  public async createChainSwapBTC2LQD(
    amount: number,
    destinationAddress: string
  ): Promise<void> {
    return this.chainSwap.chainSwapBTC2LQD(amount, destinationAddress);
  }

  public async createChainSwapLQD2BTC(
    amount: number,
    destinationAddress: string
  ): Promise<void> {
    return this.chainSwap.chainSwapLQD2BTC(amount, destinationAddress);
  }
}
