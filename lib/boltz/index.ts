import {
  BroadcastClaimedTransactionRequest,
  BroadcastClaimedTransactionResponse,
  ClaimReverseSwapRequest,
  ClaimReverseSwapResponse,
  ClaimSubmarineSwapInfo,
  ClaimSubmarineSwapRequest,
  ClaimSubmarineSwapResponse,
  ReverseSwapRateResponse,
  ReverseSwapRequest,
  ReverseSwapResponse,
  SubmarineSwapRateResponse,
  SubmarineSwapRequest,
  SubmarineSwapResponse,
} from "./types";

export class Boltz {
  constructor() {}

  public async createSubmarineSwap(body: SubmarineSwapRequest) {
    return this.post<SubmarineSwapRequest, SubmarineSwapResponse>(
      "swap/submarine",
      body,
    );
  }

  public async createReverseSwap(body: ReverseSwapRequest) {
    return this.post<ReverseSwapRequest, ReverseSwapResponse>(
      "swap/reverse",
      body,
    );
  }

  public async submarineSwapRate() {
    return this.get<SubmarineSwapRateResponse>("swap/submarine");
  }

  public async reverseSwapRate() {
    return this.get<ReverseSwapRateResponse>("swap/reverse");
  }

  public async claimReverseSwap(id: string, body: ClaimReverseSwapRequest) {
    return this.post<ClaimReverseSwapRequest, ClaimReverseSwapResponse>(
      `swap/reverse/${id}/claim`,
      body,
    );
  }

  public async claimSubmarineSwap(id: string, body: ClaimSubmarineSwapRequest) {
    return this.post<ClaimSubmarineSwapRequest, ClaimSubmarineSwapResponse>(
      `swap/submarine/${id}/claim`,
      body,
    );
  }

  public async broadcastClaimedTransaction(hex: string) {
    return this.post<
      BroadcastClaimedTransactionRequest,
      BroadcastClaimedTransactionResponse
    >("chain/BTC/transaction", { hex });
  }

  public async getClaimSubmarineSwapInfo(id: string) {
    return this.get<ClaimSubmarineSwapInfo>(`swap/submarine/${id}/claim`);
  }

  private async post<Req extends {}, Res extends {}>(
    endpoint: string,
    body: Req,
  ): Promise<Res> {
    const res = await fetch(`https://api.boltz.exchange/v2/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const response = await res.json();

    if ("error" in response) {
      throw new Error(response.error);
    }

    return response;
  }

  private async get<Res extends {}>(endpoint: string): Promise<Res> {
    const res = await fetch(`https://api.boltz.exchange/v2/${endpoint}`);
    const response = await res.json();

    if ("error" in response) {
      throw new Error(response.error);
    }

    return response;
  }
}

export const boltz = new Boltz();
