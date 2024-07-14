export interface SwapResponse {
  id: string;
}

export interface SwapOutcome {
  status: "success" | "failed";
  transactionId?: string;
  preimage?: string;
  error?: string;
}

export interface SwapHandlers {
  handleSwapUpdate: (message: any) => SwapOutcome | null;
}

export interface ChainSwapResponse extends SwapResponse {
  claimDetails: {
    blindingKey: string;
    serverPublicKey: string;
    amount: number;
    lockupAddress: string;
    timeoutBlockHeight: number;
    swapTree: SwapTree;
  };
  lockupDetails: {
    serverPublicKey: string;
    amount: number;
    lockupAddress: string;
    timeoutBlockHeight: number;
    swapTree: SwapTree;
    bip21: string;
  };
}

export interface ReverseSwapResponse extends SwapResponse {
  invoice: string;
  swapTree: SwapTree;
  lockupAddress: string;
  refundPublicKey: string;
  timeoutBlockHeight: number;
  onchainAmount: number;
}

export interface SubmarineSwapResponse extends SwapResponse {
  bip21: string;
  acceptZeroConf: boolean;
  expectedAmount: number;
  address: string;
  swapTree: SwapTree;
  claimPublicKey: string;
  timeoutBlockHeight: number;
}

interface SwapTree {
  claimLeaf: LeafNode;
  refundLeaf: LeafNode;
}

interface LeafNode {
  version: number;
  output: string;
}
