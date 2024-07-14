import Boltz from ".";
import { NetworkType, SwapType } from "./types";

async function testReverseSwap() {
  try {
    const boltz = new Boltz();
    const amount = 100000;
    const destinationAddress = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";

    const response = await boltz.createReverseSwap(amount, destinationAddress);
    console.log("Reverse swap initiated successfully!");

    const outcome = await boltz.awaitSwapOutcome(response.id, SwapType.Reverse);
    console.log("Reverse swap outcome:", outcome);
  } catch (error) {
    console.error("Error during reverse swap:", error);
  }
}

async function testSubmarineSwap() {
  try {
    const boltz = new Boltz(NetworkType.Testnet);
    const invoice = await prompt(
      "Please enter a fresh testnet Lightning invoice: "
    );
    if (!invoice) {
      throw new Error("No invoice provided");
    }
    const refundAddress = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";

    const response = await boltz.createSubmarineSwap(invoice, refundAddress);
    console.log("Submarine swap initiated successfully!");

    const outcome = await boltz.awaitSwapOutcome(
      response.id,
      SwapType.Submarine
    );
    console.log("Submarine swap outcome:", outcome);
  } catch (error) {
    console.error("Error during submarine swap:", error);
  }
}

async function testChainSwapBTC2LQD() {
  try {
    const boltz = new Boltz(NetworkType.Testnet);
    const amount = 100000;
    const liquidAddress = "tex1qwu7...";

    const response = await boltz.createChainSwapBTC2LQD(amount, liquidAddress);
    console.log("BTC to L-BTC chain swap initiated successfully!");

    const outcome = await boltz.awaitSwapOutcome(response.id, SwapType.Chain);
    console.log("BTC to L-BTC chain swap outcome:", outcome);
  } catch (error) {
    console.error("Error during BTC to L-BTC chain swap:", error);
  }
}

async function testChainSwapLQD2BTC() {
  try {
    const boltz = new Boltz(NetworkType.Testnet);
    const amount = 100000;
    const bitcoinAddress = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";

    const response = await boltz.createChainSwapLQD2BTC(amount, bitcoinAddress);
    console.log("L-BTC to BTC chain swap initiated successfully!");

    const outcome = await boltz.awaitSwapOutcome(response.id, SwapType.Chain);
    console.log("L-BTC to BTC chain swap outcome:", outcome);
  } catch (error) {
    console.error("Error during L-BTC to BTC chain swap:", error);
  }
}

async function testAll() {
  // await testReverseSwap();
  await testSubmarineSwap();
  // await testChainSwapBTC2LQD();
  // await testChainSwapLQD2BTC();
}

testAll();
