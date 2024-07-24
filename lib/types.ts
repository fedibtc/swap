interface ClaimLeaf {
  version: number;
  output: string;
}

interface RefundLeaf {
  version: number;
  output: string;
}

export interface SwapTree {
  claimLeaf: ClaimLeaf;
  refundLeaf: RefundLeaf;
}

export interface SubmarineSwapResponse {
  bip21: string;
  acceptZeroConf: boolean;
  expectedAmount: number;
  id: string;
  address: string;
  swapTree: SwapTree;
  claimPublicKey: string;
  timeoutBlockHeight: number;
}

export interface ReverseSwapResponse {
  id: string;
  invoice: string;
  swapTree: SwapTree;
  lockupAddress: string;
  refundPublicKey: string;
  timeoutBlockHeight: number;
  onchainAmount: number;
}
