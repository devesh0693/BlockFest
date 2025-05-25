// src/utils/blockchain.ts

import { ethers, parseEther,toBeHex,formatEther } from 'ethers';
import { BigNumberish } from 'ethers';
import { toast } from 'react-hot-toast';
import { EventDetails } from '../types/global';


// Define types
interface TicketData {
    tokenId: number;
    tokenURI: string;
    qrHash: string;
    owner: string;
}

// --- Configuration ---
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
const TARGET_NETWORK_ID = parseInt(process.env.REACT_APP_TARGET_NETWORK_ID || '11155111', 10);
const TARGET_NETWORK_NAME = process.env.REACT_APP_TARGET_NETWORK_NAME || 'Sepolia Testnet';

if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    console.warn('Contract address not configured. Please set REACT_APP_CONTRACT_ADDRESS in your .env file.');
    toast.error('Contract address not configured. Please set it in your .env file.');
}

// --- ABIs ---
// IMPORTANT: Paste your ACTUAL compiled ABIs!

const EVENT_MANAGER_ABI =[{"inputs":[{"internalType":"address","name":"_ticketNFT","type":"address"},{"internalType":"address","name":"_staking","type":"address"},{"internalType":"address","name":"_validator","type":"address"},{"internalType":"address","name":"_sybil","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"buyer","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"TicketPurchased","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"holder","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"TicketRefunded","type":"event"},{"inputs":[{"internalType":"string","name":"tokenURI","type":"string"},{"internalType":"string","name":"qrHash","type":"string"},{"internalType":"bool","name":"outsider","type":"bool"}],"name":"buyTicket","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"cancelEvent","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"eventActive","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getOwnedTickets","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getStakedAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getSybilScore","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"hasTicket","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"isOutsider","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"isValidator","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"issuedTickets","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxTickets","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"ownedTickets","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"refillTickets","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"refunded","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"sellTicketBack","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"active","type":"bool"}],"name":"setEventActive","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"insiderPrice","type":"uint256"},{"internalType":"uint256","name":"outsiderPrice","type":"uint256"}],"name":"setTicketPrices","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"staking","outputs":[{"internalType":"contract Staking","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"sybil","outputs":[{"internalType":"contract SybilGuard","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ticketCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ticketNFT","outputs":[{"internalType":"contract TicketNFT","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ticketPriceInsider","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ticketPriceOutsider","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"validator","outputs":[{"internalType":"contract ValidatorPoS","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"withdrawFunds","outputs":[],"stateMutability":"nonpayable","type":"function"}]
  

// --- Updated TicketNFT ABI (based on your TicketNFT.sol and needs) ---
const TICKET_NFT_ABI =[{"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"owner","type":"address"}],"name":"ERC721IncorrectOwner","type":"error"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ERC721InsufficientApproval","type":"error"},{"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC721InvalidApprover","type":"error"},{"inputs":[{"internalType":"address","name":"operator","type":"address"}],"name":"ERC721InvalidOperator","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"ERC721InvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC721InvalidReceiver","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC721InvalidSender","type":"error"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ERC721NonexistentToken","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_fromTokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_toTokenId","type":"uint256"}],"name":"BatchMetadataUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"newManager","type":"address"}],"name":"EventManagerSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"MetadataUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"TicketBurned","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"string","name":"tokenURI","type":"string"},{"indexed":false,"internalType":"string","name":"qrHash","type":"string"}],"name":"TicketMinted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"eventManager","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getQRHash","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"string","name":"tokenURI","type":"string"},{"internalType":"string","name":"qrHash","type":"string"}],"name":"mintTicket","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nextTokenId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"qrHashes","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_eventManager","type":"address"}],"name":"setEventManager","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]
// ----------------------------

// Basic validation
if (!CONTRACT_ADDRESS) {
    console.error('REACT_APP_CONTRACT_ADDRESS environment variable is required');
}
if (!TARGET_NETWORK_ID) console.error("REACT_APP_TARGET_NETWORK_ID not set.");
if (EVENT_MANAGER_ABI.length === 0) console.error("EVENT_MANAGER_ABI is empty.");
if (TICKET_NFT_ABI.length === 0) console.error("TICKET_NFT_ABI is empty.");

interface NetworkInfo { chainId: number; name: string; }

