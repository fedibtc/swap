import crypto from "crypto";

export default async function fetchWithFF<T = Record<string, any>>(
  method: string,
  body: T,
) {
  const sig = crypto
    .createHmac("sha256", process.env.FIXEDFLOAT_API_SECRET as string)
    .update(JSON.stringify(body))
    .digest("hex");

  return await fetch("https://ff.io/api/v2/" + method, {
    method: "POST",
    // @ts-ignore
    headers: {
      "X-API-KEY": process.env.FIXEDFLOAT_API_KEY,
      "X-API-SIGN": sig,
      Accept: "application/json",
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
  });
}
