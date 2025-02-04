interface EthereumProvider {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (eventName: string, handler: (params: any) => void) => void;
    removeListener: (eventName: string, handler: (params: any) => void) => void;
  }
  
  declare global {
    interface Window {
      ethereum?: EthereumProvider;
    }
  }
  
  export {};
  