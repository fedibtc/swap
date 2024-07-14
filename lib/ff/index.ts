import axios from "axios";
import crypto from "crypto";
import {
  CreateRequest,
  CreateResponse,
  CurrencyResponse,
  EmergencyRequest,
  EmergencyResponse,
  OrderRequest,
  OrderResponse,
  PriceRequest,
  PriceResponse,
  QRRequest,
  QRResponse,
  SetEmailRequest,
  SetEmailResponse,
} from "./types";

export default class FixedFloat {
  private apiKey: string;
  private apiSecret: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  private sign(body: any) {
    return crypto
      .createHmac("sha256", this.apiSecret)
      .update(body)
      .digest("hex");
  }

  private async fetch<Req extends {}, Res extends {}>(
    endpoint: string,
    body: Req,
  ): Promise<Res> {
    const url = `https://ff.io/api/v2/${endpoint}`;
    const data = JSON.stringify(body);
    const headers = {
      "X-API-KEY": this.apiKey,
      "X-API-SIGN": this.sign(data),
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, data, { headers });

    return response.data;
  }

  public async currencies() {
    return this.fetch<{}, CurrencyResponse>("ccies", {});
  }

  public async price(body: PriceRequest) {
    return this.fetch<PriceRequest, PriceResponse>("price", body);
  }

  public async create(body: CreateRequest) {
    return this.fetch<CreateRequest, CreateResponse>("create", body);
  }

  public async order(body: OrderRequest) {
    return this.fetch<OrderRequest, OrderResponse>("order", body);
  }

  public async emergency(body: EmergencyRequest) {
    return this.fetch<EmergencyRequest, EmergencyResponse>("emergency", body);
  }

  public async setEmail(body: SetEmailRequest) {
    return this.fetch<SetEmailRequest, SetEmailResponse>("setEmail", body);
  }

  public async qr(body: QRRequest) {
    return this.fetch<QRRequest, QRResponse>("qr", body);
  }
}

export const fixedFloat = new FixedFloat(process.env.FF_API_KEY, process.env.FF_API_SECRET);
