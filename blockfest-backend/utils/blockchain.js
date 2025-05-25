// utils/blockchain.js
import { JsonRpcProvider, Contract } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Initialize variables at module scope to be used in exported functions
let contract = null;
let blockchainFunctional = false;

try {
    const { ETH_RPC_URL, CONTRACT_ADDRESS, CONTRACT_ABI_PATH } = process.env;

    if (!ETH_RPC_URL || !CONTRACT_ADDRESS || !CONTRACT_ABI_PATH) {
        console.error("Error: Missing blockchain environment variables (ETH_RPC_URL, CONTRACT_ADDRESS, CONTRACT_ABI_PATH).");
        throw new Error("Missing required environment variables");
    }

    // Read the ABI file
    const abiData = fs.readFileSync(CONTRACT_ABI_PATH, 'utf8');
    
    // Parse the JSON
    let contractABI = JSON.parse(abiData);
    
    // Debug: Check what we loaded
    console.log(`ABI loaded. Type: ${typeof contractABI}`);
    
    // Ensure contractABI is an array (most common format for ABIs)
    if (!Array.isArray(contractABI)) {
        // Some ABI files might have the array nested inside a property
        if (contractABI.abi && Array.isArray(contractABI.abi)) {
            console.log("ABI found in .abi property");
            contractABI = contractABI.abi;
        } else {
            console.error("Error: Contract ABI is not in the expected format (should be an array).");
            console.error("ABI content:", JSON.stringify(contractABI).substring(0, 200) + "...");
            throw new Error("Invalid ABI format");
        }
    }
    
    console.log(`ABI contains ${contractABI.length} function definitions`);
    
    // Create a provider connected to the specified RPC URL
    const provider = new JsonRpcProvider(ETH_RPC_URL);

    // Create a read-only contract instance
    contract = new Contract(CONTRACT_ADDRESS, contractABI, provider);
    
    console.log(`Blockchain utils initialized. Connected to RPC: ${ETH_RPC_URL}, Contract: ${CONTRACT_ADDRESS}`);
    blockchainFunctional = true;

} catch (error) {
    console.error("Error initializing blockchain contract:", error);
    console.error("Blockchain functionality will be unavailable.");
    blockchainFunctional = false;
}

/**
 * Fetches data for all tickets from the smart contract.
 * Adapt the logic based on how your contract stores/exposes ticket IDs and data.
 */
export const getAllTicketData = async () => {
    if (!blockchainFunctional || !contract) {
        console.error("Blockchain functionality is unavailable due to initialization error.");
        return [];
    }

    try {
        console.log("Fetching all ticket data from contract...");

        // --- Strategy to get all Token IDs (Adapt to your contract) ---
        // Option A: If contract has totalSupply() and sequential IDs (0 to totalSupply-1)
        const totalSupply = (await contract.totalSupply()).toNumber();
        const tokenIds = Array.from({ length: totalSupply }, (_, i) => i);

        // Option B: If contract has a specific function getAllTokenIds()
        // const tokenIdsBigNumber = await contract.getAllTokenIds();
        // const tokenIds = tokenIdsBigNumber.map(id => id.toNumber());

        // Option C: If only basic ERC721 or no enumeration function available
        // This is harder - might require querying Transfer events, which is less reliable/performant.
        // Avoid if possible. Stick to A or B.
        // -----------------------------------------------------------------

        if (!tokenIds || tokenIds.length === 0) {
            console.log("No tickets found or unable to retrieve token IDs.");
            return [];
        }

        console.log(`Found ${tokenIds.length} potential token IDs. Fetching details...`);

        // Fetch details for each token ID concurrently
        const ticketDataPromises = tokenIds.map(async (id) => {
            try {
                // TODO: Adapt these calls based on your EXACT contract functions
                const owner = await contract.ownerOf(id);
                // Assuming getTicketDetails returns structured data, or use tokenURI + external fetch
                // const metadataURI = await contract.tokenURI(id);
                // Fetch from metadataURI if needed (e.g., IPFS)
                // const metadata = await fetchMetadata(metadataURI); // Implement fetchMetadata if needed

                // Example: If contract stores details directly
                const details = await contract.getTicketDetails(id); // Replace with actual function
                const qrHash = await contract.getQRHash(id); // Replace with actual function

                return {
                    tokenId: id,
                    owner: owner,
                    // Include details from your contract structure
                    eventName: details?.eventName || 'N/A', // Example field
                    seat: details?.seatNumber || 'N/A',    // Example field
                    qrHash: qrHash || 'N/A',
                    // metadataURI: metadataURI || null, // If using off-chain metadata
                };
            } catch (error) {
                // It's possible some IDs in a sequential loop might not exist if tokens were burned
                console.warn(`Could not fetch details for token ID ${id}:`, error.message || error);
                return null; // Return null for IDs that fail (e.g., non-existent)
            }
        });

        const results = await Promise.all(ticketDataPromises);
        const validTickets = results.filter(ticket => ticket !== null); // Filter out failed lookups

        console.log(`Successfully fetched data for ${validTickets.length} tickets.`);
        return validTickets;

    } catch (error) {
        console.error("Error fetching ticket data from blockchain:", error);
        throw new Error("Failed to retrieve ticket data from the smart contract."); // Re-throw for handling in route
    }
};