import axios from "axios";
import { networks, initEccLib } from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import WebSocket from "ws";
import { SwapType } from "./types";

export default class BoltzBase {
  protected endpoint: string;
  protected wsEndpoint: string;
  protected network: networks.Network;

  constructor(endpoint: string, wsEndpoint: string, network: networks.Network) {
    this.endpoint = endpoint;
    this.wsEndpoint = wsEndpoint;
    this.network = network;
    initEccLib(ecc);
  }

  protected async fetch<Req extends {}, Res extends {}>(
    path: string,
    method: "GET" | "POST",
    body?: Req,
  ): Promise<Res> {
    const url = `${this.endpoint}${path}`;
    const config = {
      method,
      url,
      data: body,
      headers: { "Content-Type": "application/json" },
    };

    const response = await axios(config);
    return response.data;
  }

  protected createAndSubscribeToWebSocket(
    swapId: string,
    swapType: SwapType,
  ): WebSocket {
    const webSocket = new WebSocket(this.wsEndpoint);
    webSocket.on("open", () => {
      webSocket.send(
        JSON.stringify({
          op: "subscribe",
          channel: "swap.update",
          args: [swapId],
        }),
      );
    });
    return webSocket;
  }

  protected handleWebSocketMessage(
    webSocket: WebSocket,
    handlers: {
      [key: string]: (args: any) => Promise<void>;
    },
  ) {
    webSocket.on("message", async (rawMsg) => {
      const msg = JSON.parse(rawMsg.toString("utf-8"));
      if (msg.event !== "update") return;

      console.log("WebSocket update:", msg);

      const handler = handlers[msg.args[0].status];
      if (handler) {
        await handler(msg.args[0]);
      }
    });
  }
}
