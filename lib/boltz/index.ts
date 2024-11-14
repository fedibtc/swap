import {
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
      "POST",
      body
    );
  }

  public async createReverseSwap(body: ReverseSwapRequest) {
    return this.post<ReverseSwapRequest, ReverseSwapResponse>(
      "swap/reverse",
      "POST",
      body
    );
  }

  public async submarineSwapRate() {
    return this.get<SubmarineSwapRateResponse>("swap/submarine", {});
  }

  public async reverseSwapRate() {
    return this.get<ReverseSwapRateResponse>("swap/reverse", {});
  }

  private async post<Req extends {}, Res extends {}>(
    endpoint: string,
    method: "GET" | "POST",
    body: Req
  ): Promise<Res> {
    const res = await fetch(`https://api.boltz.exchange/v2/${endpoint}`, {
      method,
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

  private async get<Res extends {}>(endpoint: string, body: any): Promise<Res> {
    const res = await fetch(`https://api.boltz.exchange/v2/${endpoint}`);
    const response = await res.json();

    if ("error" in response) {
      throw new Error(response.error);
    }

    return response;
  }
}

export const boltz = new Boltz();
