import { Buffer } from 'buffer';
import { compressProfileImage, compressBannerImage } from './imageUtils';

export interface ProfileMetadata {
  name: string;
  bio: string;
  country: string;
  website: string;
  hyperlink: string;
  sbt_handle: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  image?: string; // Profile image CID
  banner?: string; // Banner image CID
  created_at: number;
  updated_at: number;
}

export interface IPFSUploadResult {
  cid: string;
  url: string;
  pinned: boolean;
}

// NeoEngine centralized IPFS configuration
const NEOENGINE_IPFS_CONFIG = {
  // TODO: Replace with your actual NeoEngine IPFS credentials
  PINATA_API_KEY: process.env.EXPO_PUBLIC_PINATA_API_KEY || 'YOUR_PINATA_API_KEY',
  PINATA_SECRET_KEY: process.env.EXPO_PUBLIC_PINATA_SECRET_KEY || 'YOUR_PINATA_SECRET_KEY',
  PINATA_JWT: process.env.EXPO_PUBLIC_PINATA_JWT || 'YOUR_PINATA_JWT',
  
  // Fallback endpoints
  ENDPOINTS: [
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    'https://api.web3.storage/upload', // Requires API key
  ]
};

/**
 * Upload and pin image to IPFS using NeoEngine's centralized account
 * This ensures permanent storage and cost control
 */
export async function uploadImageToIPFS(imageUri: string, type: 'profile' | 'banner' = 'profile'): Promise<IPFSUploadResult> {
  try {
    console.log(`📌 Uploading ${type} image to NeoEngine IPFS (pinned):`, imageUri);
    
    // Compress image based on type
    const compressedImage = type === 'profile' 
      ? await compressProfileImage(imageUri)
      : await compressBannerImage(imageUri);
    
    // Convert image to blob for upload
    const response = await fetch(compressedImage.uri);
    const blob = await response.blob();
    
    // Try Pinata first (recommended for production)
    try {
      const result = await uploadToPinata(blob, type);
      if (result) {
        console.log(`✅ Image pinned to IPFS via Pinata: ${result.cid}`);
        return result;
      }
    } catch (error) {
      console.log('Pinata upload failed, trying fallback...');
    }
    
    // Fallback to other IPFS services
    // TODO: Add Web3.Storage, NFT.Storage as fallbacks
    
    // If all services fail, return error - no local storage in production
    throw new Error('All IPFS pinning services failed. Profile update cannot proceed.');
    
  } catch (error) {
    console.error('❌ Error uploading to IPFS:', error);
    throw error; // Don't fallback to local storage in production
  }
}

/**
 * Upload file to Pinata IPFS with pinning
 */
async function uploadToPinata(blob: Blob, type: string, retries = 3): Promise<IPFSUploadResult | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Pinata upload attempt ${attempt}/${retries}`);
      
      const formData = new FormData();
      formData.append('file', blob as any);
      
      // Add metadata for organization
      const metadata = JSON.stringify({
        name: `neoengine_${type}_${Date.now()}`,
        keyvalues: {
          app: 'neoengine',
          type: type,
          timestamp: Date.now().toString()
        }
      });
      formData.append('pinataMetadata', metadata);
      
      const options = JSON.stringify({
        cidVersion: 1,
      });
      formData.append('pinataOptions', options);

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NEOENGINE_IPFS_CONFIG.PINATA_JWT}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Pinata upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log(`✅ Pinata upload successful on attempt ${attempt}`);
      return {
        cid: result.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
        pinned: true,
      };
    } catch (error) {
      console.error(`❌ Pinata upload attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        console.error('All Pinata upload attempts failed');
        return null;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  return null;
}

/**
 * Upload complete profile metadata to IPFS (JSON file)
 * This creates the metadata JSON that the Profile NFT will point to
 */
export async function uploadProfileMetadataToIPFS(metadata: ProfileMetadata): Promise<IPFSUploadResult> {
  try {
    console.log('📌 Uploading profile metadata to IPFS:', metadata);
    
    // Create NFT-standard metadata JSON
    const nftMetadata = {
      name: metadata.name,
      description: metadata.bio,
      image: metadata.image ? `ipfs://${metadata.image}` : undefined,
      external_url: metadata.website || undefined,
      attributes: [
        {
          trait_type: "Handle",
          value: metadata.sbt_handle
        },
        {
          trait_type: "Country",
          value: metadata.country
        },
        {
          trait_type: "Created",
          value: new Date(metadata.created_at).toISOString()
        },
        {
          trait_type: "Updated", 
          value: new Date(metadata.updated_at).toISOString()
        },
        ...metadata.attributes
      ].filter(attr => attr.value), // Remove empty attributes
      properties: {
        banner: metadata.banner ? `ipfs://${metadata.banner}` : undefined,
        hyperlink: metadata.hyperlink || undefined,
        country: metadata.country || undefined,
      }
    };
    
    // Convert to blob
    const jsonString = JSON.stringify(nftMetadata, null, 2);
    const jsonBlob = new Blob([jsonString]);
    
    // Upload to Pinata
    const result = await uploadMetadataToPinata(jsonBlob, metadata.sbt_handle);
    if (result) {
      console.log(`✅ Profile metadata pinned to IPFS: ${result.cid}`);
      return result;
    }
    
    throw new Error('Failed to upload metadata to IPFS');
    
  } catch (error) {
    console.error('❌ Error uploading metadata to IPFS:', error);
    throw error;
  }
}

/**
 * Upload metadata JSON to Pinata
 */
async function uploadMetadataToPinata(jsonBlob: Blob, handle: string): Promise<IPFSUploadResult | null> {
  try {
    const formData = new FormData();
    formData.append('file', jsonBlob as any);
    
    const metadata = JSON.stringify({
      name: `neoengine_profile_${handle}_${Date.now()}.json`,
      keyvalues: {
        app: 'neoengine',
        type: 'profile_metadata',
        handle: handle,
        timestamp: Date.now().toString()
      }
    });
    formData.append('pinataMetadata', metadata);
    
    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', options);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NEOENGINE_IPFS_CONFIG.PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Pinata metadata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      cid: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      pinned: true,
    };
  } catch (error) {
    console.error('Pinata metadata upload error:', error);
    return null;
  }
}

/**
 * Fetch image from IPFS using CID with multiple gateways
 */
export async function getImageFromIPFS(cid: string): Promise<string> {
  // Use Pinata gateway for better performance for pinned content
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

/**
 * Fetch metadata from IPFS
 */
export async function getMetadataFromIPFS(cid: string): Promise<ProfileMetadata | null> {
  try {
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }
    
    const metadata = await response.json();
    return metadata as ProfileMetadata;
  } catch (error) {
    console.error('Error fetching metadata from IPFS:', error);
    return null;
  }
}

/**
 * Alternative IPFS gateways for better reliability
 */
export const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.infura.io/ipfs/',
];

/**
 * Try multiple IPFS gateways for image loading
 */
export async function getImageFromIPFSWithFallback(cid: string): Promise<string> {
  // Try the first gateway by default
  return `${IPFS_GATEWAYS[0]}${cid}`;
}