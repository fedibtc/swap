export interface FFResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export type CurrencyResponse = FFResponse<Array<Currency>>;

export interface Currency {
  code: string;
  coin: string;
  network: string;
  name: string;
  recv: boolean;
  send: boolean;
  tag: string;
  logo: string;
  color: string;
  priority: number;
}

export interface PriceRequest {
  type: string;
  fromCcy: string;
  toCcy: string;
  direction: string;
  amount: number;
  ccies?: boolean;
  usd?: boolean;
  refcode?: string;
  afftax?: number;
}

export interface PriceData {
  from: PriceDirectionBtc;
  to: PriceDirection;
  errors: Array<string>;
  ccies: Array<PriceCurrency>;
}

export type PriceResponse = FFResponse<PriceData>;

export interface PriceCurrency {
  code: string;
  recv: boolean;
  send: boolean;
}

export enum PriceError {
  MAINTENANCE_FROM = "MAINTENANCE_FROM",
  MAINTENANCE_TO = "MAINTENANCE_TO",
  OFFLINE_FROM = "OFFLINE_FROM",
  OFFLINE_TO = "OFFLINE_TO",
  RESERVE_FROM = "RESERVE_FROM",
  RESERVE_TO = "RESERVE_TO",
  LIMIT_MIN = "LIMIT_MIN",
  LIMIT_MAX = "LIMIT_MAX",
}

export interface PriceDirection {
  code: string;
  network: string;
  coin: string;
  amount: string;
  rate: string;
  precision: number;
  min: string;
  max: string;
  usd: string;
}

export type PriceDirectionBtc = PriceDirection & {
  btc: string;
};

export interface CreateRequest {
  type: string;
  fromCcy: string;
  toCcy: string;
  direction: string;
  amount: number;
  toAddress: string;
  tag?: boolean;
  refcode?: string;
  afftax?: number;
}

export interface CreateData {
  token: string;
  id: string;
  type: string;
  email: string;
  status: OrderStatus;
  time: Time;
  from: From;
  to: To;
  back: Back;
  emergency: Emergency;
}

export type CreateResponse = FFResponse<CreateData>;

export interface Time {
  reg: number;
  start: number;
  finish: number;
  update: number;
  expiration: number;
  left: number;
}

export interface From {
  code: string;
  coin: string;
  network: string;
  name: string;
  alias: string;
  amount: string;
  address: string;
  tag: string;
  addressMix: string;
  reqConfirmations: number;
  maxConfirmations: number;
  tx: Transaction;
}

export interface To {
  code: string;
  coin: string;
  network: string;
  name: string;
  alias: string;
  amount: string;
  address: string;
  tag: string;
  addressMix: string;
  tx: Transaction;
}

export interface Back {
  code: string;
  coin: string;
  network: string;
  name: string;
  alias: string;
  amount: string;
  address: string;
  tag: string;
  addressMix: string;
  tx: Transaction;
}

export interface Emergency {
  status: Array<EmergencyStatus>;
  choice: EmergencyChoice;
  repeat: boolean;
}

export interface Transaction {
  id: string;
  amount: string;
  fee: string;
  ccyfee: string;
  timeReg: number;
  timeBlock: number;
  confirmations: number;
}

export enum EmergencyStatus {
  EXPIRED = "EXPIRED",
  LESS = "LESS",
  MORE = "MORE",
  LIMIT = "LIMIT",
}

export enum EmergencyChoice {
  NONE = "NONE",
  EXCHANGE = "EXCHANGE",
  REFUND = "REFUND",
}

export interface OrderRequest {
  id: string;
  token: string;
}

export interface OrderData {
  id: string;
  type: string;
  email: string;
  status: OrderStatus;
  time: Time;
  from: From;
  to: To;
  back: Back;
  emergency: Emergency;
}

export enum OrderStatus {
  NEW = "NEW",
  PENDING = "PENDING",
  EXCHANGE = "EXCHANGE",
  WITHDRAW = "WITHDRAW",
  DONE = "DONE",
  EXPIRED = "EXPIRED",
  EMERGENCY = "EMERGENCY",
}

export type OrderResponse = FFResponse<OrderData>;

export interface EmergencyRequestExchange {
  id: string;
  token: string;
  choice: "EXCHANGE";
  tag?: string;
}

export interface EmergencyRequestRefund {
  id: string;
  token: string;
  choice: "REFUND";
  address: string;
  tag?: string;
}

export type EmergencyRequest =
  | EmergencyRequestExchange
  | EmergencyRequestRefund;

export type EmergencyResponse = FFResponse<boolean>;

export interface SetEmailRequest {
  id: string;
  token: string;
  email: string;
}

export type SetEmailResponse = FFResponse<boolean>;

export interface QRRequest {
  id: string;
  token: string;
}

export interface QRData {
  title: string;
  src: string;
  checked: boolean;
}

export type QRResponse = FFResponse<QRData>;
