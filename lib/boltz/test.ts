import Boltz, { NetworkType } from ".";

async function testReverseSwap() {
  try {
    // Create a Boltz instance for testnet
    const boltz = new Boltz(NetworkType.Testnet);

    // Amount in satoshis (e.g., 0.001 BTC = 100000 satoshis)
    const amount = 100000;

    // Replace with a valid testnet Bitcoin address
    const destinationAddress = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";

    await boltz.createReverseSwap(amount, destinationAddress);
    console.log("Reverse swap initiated successfully!");
  } catch (error) {
    console.error("Error during reverse swap:", error);
  }
}

async function testSubmarineSwap() {
  try {
    const boltz = new Boltz(NetworkType.Testnet);

    // Prompt user for a fresh testnet Lightning invoice
    const invoice = await prompt(
      "Please enter a fresh testnet Lightning invoice: "
    );

    if (!invoice) {
      throw new Error("No invoice provided");
    }

    // Replace with a valid testnet Bitcoin address
    const refundAddress = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";

    await boltz.createSubmarineSwap(invoice, refundAddress);
    console.log("Submarine swap initiated successfully!");
  } catch (error) {
    console.error("Error during submarine swap:", error);
  }
}

async function testChainSwapBTC2LQD() {
  try {
    const boltz = new Boltz(NetworkType.Testnet);

    // Amount in satoshis
    const amount = 100000;
    // Replace with a valid Liquid testnet address
    const liquidAddress = "tex1qwu7...";

    await boltz.createChainSwapBTC2LQD(amount, liquidAddress);
    console.log("BTC to L-BTC chain swap initiated successfully!");
  } catch (error) {
    console.error("Error during BTC to L-BTC chain swap:", error);
  }
}

async function testChainSwapLQD2BTC() {
  try {
    const boltz = new Boltz(NetworkType.Testnet);

    // Amount in satoshis
    const amount = 100000;
    // Replace with a valid Bitcoin testnet address
    const bitcoinAddress = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";

    await boltz.createChainSwapLQD2BTC(amount, bitcoinAddress);
    console.log("L-BTC to BTC chain swap initiated successfully!");
  } catch (error) {
    console.error("Error during L-BTC to BTC chain swap:", error);
  }
}

async function testAll() {
  await testReverseSwap();
  // await testSubmarineSwap();
  // await testChainSwapBTC2LQD();
  // await testChainSwapLQD2BTC();
}

testAll();