// --- Helper Functions ---
const getProvider = (): ethers.BrowserProvider | null => {
    if (typeof window.ethereum === 'undefined') {
        console.error('MetaMask not detected');
        return null;
    }
    return new ethers.BrowserProvider(window.ethereum);
};

const getSigner = async (provider: ethers.BrowserProvider): Promise<ethers.Signer | null> => {
    try {
        const accounts = await provider.send('eth_requestAccounts', []);
        if (accounts.length === 0) return null;
        return provider.getSigner(accounts[0]);
    } catch (error) {
        console.error('Failed to get signer:', error);
        return null;
    }
};

export const getEventManagerContract = async (readOnly = false): Promise<ethers.Contract | null> => {
    const provider = getProvider();
    if (!provider) return null;

    const signer = readOnly ? provider : await getSigner(provider);
    if (!signer) return null;

    return new ethers.Contract(CONTRACT_ADDRESS, EVENT_MANAGER_ABI, signer);
};

const getTicketNFTContract = async (readOnly = false): Promise<ethers.Contract | null> => {
    const provider = getProvider();
    if (!provider) return null;

    const signer = readOnly ? provider : await getSigner(provider);
    if (!signer) return null;

    try {
        // If we have a hardcoded TicketNFT address, use it directly
        const TICKET_NFT_ADDRESS = process.env.REACT_APP_TICKET_NFT_ADDRESS;
        if (TICKET_NFT_ADDRESS) {
            return new ethers.Contract(TICKET_NFT_ADDRESS, TICKET_NFT_ABI, signer);
        }

        // Otherwise try to get it from EventManager
        const eventManager = await getEventManagerContract(true);
        if (!eventManager) return null;

        // Try different possible function names
        const ticketNFTAddress = await eventManager.ticketNFT?.() || 
                               await eventManager.getTicketNFT?.() || 
                               await eventManager.nftContract?.();

        if (!ticketNFTAddress) {
            console.error("Could not get TicketNFT address from EventManager");
            return null;
        }

        return new ethers.Contract(ticketNFTAddress, TICKET_NFT_ABI, signer);
    } catch (error) {
        console.error('Failed to get TicketNFT contract:', error);
        return null;
    }
};

// --- Core Blockchain Functions ---
export const connectWallet = async (): Promise<string | null> => {
    const provider = getProvider();
    if (!provider) return null;
    
    const signer = await getSigner(provider);
    if (!signer) return null;

    const address = await signer.getAddress();
    return address;
};
export const checkNetwork = async (): Promise<{ isCorrect: boolean; currentNetwork: NetworkInfo | null }> => {
    const provider = getProvider();
    if (!provider) return { isCorrect: false, currentNetwork: null };

    try {
        const network = await provider.getNetwork();
        const currentNetwork: NetworkInfo = {
            chainId: Number(network.chainId),
            name: network.name
        };

        return {
            isCorrect: Number(network.chainId) === TARGET_NETWORK_ID,
            currentNetwork
        };
    } catch (error) {
        console.error('Error checking network:', error);
        return { isCorrect: false, currentNetwork: null };
    }
};
export const switchNetwork = async (): Promise<boolean> => {
    if (typeof window.ethereum === 'undefined') {
        console.error('MetaMask not detected');
        return false;
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ethers.hexlify(TARGET_NETWORK_ID.toString()) }]
        });
        return true;
    } catch (error: any) {
        if (error.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: ethers.hexlify(TARGET_NETWORK_ID.toString()),
                        chainName: TARGET_NETWORK_NAME,
                        nativeCurrency: {
                            name: 'ETH',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        rpcUrls: [process.env.REACT_APP_RPC_URL || '']
                    }]
                });
                return true;
            } catch (addError) {
                console.error('Error adding network:', addError);
                return false;
            }
        }
        console.error('Error switching network:', error);
        return false;
    }
};

