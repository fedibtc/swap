import BoltzBase from "./BoltzBase";
import SubmarineSwap from "./SubmarineSwap";
import ReverseSwap from "./ReverseSwap";
import ChainSwap from "./ChainSwap";
import { networks } from "bitcoinjs-lib";
import {
  ChainSwapResponse,
  NetworkType,
  ReverseSwapResponse,
  SubmarineSwapResponse,
  SwapOutcome,
  SwapType,
} from "./types";
import WebSocket from "ws";

export default class Boltz extends BoltzBase {
  private submarineSwap: SubmarineSwap;
  private reverseSwap: ReverseSwap;
  private chainSwap: ChainSwap;

  constructor(networkType: NetworkType = NetworkType.Mainnet) {
    const { endpoint, wsEndpoint, network } =
      Boltz.getNetworkConfig(networkType);
    super(endpoint, wsEndpoint, network);
    this.submarineSwap = new SubmarineSwap(endpoint, wsEndpoint, network);
    this.reverseSwap = new ReverseSwap(endpoint, wsEndpoint, network);
    this.chainSwap = new ChainSwap(endpoint, wsEndpoint, network);
  }

  private static getNetworkConfig(networkType: NetworkType) {
    switch (networkType) {
      case NetworkType.Testnet:
        return {
          endpoint: "https://api.testnet.boltz.exchange/v2",
          wsEndpoint: "wss://api.testnet.boltz.exchange/v2/ws",
          network: networks.testnet,
        };
      case NetworkType.Regtest:
        return {
          endpoint: "http://127.0.0.1:9001/v2",
          wsEndpoint: "ws://127.0.0.1:9001/v2/ws",
          network: networks.regtest,
        };
      case NetworkType.Mainnet:
      default:
        return {
          endpoint: "https://api.boltz.exchange/v2",
          wsEndpoint: "wss://api.boltz.exchange/v2/ws",
          network: networks.bitcoin,
        };
    }
  }

  public async awaitSwapOutcome(
    swapId: string,
    swapType: SwapType,
  ): Promise<SwapOutcome> {
    return new Promise((resolve, reject) => {
      const webSocket = super.createAndSubscribeToWebSocket(swapId, swapType);
      console.log("WebSocket created and subscribed to swap ID:", swapId);
      let handlers: any;
      switch (swapType) {
        case SwapType.Submarine:
          handlers = this.submarineSwap.getWebSocketHandlers();
          break;
        case SwapType.Reverse:
          handlers = this.reverseSwap.getWebSocketHandlers();
          break;
        case SwapType.Chain:
          handlers = this.chainSwap.getWebSocketHandlers();
          break;
        default:
          reject(new Error(`Unsupported swap type: ${swapType}`));
          return;
      }

      const handleMessage = (message: WebSocket.Data) => {
        const parsedMessage = JSON.parse(message.toString());
        console.log("Received message:", parsedMessage);
        if (parsedMessage.type === "swap.update") {
          const outcome = handlers.handleSwapUpdate(parsedMessage);
          if (outcome) {
            console.log("Swap outcome:", outcome);
            webSocket.close();
            resolve(outcome);
          }
        }
      };

      webSocket.on("message", handleMessage);
      webSocket.on("error", (error) => {
        webSocket.close();
        reject(error);
      });
    });
  }

  public async createSubmarineSwap(
    invoice: string,
    refundAddress: string,
  ): Promise<SubmarineSwapResponse> {
    return this.submarineSwap.submarineSwap(invoice, refundAddress);
  }

  public async createReverseSwap(amount: number): Promise<ReverseSwapResponse> {
    return this.reverseSwap.reverseSwap(amount);
  }

  public async createChainSwapBTC2LQD(
    amount: number,
    destinationAddress: string,
  ): Promise<ChainSwapResponse> {
    return this.chainSwap.chainSwapBTC2LQD(amount, destinationAddress);
  }

  public async createChainSwapLQD2BTC(
    amount: number,
    destinationAddress: string,
  ): Promise<ChainSwapResponse> {
    return this.chainSwap.chainSwapLQD2BTC(amount, destinationAddress);
  }
}
