/**
 * Converts IPFS URI to HTTPS URL and fetches JSON metadata
 * This function handles both IPFS URIs and regular URLs, with improved logging and error handling
 */
export async function fetchMetadataFromUri(uri: string | null): Promise<any | null> {
    if (!uri) {
        console.warn("Missing URI");
        return null;
    }
    
    let gatewayUrl = uri;
    
    // Convert IPFS URI to an HTTPS gateway URL if needed
    if (uri.startsWith('ipfs://')) {
        const cid = uri.substring(7); // Remove "ipfs://"
        // Using ipfs.io as default gateway - replace with your preferred gateway if needed
        gatewayUrl = `https://ipfs.io/ipfs/${cid}`;
        console.log("Converting IPFS URI to:", gatewayUrl);
    }
    
    try {
        console.log("Fetching metadata from:", gatewayUrl);
        const response = await fetch(gatewayUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${gatewayUrl}`);
        }
        
        const metadata = await response.json();
        
        // Also convert image URI within metadata if it's IPFS
        if (metadata?.image) {
            if (metadata.image.startsWith('ipfs://')) {
                const imageCid = metadata.image.substring(7);
                // Try multiple IPFS gateways in case one fails
                const gateways = [
                    'https://ipfs.io/ipfs/',
                    'https://gateway.pinata.cloud/ipfs/',
                    'https://cloudflare-ipfs.com/ipfs/'
                ];
                
                // Test which gateway responds fastest
                const imageUrl = await Promise.any(
                    gateways.map(async (gateway) => {
                        const url = `${gateway}${imageCid}`;
                        const response = await fetch(url, { method: 'HEAD' });
                        if (response.ok) {
                            return url;
                        }
                        throw new Error(`Gateway ${gateway} failed`);
                    })
                ).catch(() => `https://ipfs.io/ipfs/${imageCid}`); // Fallback to default gateway
                
                metadata.image = imageUrl;
                console.log("Converting image IPFS URI to:", metadata.image);
            }
            
            // Verify the image URL is accessible
            try {
                const imageResponse = await fetch(metadata.image, { method: 'HEAD' });
                if (!imageResponse.ok) {
                    console.warn(`Image URL not accessible: ${metadata.image}`);
                    metadata.image = undefined;
                }
            } catch (error) {
                console.warn(`Failed to verify image URL: ${metadata.image}`, error);
                metadata.image = undefined;
            }
        }
        
        return metadata;
    } catch (error) {
        console.error(`Failed to fetch or parse metadata from ${gatewayUrl}:`, error);
        return null;
    }
}

export default fetchMetadataFromUri;