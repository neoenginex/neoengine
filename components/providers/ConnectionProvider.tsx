import {Connection, type ConnectionConfig, clusterApiUrl} from '@solana/web3.js';
import React, {
  type FC,
  type ReactNode,
  useMemo,
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

export const RPC_ENDPOINT = 'devnet';

// Fallback RPC endpoints for better reliability
const RPC_ENDPOINTS = [
  'https://api.devnet.solana.com',
  'https://rpc.ankr.com/solana_devnet',
  clusterApiUrl('devnet'),
];

export interface ConnectionProviderProps {
  children: ReactNode;
  endpoint: string;
  config?: ConnectionConfig;
}

// Create a robust connection with fallback support
async function createRobustConnection(config: ConnectionConfig): Promise<Connection> {
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      console.log('🔗 Attempting connection to:', endpoint);
      const connection = new Connection(endpoint, config);
      
      // Test the connection
      await Promise.race([
        connection.getSlot(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      
      console.log('✅ Connected to:', endpoint);
      return connection;
    } catch (error) {
      console.log('❌ Connection failed for:', endpoint, error);
      continue;
    }
  }
  
  // If all else fails, return default connection
  console.log('⚠️ Using default connection as fallback');
  return new Connection(RPC_ENDPOINTS[0], config);
}

export const ConnectionProvider: FC<ConnectionProviderProps> = ({
  children,
  endpoint,
  config = {commitment: 'confirmed'},
}) => {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    
    // Prevent multiple simultaneous connection attempts
    if (isConnecting || connection) {
      return;
    }

    setIsConnecting(true);
    createRobustConnection(config).then(newConnection => {
      if (!isCancelled) {
        setConnection(newConnection);
        setIsConnecting(false);
      }
    }).catch(error => {
      console.error('Failed to create robust connection:', error);
      if (!isCancelled) {
        setIsConnecting(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []); // Remove config dependency to prevent re-connections

  const fallbackConnection = useMemo(
    () => new Connection(endpoint, config),
    [endpoint, config],
  );

  // Use robust connection if available, otherwise fallback
  const activeConnection = connection || fallbackConnection;

  return (
    <ConnectionContext.Provider value={{connection: activeConnection}}>
      {children}
    </ConnectionContext.Provider>
  );
};

export interface ConnectionContextState {
  connection: Connection;
}

export const ConnectionContext = createContext<ConnectionContextState>(
  {} as ConnectionContextState,
);

export function useConnection(): ConnectionContextState {
  return useContext(ConnectionContext);
}
