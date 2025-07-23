import { Image } from 'react-native';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CompressedImage {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
}

/**
 * Get image dimensions from URI
 */
export const getImageDimensions = (uri: string): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      reject
    );
  });
};

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
export const calculateResizedDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): ImageDimensions => {
  const aspectRatio = originalWidth / originalHeight;
  
  let newWidth = originalWidth;
  let newHeight = originalHeight;
  
  // Scale down if too wide
  if (newWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = newWidth / aspectRatio;
  }
  
  // Scale down if too tall
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }
  
  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight)
  };
};

/**
 * Compress and resize image for profile picture
 * Target: 400x400 max, 85% quality
 */
export const compressProfileImage = async (uri: string): Promise<CompressedImage> => {
  const { width, height } = await getImageDimensions(uri);
  const newDimensions = calculateResizedDimensions(width, height, 400, 400);
  
  try {
    // Try to use react-native-image-resizer if available
    const ImageResizer = require('react-native-image-resizer');
    
    const resizedImage = await ImageResizer.createResizedImage(
      uri,
      newDimensions.width,
      newDimensions.height,
      'JPEG',
      85, // 85% quality
      0, // rotation
      undefined, // output path
      false, // keep original orientation
      { mode: 'contain', onlyScaleDown: true }
    );
    
    return {
      uri: resizedImage.uri,
      width: newDimensions.width,
      height: newDimensions.height,
      fileSize: resizedImage.size || 0,
    };
  } catch (error) {
    // Fallback to original image if resizer is not available
    console.log('Image resizer not available, using original image');
    return {
      uri: uri,
      width: newDimensions.width,
      height: newDimensions.height,
      fileSize: 0,
    };
  }
};

/**
 * Compress and resize image for banner
 * Target: 1200x400 max, 85% quality
 */
export const compressBannerImage = async (uri: string): Promise<CompressedImage> => {
  const { width, height } = await getImageDimensions(uri);
  const newDimensions = calculateResizedDimensions(width, height, 1200, 400);
  
  try {
    // Try to use react-native-image-resizer if available
    const ImageResizer = require('react-native-image-resizer');
    
    const resizedImage = await ImageResizer.createResizedImage(
      uri,
      newDimensions.width,
      newDimensions.height,
      'JPEG',
      85, // 85% quality
      0, // rotation
      undefined, // output path
      false, // keep original orientation
      { mode: 'contain', onlyScaleDown: true }
    );
    
    return {
      uri: resizedImage.uri,
      width: newDimensions.width,
      height: newDimensions.height,
      fileSize: resizedImage.size || 0,
    };
  } catch (error) {
    // Fallback to original image if resizer is not available
    console.log('Image resizer not available, using original image');
    return {
      uri: uri,
      width: newDimensions.width,
      height: newDimensions.height,
      fileSize: 0,
    };
  }
};

/**
 * Convert image to base64 for IPFS upload
 */
export const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove the data URL prefix (data:image/jpeg;base64,)
        const base64 = base64data.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

/**
 * Get file extension from URI
 */
export const getFileExtension = (uri: string): string => {
  const extension = uri.split('.').pop()?.toLowerCase();
  return extension || 'jpg';
};

/**
 * Generate a unique filename for the image
 */
export const generateImageFilename = (type: 'profile' | 'banner', walletAddress: string): string => {
  const timestamp = Date.now();
  const walletShort = walletAddress.slice(0, 8);
  return `${type}_${walletShort}_${timestamp}.jpg`;
};