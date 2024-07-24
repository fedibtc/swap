import { styled } from "react-tailwind-variants";

export const StatusBanner = styled("div", {
  base: "flex gap-2 items-center p-4 rounded-lg border-2",
  variants: {
    status: {
      warning: "bg-yellow-100 text-yellow-600 border-yellow-400",
      error: "bg-red-100 text-red-600 border-red-400",
      info: "bg-blue-100 text-blue-600 border-blue-400",
    },
  },
});