// Corrected buyTicket
export const buyTicket = async (
    tokenURI: string,
    qrHash: string,
    priceInEther: string,
    isOutsider: boolean
): Promise<string | null> => {
    if (!tokenURI || !qrHash || !priceInEther) {
        throw new Error("All parameters (tokenURI, qrHash, priceInEther) are required to buy ticket.");
    }

    try {
        const value = parseEther(priceInEther);
        console.log(`Calling contract.buyTicket with URI: ${tokenURI}, QR: ${qrHash}, Outsider: ${isOutsider}, Value: ${value.toString()}`);
        
        // Get the EventManager contract instance
        const contract = await getEventManagerContract();
        if (!contract) {
            throw new Error("Failed to get EventManager contract instance");
        }

        // Call buyTicket on EventManager contract
        const tx = await contract.buyTicket(tokenURI, qrHash, isOutsider, { value });
        const receipt = await tx.wait();
        console.log(`Transaction Confirmed: ${receipt?.transactionHash}`);
        return receipt?.transactionHash ?? null;
    } catch (error: any) {
        console.error("Buy Ticket Error:", error);
        const reason = error.reason || error?.data?.message || error.message || 'Unknown error';
        if (error.code === 4001) throw new Error('Transaction rejected.');
        throw new Error(`Purchase Failed: ${reason}`);
    }
};

// --- *** CORRECTED getMyTickets using Event Querying *** ---
export const getMyTickets = async (userAddress: string): Promise<number[]> => {
    if (!userAddress) return [];

    const provider = getProvider();
    const eventManagerContract = await getEventManagerContract(true); // Get read-only EventManager contract

    if (!provider || !eventManagerContract) {
        console.error("getMyTickets: Could not get Provider or EventManager contract instance.");
        throw new Error("Failed to connect to EventManager contract.");
    }

    try {
        console.log(`Querying owned tickets for address ${userAddress}`);
        const ownedTickets = await eventManagerContract.getOwnedTickets(userAddress);
        const ticketIds = ownedTickets.map((id: BigNumberish) => Number(id));
        console.log("Owned ticket IDs:", ticketIds);
        return ticketIds;
    } catch (error: any) {
        console.error("Error querying owned tickets:", error);
        throw new Error("Failed to fetch owned tickets.");
    }
};

// Corrected resellTicket (uses EventManager)
export const resellTicket = async (tokenId: number): Promise<string | null> => {
    const contract = await getEventManagerContract(false);
    if (!contract) throw new Error("EventManager Contract not available.");

    try {
        const tx = await contract.sellTicketBack(tokenId);
        const receipt = await tx.wait();
        return receipt?.transactionHash ?? null;
    } catch (error: any) {
        console.error("Error reselling ticket:", error);
        throw new Error(error.message);
    }
};

// Add this debug function
export const debugContractInterface = async () => {
    const provider = getProvider();
    if (!provider) {
        console.error("Provider not available");
        return;
    }

    try {
        const eventManager = await getEventManagerContract(true);
        if (!eventManager) {
            console.error("Could not get EventManager contract");
            return;
        }

        // Get the contract address
        const address = await eventManager.getAddress();
        console.log("Contract address:", address);

        // Get all function names
        const fragments = eventManager.interface.fragments;
        const functionNames = fragments
          .filter(frag => frag.type === "function" && "name" in frag)
          .map(frag => (frag as any).name);
        console.log("Available functions:", functionNames);

        return {
            address,
            functionNames
        };
    } catch (error) {
        console.error("Error debugging contract:", error);
        throw error;
    }
};

// Update getEventDetails to use the correct function names
export const getEventDetails = async (): Promise<EventDetails | null> => {
    const contract = await getEventManagerContract(true); // true for read-only
    if (!contract) {
        toast.error("Could not connect to Event Manager contract to fetch details.");
        return null;
    }
     if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        console.warn('Event details fetch skipped: Contract address not configured.');
        // Optionally, you might want to inform the user or return a specific state
        return null; 
    }


    try {
        // Call these as functions using ()
        const isActive = await contract.eventActive();
        const maxTicketsBigInt = await contract.maxTickets();
        const currentTicketsBigInt = await contract.ticketCount();
        const ticketPriceInsiderBigInt = await contract.ticketPriceInsider();
        const ticketPriceOutsiderBigInt = await contract.ticketPriceOutsider();

        console.log('Raw event details from contract:', {
            isActive, maxTicketsBigInt, currentTicketsBigInt, ticketPriceInsiderBigInt, ticketPriceOutsiderBigInt
        });

        // Convert BigInt to string for prices (to be used with formatEther or display)
        // And BigInt to number for counts (if they are not excessively large)
        const details: EventDetails = {
            isActive: !!isActive, // Ensure boolean
            maxTickets: Number(maxTicketsBigInt),
            currentTickets: Number(currentTicketsBigInt),
            name: 'My Awesome Event', // Placeholder: Fetch from contract or config if available
            description: 'Join us for an amazing experience!', // Placeholder
            startDate: new Date().toISOString(), // Placeholder
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Placeholder
            // Store prices as strings in Ether, converted from Wei BigInt
            ticketPrice: formatEther(ticketPriceInsiderBigInt), // Default price, can be insider
            ticketPriceInsider: formatEther(ticketPriceInsiderBigInt),
            ticketPriceOutsider: formatEther(ticketPriceOutsiderBigInt),
        };
        console.log('Processed event details:', details);
        return details;

    } catch (error: any) {
        console.error("Error getting event details from contract:", error);
        // Check if the error is due to the contract not being deployed or methods not existing
        if (error.code === 'CALL_EXCEPTION') {
             toast.error("Failed to fetch event details: Contract call failed. Ensure contract is deployed and ABI is correct.");
        } else {
             toast.error(`Failed to fetch event details: ${error.message}`);
        }
        return null;
    }
}

