// src/pages/MarketplacePage.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
// Import specific utilities from ethers
import { formatEther, parseEther } from 'ethers'; // formatEther is used by blockchain.ts, parseEther for sending tx

// --- Context Hooks ---
import { useAuth, useWallet } from '../contexts/AuthContext';
import { useVIP } from '../contexts/VIPContext';

// --- Blockchain Utilities ---
import {
    buyTicket as buyTicketUtil,
    getMyTickets as getMyTicketsUtil,
    resellTicket as resellTicketUtil,
    getEventDetails,
    getTokenMetadataURI,
    getAvailableTickets as getAvailableTicketsUtil,
    getEventManagerContract
} from '../utils/blockchain';
import fetchMetadataFromUri from '../utils/metadata';

// --- Components ---
import GlowingButton from '../components/GlowingButton';
import VIPVerificationForm from '../components/VIPVerificationForm';
import NFTTicketCard from '../components/NFTTicketCard';
import NFTTicketCardSkeleton from '../components/NFTTicketCardSkeleton';

// --- Type Definitions ---
interface TicketData {
    id: number;
    metadata?: {
        uri: string;
    };
    eventName: string;
    price: string; // Price stored as formatted string (e.g., "0.05")
    seatNumber: string;
    qrValue: string;
    imageUrl?: string;
}

interface UserWithWallet {
    walletAddress?: string;
}

const availableTicketMetadataCIDs: { [key: number]: string } = {
    0: "bafkreifkrvwbi3hlxcii7uwsaunx73mdcy34jjx7nitrhfgag2vudg5ujm",
    1: "bafkreifpncyhhgrna7iletoaquzn2dgnesz5xvim6ygqizldimw2bud6pm",
    2: "bafkreigrghfwlh3dhm4a6imin2jzkwg7qjwqza2r5dymocfjn77hyrztmi",
    3: "bafkreibqxwclnkhlkjc3fvlco7tecujwdjiohayilfywxaeoqeeuazquzi",
    4: "bafkreieqkoa2lp36wdljvyztz2gi33n7kcsrnfp5ybu3cs3mrgoeq5pavm",
    5: "bafkreidf3ahogkojhoe57e6wlwb3prmetqeoqmfty2lymkchc2mwsuftsu",
    6: "bafkreidecmmrdujzb45oe7jgf7d76ndtpmhwncimo7ez3afbiccv7342ju",
};

const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve();
    img.onerror = () => reject();
  });
};

