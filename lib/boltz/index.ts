import BoltzBase from "./BoltzBase";
import SubmarineSwap from "./SubmarineSwap";
import ReverseSwap from "./ReverseSwap";
import ChainSwap from "./ChainSwap";
import { networks } from "bitcoinjs-lib";

export default class Boltz extends BoltzBase {
  private submarineSwap: SubmarineSwap;
  private reverseSwap: ReverseSwap;
  private chainSwap: ChainSwap;

  constructor(
    endpoint: string = "https://api.boltz.exchange/v2",
    network: networks.Network = networks.bitcoin
  ) {
    super(endpoint, network);
    this.submarineSwap = new SubmarineSwap(endpoint, network);
    this.reverseSwap = new ReverseSwap(endpoint, network);
    this.chainSwap = new ChainSwap(endpoint, network);
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