// Corrected getTokenMetadataURI (uses TicketNFT)
export const getTokenMetadataURI = async (tokenId: number): Promise<string | null> => {
    const contract = await getTicketNFTContract(true);
    if (!contract) return null;

    try {
        const uri = await contract.tokenURI(tokenId);
        return uri;
    } catch (error) {
        console.error(`Error getting token URI for ${tokenId}:`, error);
        return null;
    }
};

// --- Updated getAvailableTickets (fetches ALL issued IDs) ---
export const getAvailableTickets = async (): Promise<number[]> => {
    const contract = await getEventManagerContract(true);
    if (!contract) return [];

    try {
        const countBN = await contract.ticketCount();
        const count = Number(countBN);
        if (count === 0) return [];

        console.log(`Total tickets issued: ${count}. Fetching IDs...`);
        const ids: number[] = [];
        const promises: Promise<BigNumberish>[] = [];

        for (let i = 0; i < count; i++) {
            promises.push(contract.issuedTickets(i));
        }

        const results = await Promise.all(promises) as BigNumberish[];
        results.forEach((tokenIdBN: BigNumberish) => {
            ids.push(Number(tokenIdBN));
        });

        console.log("All issued ticket IDs fetched:", ids);
        return ids;

    } catch (error) {
        console.error("Error getting available/issued tickets:", error);
        toast.error("Could not retrieve list of issued tickets.");
        return [];
    }
};

// Corrected getQRHash (uses TicketNFT)
export const getQRHash = async (tokenId: number): Promise<string | null> => {
    const nftContract = await getTicketNFTContract(true);
    if (!nftContract) return null;
    try {
        // Ensure TICKET_NFT_ABI includes getQRHash
        const qrHash = await nftContract.getQRHash(tokenId);
        return qrHash;
    } catch (error: any) {
        console.error(`Error getting QR Hash for token ${tokenId}:`, error.message);
        return null;
    }
};

export const verifyContractSetup = async (): Promise<{ 
    eventManagerAddress: string, 
    ticketNFTAddress: string | null,
    network: string,
    isCorrectNetwork: boolean 
}> => {
    const provider = getProvider();
    if (!provider) {
        throw new Error("Provider not available");
    }

    try {
        // Get network info
        const network = await provider.getNetwork();
        const isCorrectNetwork = Number(network.chainId) === TARGET_NETWORK_ID;

        // Get EventManager contract
        const eventManager = await getEventManagerContract(true);
        if (!eventManager) {
            throw new Error("Could not get EventManager contract");
        }

        // Get TicketNFT address
        const ticketNFTAddress = await eventManager.ticketNFT();

        return {
            eventManagerAddress: await eventManager.getAddress(),
            ticketNFTAddress,
            network: network.name,
            isCorrectNetwork
        };
    } catch (error) {
        console.error("Error verifying contract setup:", error);
        throw error;
    }
};

// Test function to verify contract setup
export const testContractSetup = async () => {
    try {
        const setup = await verifyContractSetup();
        console.log("Contract Setup:", setup);
        return setup;
    } catch (error) {
        console.error("Setup verification failed:", error);
        throw error;
    }
};

const gridColsClass = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4'
}[Math.min(getAvailableTickets?.length || 0, 4) || 1];