const MarketplacePage: React.FC = () => {
    const { isVIP, checkingVIP, checkVIPStatus, walletAddress: vipWalletAddress } = useVIP();
    const { user, loading } = useAuth();
    const { walletAddress, networkState, switchNetwork } = useWallet();
    const [availableTickets, setAvailableTickets] = useState<TicketData[]>([]);
    const [ownedTickets, setOwnedTickets] = useState<TicketData[]>([]);
    const [buyingTicketId, setBuyingTicketId] = useState<number | null>(null);
    const [resellingTicketId, setResellingTicketId] = useState<number | null>(null);
    const [dataInitialized, setDataInitialized] = useState(false);
    const [eventPrice, setEventPrice] = useState<{ insider: string; outsider: string } | null>(null);
    const lastFetchTimeRef = useRef<number>(0);

    // Preload images - moved inside the component
    useEffect(() => {
      const imageCIDs = [
        "bafkreifn5vngr66plqezmwvfubc4snvi27krijibh7ddh3fsvo6h24n3p4",
        "bafkreigyoncf7lgpndglgipvnotywpsudwuzrsyq46blyqtyr5eirr4fxy",
        "bafkreibeacfvmoafm27zonbyfuuswvpvsfhcznfddtgomu2472qno6ndze",
        "bafybeiarmcnke3q4t5tfo765rj7keylgmcu4oipag5lnugfrp4usdopyne",
        "bafybeiez6wvn5gjta3fkzvv65oldoevxbidmgt2v7a4fioupf34mnxzxuy",
        "bafybeie2dqx7sizq7wi4nkwikvaluhokmfnmwcqsidvtt45nvxbzautt2i",
        "bafybeidiruone3wadolwzvzm4hgrkvyddqrqoy73pd7c6y2hensxjzrarq",
      ];
    
      const preload = async () => {
        const urls = imageCIDs.map(cid => `https://ipfs.io/ipfs/${cid}`);
        await Promise.allSettled(urls.map(preloadImage));
        console.log("All images preloaded.");
      };
    
      preload();
    }, []);

    // Fetch price only once on mount
    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const details = await getEventDetails();
                if (details) {
                    // CORRECTED: Use the already formatted strings directly
                    setEventPrice({
                        insider: details.ticketPriceInsider,
                        outsider: details.ticketPriceOutsider
                    });
                } else {
                    console.warn("Ticket price not found in event details.");
                    toast.error("Could not determine event price.");
                }
            } catch (error) {
                console.error("Failed to fetch event details:", error);
                // The error message in the toast was "Could not load event details."
                // The console error includes the specific TypeError.
                // If the error persists after this fix, the original error is likely within getEventDetails itself.
                toast.error(`Failed to load event details. Check console for specifics.`);
            }
        };
        fetchPrice();
    }, []); // Empty dependency array means this runs once on component mount

    // Fetch owned tickets with rate limiting
    const fetchOwnedTickets = useCallback(async (force: boolean = false) => {
        if (!walletAddress) return;
        
        const now = Date.now();
        if (!force && now - lastFetchTimeRef.current < 3000) {
            console.log("Skipping fetch due to rate limit");
            return;
        }
        
        console.log("Starting fetchOwnedTickets for address:", walletAddress);
        lastFetchTimeRef.current = now;
        
        try {
            console.log("Calling getMyTicketsUtil...");
            const ownedIds = await getMyTicketsUtil(walletAddress);
            console.log("Raw owned ticket IDs returned:", ownedIds);
            
            if (!ownedIds || ownedIds.length === 0) {
                console.log("No owned tickets found, clearing owned tickets state");
                setOwnedTickets([]);
                return;
            }

            // Fetch metadata for each owned ticket
            const ticketsData = await Promise.all(ownedIds.map(async (id: number) => {
                let metadata = undefined;
                let uri = undefined;
                try {
                    uri = await getTokenMetadataURI(id); // fetch tokenURI from contract
                    metadata = uri ? await fetchMetadataFromUri(uri) : undefined;
                } catch (e) {
                    console.error(`Failed to fetch metadata for owned ticket ${id}:`, e);
                }
                const eventName = metadata?.name || `Ticket ${id}`;
                const seatNumber = metadata?.attributes?.find((attr: any) => attr.trait_type === 'Seat')?.value || `Seat-${id}`;
                const imageUrl = metadata?.image?.replace(/^ipfs:\/\//, 'https://ipfs.io/ipfs/') || undefined;
                const price = eventPrice ? eventPrice.outsider : '0.001';
                return {
                    id,
                    eventName,
                    price,
                    seatNumber,
                    qrValue: `qr-${id}-${Date.now()}`,
                    imageUrl,
                    metadata: {
                        ...metadata,
                        uri
                    }
                };
            }));
            setOwnedTickets(ticketsData);
            setDataInitialized(true);
        } catch (error) {
            console.error("Failed to fetch owned tickets:", error);
            toast.error("Could not load your owned tickets. Please try again.");
        }
    }, [walletAddress, eventPrice]); // Added eventPrice as a dependency if it's used to determine display price of owned tickets

    // Initial fetch and periodic refresh
    useEffect(() => {
        if (walletAddress) {
            fetchOwnedTickets(true);
            const refreshInterval = setInterval(() => {
                console.log("Periodic refresh of owned tickets");
                fetchOwnedTickets(false);
            }, 10000); 
            return () => clearInterval(refreshInterval);
        }
    }, [walletAddress, fetchOwnedTickets]);

    // Fetch available tickets when dependencies change
    useEffect(() => {
        const fetchAvailable = async () => {
            if (!walletAddress || !eventPrice) return; 
            
            try {
                console.log("Fetching available tickets...");
                
                const availableTicketsData = Object.entries(availableTicketMetadataCIDs).map(([id, cid]) => ({
                    id: parseInt(id),
                    cid: cid
                }));

                console.log("Processing available tickets:", availableTicketsData);

                const availableDetailsPromises = availableTicketsData.map(async ({ id, cid }) => {
                    try {
                        const uri = `ipfs://${cid}`;
                        console.log(`Workspaceing metadata for ticket ${id} from ${uri}`);
                        const metadata = await fetchMetadataFromUri(uri);
                        
                        if (!metadata) {
                            console.error(`Failed to fetch metadata for ticket ${id} with CID ${cid}`);
                            return null;
                        }
                        const price = isVIP ? (eventPrice.insider) : (eventPrice.outsider);
                        const ticketData = {
                            id,
                            eventName: metadata?.name || `Ticket ${id}`,
                            price,
                            seatNumber: metadata?.attributes?.find((attr: any) => attr.trait_type === 'Seat')?.value || `Seat-${id}`,
                            qrValue: `qr-${id}`,
                            imageUrl: metadata?.image?.replace(/^ipfs:\/\//, 'https://ipfs.io/ipfs/') || undefined,
                            metadata: {
                                ...metadata,
                                uri // ensure uri is present for buyTicket
                            }
                        };
                        console.log(`Processed ticket ${id}:`, ticketData);
                        return ticketData;
                    } catch (detailError) {
                        console.error(`Failed to fetch details for available token ${id}:`, detailError);
                        return null;
                    }
                });

                const resolvedDetails = (await Promise.all(availableDetailsPromises)).filter(Boolean) as TicketData[];
                console.log("Final available tickets:", resolvedDetails);
                setAvailableTickets(resolvedDetails);
                
            } catch (error) {
                console.error("Failed to fetch available tickets:", error);
                toast.error("Could not load available tickets. Please try again.");
            }
        };

        fetchAvailable();
    }, [walletAddress, eventPrice, isVIP]); // Added isVIP

    const handleVIPVerification = async (name: string, rollNumber: string) => {
        try {
            // Get wallet address from the form
            const walletAddressInput = document.querySelector<HTMLInputElement>('#vipWalletAddress')?.value;
            if (!walletAddressInput) {
                toast.error('Please enter your wallet address.');
                return;
            }
            
            await checkVIPStatus(name, rollNumber, walletAddressInput);
            // After successful verification, refresh marketplace data
            await fetchOwnedTickets(true); // Force fetch owned tickets
            const fetchAvailable = async () => {
                if (!walletAddress || !eventPrice) return;
                
                try {
                    console.log("Fetching available tickets...");
                    
                    const availableTicketsData = Object.entries(availableTicketMetadataCIDs).map(([id, cid]) => ({
                        id: parseInt(id),
                        cid: cid
                    }));

                    console.log("Processing available tickets:", availableTicketsData);

                    const availableDetailsPromises = availableTicketsData.map(async ({ id, cid }) => {
                        try {
                            const uri = `ipfs://${cid}`;
                            console.log(`Workspaceing metadata for ticket ${id} from ${uri}`);
                            const metadata = await fetchMetadataFromUri(uri);
                            
                            if (!metadata) {
                                console.error(`Failed to fetch metadata for ticket ${id} with CID ${cid}`);
                                return null;
                            }
                            const price = isVIP ? (eventPrice.insider) : (eventPrice.outsider);
                            const ticketData = {
                                id,
                                eventName: metadata?.name || `Ticket ${id}`,
                                price,
                                seatNumber: metadata?.attributes?.find((attr: any) => attr.trait_type === 'Seat')?.value || `Seat-${id}`,
                                qrValue: `qr-${id}`,
                                imageUrl: metadata?.image?.replace(/^ipfs:\/\//, 'https://ipfs.io/ipfs/') || undefined,
                                metadata: {
                                    ...metadata,
                                    uri // ensure uri is present for buyTicket
                                }
                            };
                            console.log(`Processed ticket ${id}:`, ticketData);
                            return ticketData;
                        } catch (detailError) {
                            console.error(`Failed to fetch details for available token ${id}:`, detailError);
                            return null;
                        }
                    });

                    const resolvedDetails = (await Promise.all(availableDetailsPromises)).filter(Boolean) as TicketData[];
                    console.log("Final available tickets:", resolvedDetails);
                    setAvailableTickets(resolvedDetails);
                    
                } catch (error) {
                    console.error("Failed to fetch available tickets:", error);
                    toast.error("Could not load available tickets. Please try again.");
                }
            };
            await fetchAvailable(); // Fetch available tickets
        } catch (error) {
            console.error("VIP verification failed:", error);
        }
    };

    useEffect(() => {
        if (user && !isVIP && !checkingVIP) {
            toast.error('VIP verification required. Please verify your VIP status first.');
        }
    }, [user, isVIP, checkingVIP]);

    const handleVIPVerified = useCallback(() => {
        console.log("VIP verified, data will refresh automatically through effects");
        // Data refresh is handled by useEffects that depend on `isVIP` or `eventPrice`
        // If `isVIP` status directly changes `eventPrice` or how tickets are displayed,
        // the existing `useEffect` for available tickets should re-run.
        // You might also want to force a refresh of available tickets if their price depends on VIP status
        // and that price is determined/formatted within `WorkspaceAvailable`.
    }, []);

    useEffect(() => {
        const initializeData = async () => {
            if (walletAddress && !dataInitialized) {
                console.log("Initializing marketplace data...");
                try {
                    // Fetch price first if not already fetched, though the dedicated effect should handle it
                    if (!eventPrice) {
                         const details = await getEventDetails();
                         if (details) {
                            setEventPrice({
                                insider: details.ticketPriceInsider,
                                outsider: details.ticketPriceOutsider
                            });
                         }
                    }
                    await fetchOwnedTickets(true); // force fetch
                    setDataInitialized(true);
                } catch (error) {
                     console.error("Error during initial data load:", error);
                }
            }
        };

        initializeData();
    }, [walletAddress, dataInitialized, fetchOwnedTickets, eventPrice]);

    const handleBuyTicket = async (ticketId: number) => {
        if (!user) {
            toast.error('Please log in to buy a ticket.');
            return;
        }

        try {
            setBuyingTicketId(ticketId);
            const toastId = `buy-${ticketId}`;
            toast.loading('Processing ticket purchase...', { id: toastId });

            // Get the ticket from availableTickets
            const ticket = availableTickets.find(t => t.id === ticketId);
            if (!ticket || !ticket.metadata) {
                toast.dismiss(toastId);
                toast.error('Ticket not found.');
                setBuyingTicketId(null);
                return;
            }

            // Get the wallet address from VIP verification (already stored in vipWalletAddress)
            if (!vipWalletAddress) {
                toast.dismiss(toastId);
                toast.error('Wallet address not found. Please complete VIP verification first.');
                setBuyingTicketId(null);
                return;
            }

            // Get the ticket price
            let ticketPrice = isVIP ? eventPrice?.insider : eventPrice?.outsider;
            if (!ticketPrice) ticketPrice = '0.001'; // fallback
            ticketPrice = ticketPrice.toString(); // ensure string
            // Debug log for ETH value
            console.log('ETH value being sent (wei):', parseEther(ticketPrice).toString());
            // Generate QR hash
            const qrHash = `qr-${ticketId}-${Date.now()}`;

            // Debug log for parameters
            console.log('Buy Ticket Debug:', {
                ticketId,
                uri: ticket?.metadata?.uri,
                qrHash,
                ticketPrice,
                isVIP,
                walletAddress,
                vipWalletAddress,
                eventPrice,
            });

            // Validate parameters
            if (!ticket?.metadata?.uri || !qrHash || !ticketPrice || !vipWalletAddress) {
                toast.dismiss(toastId);
                toast.error('Missing required ticket information. Please try again.');
                setBuyingTicketId(null);
                return;
            }
            // Check if the user already has a ticket
            if (!walletAddress) {
                toast.dismiss(toastId);
                toast.error('Wallet address not found.');
                setBuyingTicketId(null);
                return;
            }
            const myTickets = await getMyTicketsUtil(walletAddress);
            if (myTickets.length > 0 && isVIP) {
                toast.dismiss(toastId);
                console.warn('This wallet already owns a ticket as VIP.');
                toast.error("You already own a ticket. Insiders can only buy one ticket.");
                setBuyingTicketId(null);
                return;
            }

            if (!isVIP && ticketPrice === eventPrice?.insider) {
                console.warn('Non-VIP is trying to buy with insider price!');
            }
            if (isVIP && ticketPrice !== eventPrice?.insider) {
                console.warn('VIP is not using insider price!');
            }
            if (!isVIP && ticketPrice !== eventPrice?.outsider) {
                console.warn('Non-VIP is not using outsider price!');
            }

            const eventDetails = await getEventDetails();
            console.log('EventManager contract state:', eventDetails);

            // Check if event is active
            if (!eventDetails?.isActive) {
                toast.dismiss(toastId);
                toast.error('Event is not active. Ticket purchase is disabled.');
                setBuyingTicketId(null);
                return;
            }

            const eventManager = await getEventManagerContract();
            if (!eventManager) {
                toast.dismiss(toastId);
                toast.error('Could not connect to the EventManager contract.');
                setBuyingTicketId(null);
                return;
            }
            const hasTicket = await eventManager.hasTicket(walletAddress);
            console.log('hasTicket for', walletAddress, ':', hasTicket);

            await debugTicketPurchaseState(walletAddress, !!isVIP);

            // Call the buy ticket function with recipient as the wallet address from VIP verification
            let txHash = null;
            try {
                const tx = await eventManager.buyTicket(ticket.metadata.uri, qrHash, !isVIP, { value: parseEther(ticketPrice) });
                txHash = tx.hash;
                await tx.wait();
            } catch (err: any) {
                toast.dismiss(toastId);
                // Enhanced error logging for revert reasons
                let reason1 = err?.reason || err?.data?.message || err?.error?.message || err?.message || 'Unknown error';
                let details1 = '';
                if (err?.data) {
                    details1 += `\nError Data: ${JSON.stringify(err.data)}`;
                }
                if (err?.error) {
                    details1 += `\nInner Error: ${JSON.stringify(err.error)}`;
                }
                console.error('Buy Ticket Failed:', err, details1);
                toast.error(`Revert reason: ${reason1}${details1}`);
                setBuyingTicketId(null);
                return;
            }

            if (txHash) {
                toast.dismiss(toastId);
                toast.success(
                    <>
                        Ticket Purchased! <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className='underline'>View Tx</a>
                    </>,
                    { duration: 6000 }
                );
                await fetchOwnedTickets(true);
            }
        } catch (error: any) {
            const toastId = `buy-${ticketId}`;
            toast.dismiss(toastId);
            // Enhanced error logging for revert reasons
            let reason2 = error?.reason || error?.data?.message || error?.error?.message || error?.message || 'Unknown error';
            let details2 = '';
            if (error?.data) {
                details2 += `\nError Data: ${JSON.stringify(error.data)}`;
            }
            if (error?.error) {
                details2 += `\nInner Error: ${JSON.stringify(error.error)}`;
            }
            console.error('Buy Ticket Failed:', error, details2);
            toast.error(`Revert reason: ${reason2}${details2}`);
            setBuyingTicketId(null);
        }
    };

    const handleResellTicket = async (tokenId: number) => {
        if (!networkState?.isCorrect) {
            toast.error('Incorrect network. Please switch.');
            await switchNetwork();
            return;
        }

        setResellingTicketId(tokenId);
        const toastId = `resell-${tokenId}`;
        toast.loading('Processing resale...', { id: toastId });
        try {
            const txHash = await resellTicketUtil(tokenId);
            toast.success(
                <>
                    Resale Submitted! <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className='underline'>View Tx</a>
                </>,
                { id: toastId, duration: 6000 }
            );
            await new Promise(resolve => setTimeout(resolve, 3000));
            await fetchOwnedTickets(true);
        } catch (error: any) {
            console.error('Resell Failed:', error);
            toast.dismiss(toastId);
            toast.error(error.message || 'Failed to resell ticket. Please try again.');
        } finally {
            setResellingTicketId(null);
        }
    };

    // --- Render Logic ---
    if (!user) return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center min-h-[400px]">
            <p className="text-center text-accent-light text-lg animate-fade-in">Please log in to access the marketplace.</p>
        </motion.div>
    );
    if (!walletAddress) return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center min-h-[400px]">
            <p className="text-center text-accent-light text-lg animate-fade-in">Please connect your wallet to access the marketplace.</p>
        </motion.div>
    );
    if (!networkState?.isCorrect) return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <p className="text-center text-error text-lg animate-fade-in">
                Wrong Network Detected ({networkState?.currentNetwork?.name || 'Unknown'}).
            </p>
            <GlowingButton onClick={switchNetwork}>Switch Network</GlowingButton>
        </motion.div>
    );

    if (process.env.REACT_APP_VIP_REQUIRED === 'true' && isVIP === null) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-md mx-auto my-8"
            >
                <VIPVerificationForm onVerified={handleVIPVerified} />
            </motion.div>
        );
    }

    if (!isVIP && !checkingVIP) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-md mx-auto my-8"
            >
                <h2 className="text-xl font-semibold mb-4">VIP Verification Required</h2>
                <VIPVerificationForm onVerified={handleVIPVerification} />
            </motion.div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 w-full">
            <div>
                {/* My Tickets Section */}
                <section>
                    <h2 className="text-2xl font-bold text-accent-light mb-6">My Tickets</h2>
                    {loading && ownedTickets.length === 0 ? ( // Show skeleton only if loading AND no tickets yet
                        <div className="flex flex-wrap gap-6">
                            {[...Array(4)].map((_, index) => <div><NFTTicketCardSkeleton key={`owned-skeleton-${index}`} /></div>)}
                        </div>
                    ) : ownedTickets.length > 0 ? (
                        <div className="flex flex-wrap gap-6">
                            {ownedTickets.map((ticket) => (
                                <div className="w-[170px]">
                                    <NFTTicketCard
                                        key={`owned-${ticket.id}`}
                                        ticket={ticket}
                                        onBuy={() => {}} 
                                        isOwned={true}
                                        onResell={handleResellTicket}
                                        isReselling={resellingTicketId === ticket.id}
                                    />
                                </div>
                            ))}
                            {Array.from({length: 4 - ownedTickets.length > 0 ? 4 - ownedTickets.length : 0}).map((_, i) => (
                                <div key={`filler-${i}`} className="w-full invisible" />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-6">
                            <div className="w-[170px]">
                                <NFTTicketCard
                                    ticket={{
                                        id: 0,
                                        eventName: 'VIP Ticket - BlockFest',
                                        price: '0.001',
                                        seatNumber: 'Seat-0',
                                        qrValue: 'sample-qr',
                                        imageUrl: 'https://ipfs.io/ipfs/bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku',
                                    }}
                                    onBuy={() => {}}
                                    isOwned={true}
                                />
                            </div>
                        </div>
                    )}
                </section>

                {/* Available Tickets Section */}
                <section>
                    <h2 className="text-2xl font-bold text-accent-light mb-6">Available Tickets</h2>
                    {loading && availableTickets.length === 0 ? ( // Show skeleton only if loading AND no tickets yet
                        <div className="flex flex-wrap gap-6">
                            {[...Array(4)].map((_, index) => <div><NFTTicketCardSkeleton key={`available-skeleton-${index}`} /></div>)}
                        </div>
                    ) : availableTickets.length > 0 ? (
                        <div className="flex flex-wrap gap-6">
                            {availableTickets.map((ticket) => (
                                <div className="w-[220px]">
                                    <NFTTicketCard
                                        key={`available-${ticket.id}`}
                                        ticket={ticket}
                                        onBuy={handleBuyTicket}
                                        isOwned={false}
                                        isBuying={buyingTicketId === ticket.id}
                                    />
                                </div>
                            ))}
                            {Array.from({length: 4 - availableTickets.length > 0 ? 4 - availableTickets.length : 0}).map((_, i) => (
                                <div key={`filler-${i}`} className="w-full invisible" />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-text-secondary bg-secondary-dark p-6 rounded-lg">
                            <p>No tickets currently available for purchase.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

async function debugTicketPurchaseState(walletAddress: string, isVIP: boolean) {
    const eventDetails = await getEventDetails();
    const eventManager = await getEventManagerContract(true);
    const myTickets = await getMyTicketsUtil(walletAddress);
    let hasTicket = false;
    if (eventManager && walletAddress) {
        hasTicket = await eventManager.hasTicket(walletAddress);
    }

    console.log('--- Ticket Purchase Debug ---');
    console.log('Event Details:', eventDetails);
    console.log('Wallet Address:', walletAddress);
    console.log('isVIP:', isVIP);
    console.log('Already owns ticket (hasTicket):', hasTicket);
    console.log('Owned ticket IDs:', myTickets);
    if (eventDetails) {
        console.log('Event Active:', eventDetails.isActive);
        console.log('Tickets Sold:', eventDetails.currentTickets, '/', eventDetails.maxTickets);
        console.log('Insider Price:', eventDetails.ticketPriceInsider);
        console.log('Outsider Price:', eventDetails.ticketPriceOutsider);
    }
    console.log('-----------------------------');
}

export default MarketplacePage;