import { JsonRpcProvider, Contract } from "ethers";

const TICKET_NFT_ADDRESS = "0xf17EE599E9FEcAb3Cbf37f8D7710f3D948D5bfC5";  // Your TicketNFT contract
const INFURA_URL = "https://sepolia.infura.io/v3/b49f625ad2c340849d4ca5e7165c061a";       // Replace with your Infura key

const TICKET_NFT_ABI = [
  "function eventManager() view returns (address)"
];

async function main() {
  const provider = new JsonRpcProvider(INFURA_URL);
  const contract = new Contract(TICKET_NFT_ADDRESS, TICKET_NFT_ABI, provider);

  const eventManagerAddress = await contract.eventManager();
  console.log("Current Event Manager address:", eventManagerAddress);
}

main().catch(console.error);
