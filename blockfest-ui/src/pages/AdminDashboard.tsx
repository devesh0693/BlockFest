// src/pages/AdminDashboard.tsx

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { uploadVipCsvApi, getAllTicketsApi, TicketData } from '../firebase/index';
import GlowingButton from '../components/GlowingButton';
import NFTTicketCard from '../components/NFTTicketCard';

interface StoredFileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  content: string; // Base64 encoded file content
  uploaded?: boolean;
  uploadedAt?: string;
}

interface AdminDataState {
  vipList: Array<any>;
  ticketStats: {
    total: number;
    claimed: number;
    remaining: number;
  };
  lastFetched: string;
}

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [vipFile, setVipFile] = useState<File | null>(null);
    const [storedFileInfo, setStoredFileInfo] = useState<StoredFileInfo | null>(null);
    const [allTickets, setAllTickets] = useState<TicketData[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    
    // Admin Data Button States
    const [isDataFetched, setIsDataFetched] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    // Load stored file info and admin data from sessionStorage on component mount
    useEffect(() => {
        const storedInfo = sessionStorage.getItem('vipFileInfo');
        if (storedInfo) {
            setStoredFileInfo(JSON.parse(storedInfo));
            
            // Recreate the File object from stored data
            retrieveStoredFile();
        }
        
        const storedData = sessionStorage.getItem('blockfestAdminData');
        if (storedData) {
            setIsDataFetched(true);
        }
    }, []);

    // Retrieve the file from session storage and convert back to a File object
    const retrieveStoredFile = async () => {
        const storedInfo = sessionStorage.getItem('vipFileInfo');
        if (!storedInfo) return;
        
        const fileInfo: StoredFileInfo = JSON.parse(storedInfo);
        
        try {
            // Convert base64 to blob
            const response = await fetch(fileInfo.content);
            const blob = await response.blob();
            
            // Create a new File object
            const file = new File([blob], fileInfo.name, {
                type: fileInfo.type,
                lastModified: fileInfo.lastModified
            });
            
            setVipFile(file);
            toast.success('Restored previously selected file');
        } catch (error) {
            console.error("Error retrieving stored file:", error);
            toast.error("Couldn't restore the previously selected file");
            clearStoredFile();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVipFile(file);
            
            try {
                // Convert file to base64 for storage
                const base64 = await convertFileToBase64(file);
                
                // Store file info and content in sessionStorage
                const fileInfo: StoredFileInfo = {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    content: base64
                };
                
                sessionStorage.setItem('vipFileInfo', JSON.stringify(fileInfo));
                setStoredFileInfo(fileInfo);
                toast.success(`File "${file.name}" stored in session`);
            } catch (error) {
                console.error("Error storing file:", error);
                toast.error("Failed to store file in session");
            }
        }
    };

    // Helper function to convert File to base64
    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleUploadVIPList = async () => {
        if (!vipFile) {
            // Try to use stored file info to inform the user
            if (storedFileInfo) {
                toast.error(`Please select a file again. The file "${storedFileInfo.name}" is no longer available.`);
                // Clear stored file info
                sessionStorage.removeItem('vipFileInfo');
                setStoredFileInfo(null);
            } else {
                toast.error("Please select a CSV file.");
            }
            return;
        }

        setUploading(true);
        toast.loading('Uploading VIP list...', { id: 'vip-upload' });
        try {
            const response = await uploadVipCsvApi(vipFile);
            toast.success(`Upload successful! Processed: ${response.processedCount}, Errors: ${response.errorCount}`, { 
                id: 'vip-upload', 
                duration: 5000 
            });
            
            // Mark that the file has been uploaded successfully
            if (storedFileInfo) {
                const updatedFileInfo = {
                    ...storedFileInfo,
                    uploaded: true,
                    uploadedAt: new Date().toISOString()
                };
                sessionStorage.setItem('vipFileInfo', JSON.stringify(updatedFileInfo));
                setStoredFileInfo(updatedFileInfo);
            }
            
            // Keep the file in state for potential reuse
            // Don't clear the file input or state after successful upload
        } catch (error: any) {
            console.error("VIP Upload Failed:", error);
            toast.error(`Upload Failed: ${error.message}`, { id: 'vip-upload' });
        } finally {
            setUploading(false);
        }
    };

    const handleViewAllTickets = async () => {
        setLoadingTickets(true);
        setAllTickets([]);
        toast.loading("Fetching all minted tickets...", { id: 'fetch-tickets' });
        try {
            const tickets = await getAllTicketsApi();
            setAllTickets(tickets);
            toast.success(`Loaded ${tickets.length} tickets.`, { id: 'fetch-tickets' });
        } catch (error: any) {
            console.error("Fetch All Tickets Failed:", error);
            toast.error(`Failed: ${error.message}`, { id: 'fetch-tickets' });
        } finally {
            setLoadingTickets(false);
        }
    };

    const clearStoredFile = () => {
        sessionStorage.removeItem('vipFileInfo');
        setStoredFileInfo(null);
        setVipFile(null);
        const input = document.getElementById('vip-file-input') as HTMLInputElement;
        if (input) input.value = '';
        toast.success('File information cleared.');
    };

    // Admin Data Button Functions
    const fetchAndStoreData = async () => {
        setIsFetching(true);
        toast.loading('Fetching admin data...', { id: 'admin-data-fetch' });
        
        try {
            // This is where you would make your actual API calls to fetch VIP list and ticket data
            // For example:
            // const vipList = await getVipListApi();
            // const ticketStats = await getTicketStatsApi();
            
            // Simulate API call with timeout
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Sample data - replace with your actual API response
            const data: AdminDataState = {
                vipList: [
                    { id: 1, name: 'VIP Member 1', email: 'vip1@example.com', wallet: '0x123...456' },
                    { id: 2, name: 'VIP Member 2', email: 'vip2@example.com', wallet: '0x789...012' },
                ],
                ticketStats: {
                    total: 250,
                    claimed: 187,
                    remaining: 63
                },
                lastFetched: new Date().toISOString()
            };
            
            // Store in sessionStorage to persist between page navigations
            sessionStorage.setItem('blockfestAdminData', JSON.stringify(data));
            setIsDataFetched(true);
            toast.success('Admin data fetched and stored successfully', { id: 'admin-data-fetch' });
        } catch (err: any) {
            console.error('Admin data fetch error:', err);
            toast.error(`Failed to fetch data: ${err.message || 'Unknown error'}`, { id: 'admin-data-fetch' });
        } finally {
            setIsFetching(false);
        }
    };

    const clearStoredData = () => {
        sessionStorage.removeItem('blockfestAdminData');
        setIsDataFetched(false);
        toast.success('Admin data cleared');
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-accent-light">Admin Dashboard</h1>
            {user && <p className='text-text-secondary mb-6'>Welcome, Admin {user.email}!</p>}

            {/* Admin Data Button Section */}
            <section className="bg-secondary-dark p-6 rounded-lg shadow-lg border border-accent-glow/20">
                <h2 className="text-xl font-semibold text-text-main mb-4">Admin Session Data</h2>
                
                {isDataFetched ? (
                    <div className="space-y-4">
                        <div className="flex items-center mb-2">
                            <div className="w-3 h-3 bg-accent-glow rounded-full mr-2"></div>
                            <span className="text-accent-light font-medium">Data loaded and stored in session</span>
                        </div>
                        
                        <p className="text-text-secondary">
                            VIP list and ticket data is stored in your session and will persist until you logout.
                        </p>
                        
                        <div className="flex space-x-4">
                            <GlowingButton 
                                onClick={fetchAndStoreData}
                                disabled={isFetching}
                            >
                                {isFetching ? 'Refreshing...' : 'Refresh Data'}
                            </GlowingButton>
                            
                            <button 
                                onClick={clearStoredData}
                                className="px-4 py-2 bg-secondary-light text-text-main rounded hover:bg-secondary-light/80 transition-colors"
                            >
                                Clear Data
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-text-secondary">
                            Fetch your admin data to keep it accessible while you navigate through different pages.
                        </p>
                        
                        <GlowingButton 
                            onClick={fetchAndStoreData}
                            disabled={isFetching}
                        >
                            {isFetching ? (
                                <>
                                    <span className="inline-block mr-2 animate-spin">⟳</span>
                                    Fetching Data...
                                </>
                            ) : (
                                'Fetch and Store Admin Data'
                            )}
                        </GlowingButton>
                        
                        <p className="text-text-secondary text-sm mt-2">
                            Data will be available until you logout
                        </p>
                    </div>
                )}
            </section>

            {/* VIP Upload Section */}
            <section className="bg-secondary-dark p-6 rounded-lg shadow-lg border border-accent-glow/20">
                <h2 className="text-xl font-semibold text-text-main mb-4">Upload VIP List</h2>
                <div className="flex flex-col space-y-2">
                    <input
                        id="vip-file-input"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="mb-2"
                    />
                    
                    {/* Show stored file info if available */}
                    {storedFileInfo && (
                        <div className="flex items-center mb-4 text-text-secondary">
                            <span>
                                {storedFileInfo.uploaded ? '✓ ' : ''}
                                File selected: {storedFileInfo.name}
                                {storedFileInfo.uploaded && ' (Uploaded)'}
                            </span>
                            <button 
                                className="ml-2 text-accent-light hover:text-accent-glow"
                                onClick={clearStoredFile}
                            >
                                ✕
                            </button>
                        </div>
                    )}
                    
                    <div className="flex space-x-4">
                        <GlowingButton 
                            onClick={handleUploadVIPList} 
                            disabled={!vipFile || uploading}
                        >
                            {uploading ? 'Uploading...' : storedFileInfo?.uploaded ? 'Upload Again' : 'Upload CSV'}
                        </GlowingButton>
                        
                        {(!vipFile && !storedFileInfo) && (
                            <p className="text-text-secondary italic">
                                Please select a CSV file
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* Ticket Viewing Section */}
            <section className="bg-secondary-dark p-6 rounded-lg shadow-lg border border-accent-glow/20">
                <h2 className="text-xl font-semibold text-text-main mb-4">View All Issued Tickets</h2>
                <GlowingButton onClick={handleViewAllTickets} disabled={loadingTickets}>
                    {loadingTickets ? 'Loading...' : 'Fetch All Tickets'}
                </GlowingButton>

                {loadingTickets && <p className="text-text-secondary mt-4">Loading ticket data...</p>}
                
                {!loadingTickets && allTickets.length > 0 && (
                    <div className="mt-6 overflow-x-auto">
                        <table className="min-w-full divide-y divide-accent-glow/20 text-left text-sm">
                            <thead className="bg-primary-dark/50">
                                <tr>
                                    <th className="px-4 py-2 font-medium text-text-secondary">Token ID</th>
                                    <th className="px-4 py-2 font-medium text-text-secondary">Owner</th>
                                    <th className="px-4 py-2 font-medium text-text-secondary">Event</th>
                                    <th className="px-4 py-2 font-medium text-text-secondary">Seat</th>
                                    <th className="px-4 py-2 font-medium text-text-secondary">QR Hash</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-dark">
                                {allTickets.map((ticket) => (
                                    <tr key={ticket.tokenId} className="hover:bg-secondary-dark/50">
                                        <td className="px-4 py-2 text-text-main">{ticket.tokenId}</td>
                                        <td className="px-4 py-2 text-text-main truncate" title={ticket.owner}>
                                            {`${ticket.owner.substring(0, 6)}...${ticket.owner.substring(ticket.owner.length - 4)}`}
                                        </td>
                                        <td className="px-4 py-2 text-text-main">{ticket.eventName || 'N/A'}</td>
                                        <td className="px-4 py-2 text-text-main">{ticket.seat || 'N/A'}</td>
                                        <td className="px-4 py-2 text-text-main truncate" title={ticket.qrHash}>
                                            {ticket.qrHash || 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {!loadingTickets && allTickets.length === 0 && (
                    <div className="flex flex-wrap gap-6 mt-6">
                        <div className="w-[170px]">
                            <NFTTicketCard
                                ticket={{
                                    id: 0,
                                    eventName: 'VIP Ticket - BlockFest',
                                    price: '0.001',
                                    seatNumber: 'Seat-0',
                                    qrValue: 'sample-qr',
                                    imageUrl: 'https://ipfs.io/ipfs/bafybeidiruone3wadolwzvzm4hgrkvyddqrqoy73pd7c6y2hensxjzrarq',
                                }}
                                onBuy={() => {}}
                                isOwned={true}
                            />
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminDashboard;