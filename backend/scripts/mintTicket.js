import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// Use your actual env variable names
const INFURA_URL = process.env.REACT_APP_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const EVENT_MANAGER_ADDRESS = process.env.EVENT_MANAGER_ADDRESS;

// Minimal ABI with buyTicket function
const EVENT_MANAGER_ABI = [
  "function buyTicket() payable"
];

async function main() {
  // Debug print to verify env variables loaded
  console.log("RPC URL:", INFURA_URL ? "[Loaded]" : "[Missing]");
  console.log("Private Key:", PRIVATE_KEY ? "[Loaded]" : "[Missing]");
  console.log("Event Manager Address:", EVENT_MANAGER_ADDRESS ? EVENT_MANAGER_ADDRESS : "[Missing]");

  if (!INFURA_URL || !PRIVATE_KEY || !EVENT_MANAGER_ADDRESS) {
    throw new Error("Missing INFURA_URL, PRIVATE_KEY, or EVENT_MANAGER_ADDRESS in .env file");
  }

  const provider = new ethers.JsonRpcProvider(INFURA_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(EVENT_MANAGER_ADDRESS, EVENT_MANAGER_ABI, wallet);

  const ticketPrice = ethers.parseEther("0.001");

  try {
    const tx = await contract.buyTicket({ value: ticketPrice });
    console.log("Transaction sent. Hash:", tx.hash);
    await tx.wait();
    console.log("Ticket minted successfully!");
  } catch (error) {
    console.error("Minting failed:", error);
  }
}

main().catch(console.error);
