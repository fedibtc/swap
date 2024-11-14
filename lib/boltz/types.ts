export interface SubmarineSwapRequest {
  from: string;
  to: string;
  invoice?: string;
  preimageHash?: string;
  refundPublicKey: string;
  pairHash?: string;
  referalId?: string;
  webhook?: WebhookData;
}

export interface ReverseSwapRequest {
  from: string;
  to: string;
  preimageHash: string;
  claimPublicKey?: string;
  claimAddress?: string;
  invoiceAmount?: number;
  onchainAmount?: number;
  pairHash?: string;
  referralId?: string;
  address?: string;
  addressSignature?: string;
  claimCovenant?: boolean;
  description?: string;
  descriptionHash?: string;
  invoiceExpiry?: number;
  webhook?: WebhookData;
}

export interface ReverseSwapResponse {
  id: string;
  invoice: string;
  swapTree: SwapTree;
  lockupAddress: string;
  refundPublicKey: string;
  timeoutBlockHeight: number;
  onchainAmount: number;
  bindingKey: string;
  referralId: string;
}

export interface SubmarineSwapResponse {
  id: string;
  bip21: string;
  address: string;
  swapTree: SwapTree;
  claimPublicKey: string;
  timeoutBlockHeight: number;
  acceptZeroConf: boolean;
  expectedAmount: number;
  bindingKey: string;
  referralId: string;
}

export interface ReverseSwapRateResponse {
  BTC: { BTC: ReverseSwapRate };
  "L-BTC": { BTC: ReverseSwapRate };
}

export interface ReverseSwapRate {
  hash: string;
  rate: number;
  limits: ReverseSwapLimits;
  fees: {
    percentage: number;
    minerFees: {
      claim: number;
      lockup: number;
    };
  };
}

export interface SubmarineSwapRateResponse {
  BTC: {
    BTC: SubmarineSwapRate;
    "L-BTC": SubmarineSwapRate;
  };
}

export interface SubmarineSwapRate {
  hash: string;
  rate: number;
  limits: SubmarineSwapLimits;
  fees: {
    percentage: number;
    minerFees: number;
  };
}

export interface SubmarineSwapLimits {
  minimal: number;
  maximal: number;
  maximalZeroConf: number;
}

export interface ReverseSwapLimits {
  minimal: number;
  maximal: number;
}

export interface SwapTree {
  claimLeaf: SwapTreeLeaf;
  refundLeaf: SwapTreeLeaf;
}

export interface SwapTreeLeaf {
  version: number;
  output: string;
}

export interface WebhookData {
  url: string;
  hashSwapId: boolean;
  status: Array<any>;
}

export type BoltzCurrency = "BTC";
