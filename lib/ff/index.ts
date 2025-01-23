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
  RateInfo,
  SetEmailRequest,
  SetEmailResponse,
} from "./types";
import { convertXML } from "simple-xml-to-json";

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

    return await fetch(url, {
      method: "POST",
      headers,
      body: data,
    }).then((res) => res.json());
  }

  public async currencies() {
    return this.fetch<{}, CurrencyResponse>("ccies", {});
  }

  public async absoluteRate(
    from: string,
    to: string,
  ): Promise<RateInfo | undefined> {
    const res = await fetch("https://ff.io/rates/fixed.xml").then((res) =>
      res.text(),
    );

    return convertXML(res)
      .rates.children.map((item: any) =>
        item.item.children
          .map((c: any) => {
            const k = Object.keys(c)[0];
            const content = c[k].content;

            const firstWord = content.split(" ")[0];
            const numericFirstWord = Number(firstWord);

            if (isNaN(numericFirstWord))
              return {
                [k]: firstWord,
              };

            return { [k]: numericFirstWord };
          })
          .reduce((a: any, b: any) => ({ ...a, ...b }), {}),
      )
      .find((item: any) => item.from === from && item.to === to);
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

export const fixedFloat = new FixedFloat(
  process.env.FF_API_KEY,
  process.env.FF_API_SECRET,
);
