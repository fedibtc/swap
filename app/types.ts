export enum Status {
  NEW = "New",
  PENDING = "Pending",
  EXCHANGE = "Exchange",
  WITHDRAW = "Withdraw",
  DONE = "Done",
  EXPIRED = "Expired",
  EMERGENCY = "Emergency",
}

export const statuses = [
  {
    type: Status.NEW,
    label: "New",
    description: "Just started",
  },
  {
    type: Status.PENDING,
    label: "Pending",
    description: "Transaction received, pending confirmation",
  },
  {
    type: Status.EXCHANGE,
    label: "Exchange",
    description: "Transaction confirmed, exchange in progress",
  },
  {
    type: Status.WITHDRAW,
    label: "Withdraw",
    description: "Sending funds",
  },
  {
    type: Status.DONE,
    label: "Done",
    description: "Order completed",
  },
  {
    type: Status.EXPIRED,
    label: "Expired",
    description: "Order expired",
  },
  {
    type: Status.EMERGENCY,
    label: "Emergency",
    description: "Mayday",
  },
];
