import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CORAL_CONFIG } from "../config/coralConfig";
import { BridgeKeyWalletState } from "../types";

export function useBridgeKeyWallet() {
  const [walletState, setWalletState] = useState<BridgeKeyWalletState>({
    isInstalled: false,
    isConnected: false,
    isConnecting: false,
    account: null,
    chainId: null,
    isCorrectNetwork: false,
    balance: "0.0",
    error: null,
  });

  const [providerInstance, setProviderInstance] = useState<any>(null);

  /**
   * Discovers and verifies the BridgeKey provider strictly according to specification.
   */
  const getBridgeKeyProvider = useCallback((): any | null => {
    if (typeof window === "undefined") return null;

    const win = window as any;

    // 1. Direct BridgeKey injected provider
    if (win.bridgekey) return win.bridgekey;
    if (win.bridgeKey) return win.bridgeKey;

    // 2. Multi-provider or window.ethereum check
    if (win.ethereum) {
      // Check if ethereum is an array of providers (EIP-5749 / EIP-6963 multi-injected)
      if (Array.isArray(win.ethereum.providers)) {
        const found = win.ethereum.providers.find(
          (p: any) => p.isBridgeKey === true || p.rdns === "io.bridgekey"
        );
        if (found) return found;
      }

      // Check single provider
      if (win.ethereum.isBridgeKey === true) {
        return win.ethereum;
      }
    }

    return null;
  }, []);

  /**
   * Refreshes balance of the connected account in tMSTC
   */
  const refreshBalance = useCallback(
    async (account: string, provider: any) => {
      try {
        const balanceHex = await provider.request({
          method: "eth_getBalance",
          params: [account, "latest"],
        });
        const balWei = BigInt(balanceHex);
        const formatted = ethers.formatEther(balWei);
        // format to 4 decimals
        const num = parseFloat(formatted);
        const display = isNaN(num) ? "0.0" : num.toFixed(4);

        setWalletState((prev) => ({
          ...prev,
          balance: display,
        }));
      } catch (err) {
        console.warn("Failed to fetch balance:", err);
      }
    },
    []
  );

  /**
   * Check installation on mount and listen for EIP-6963 announcements
   */
  useEffect(() => {
    let announcedBridgeKey: any = null;

    // EIP-6963 announcement listener
    const onAnnounceProvider = (event: any) => {
      if (
        event?.detail?.info?.rdns === "io.bridgekey" ||
        event?.detail?.info?.rdns === "io.bridgekey.wallet" ||
        event?.detail?.info?.name?.toLowerCase().includes("bridgekey")
      ) {
        announcedBridgeKey = event.detail.provider;
        setWalletState((prev) => ({ ...prev, isInstalled: true }));
      }
    };

    window.addEventListener("eip6963:announceProvider", onAnnounceProvider);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    const provider = getBridgeKeyProvider() || announcedBridgeKey;
    if (provider) {
      setWalletState((prev) => ({ ...prev, isInstalled: true }));
    } else {
      // Check if another wallet is trying to masquerade
      const win = window as any;
      if (win.ethereum && !win.ethereum.isBridgeKey) {
        // Detected non-BridgeKey wallet
        setWalletState((prev) => ({
          ...prev,
          isInstalled: false,
          error:
            "Non-BridgeKey provider detected. VEIL BugBounty Escrow operates exclusively with BridgeKey Wallet on MST Coral Testnet.",
        }));
      }
    }

    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnounceProvider);
    };
  }, [getBridgeKeyProvider]);

  /**
   * Connect to BridgeKey Wallet
   */
  const connect = useCallback(async () => {
    const win = window as any;
    const provider = getBridgeKeyProvider();

    // Check for non-BridgeKey masquerade
    if (!provider && win.ethereum) {
      setWalletState((prev) => ({
        ...prev,
        error:
          "Detected another wallet (e.g. MetaMask / Coinbase). Please disable competing extensions or open BridgeKey Wallet to connect.",
      }));
      return;
    }

    if (!provider) {
      setWalletState((prev) => ({
        ...prev,
        error:
          "BridgeKey Wallet is not detected. Please install the BridgeKey browser extension to use the VEIL BugBounty Escrow on MST Coral Testnet.",
      }));
      return;
    }

    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts: string[] = await provider.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts authorized by user in BridgeKey.");
      }

      const activeAccount = accounts[0];
      const chainIdHex: string = await provider.request({
        method: "eth_chainId",
      });
      const chainId = parseInt(chainIdHex, 16);
      const isCorrect = chainId === CORAL_CONFIG.chainId || chainId === 4646 || chainId === 54635;

      setProviderInstance(provider);
      setWalletState({
        isInstalled: true,
        isConnected: true,
        isConnecting: false,
        account: activeAccount,
        chainId,
        isCorrectNetwork: isCorrect,
        balance: "0.0",
        error: isCorrect
          ? null
          : `Connected to Chain ID ${chainId}. ${CORAL_CONFIG.networkName} (Chain ID ${CORAL_CONFIG.chainId}) is required.`,
      });

      if (isCorrect) {
        await refreshBalance(activeAccount, provider);
      }
    } catch (err: any) {
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: err.message || "User rejected connection request in BridgeKey.",
      }));
    }
  }, [getBridgeKeyProvider, refreshBalance]);

  /**
   * Switch or add MST Coral Testnet to BridgeKey
   */
  const switchToCoral = useCallback(async () => {
    const provider = providerInstance || getBridgeKeyProvider();
    if (!provider) return;

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CORAL_CONFIG.chainIdHex }],
      });
    } catch (switchError: any) {
      // 4902 error code indicates the chain has not been added to the wallet
      if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: CORAL_CONFIG.chainIdHex,
                chainName: CORAL_CONFIG.networkName,
                rpcUrls: [CORAL_CONFIG.rpcUrls.http],
                nativeCurrency: {
                  name: CORAL_CONFIG.nativeCurrency.name,
                  symbol: CORAL_CONFIG.nativeCurrency.symbol,
                  decimals: CORAL_CONFIG.nativeCurrency.decimals,
                },
                blockExplorerUrls: [CORAL_CONFIG.blockExplorer],
              },
            ],
          });
        } catch (addError: any) {
          setWalletState((prev) => ({
            ...prev,
            error: `Failed to add MST Coral Testnet to BridgeKey: ${addError.message}`,
          }));
        }
      } else {
        setWalletState((prev) => ({
          ...prev,
          error: `Failed to switch to MST Coral Testnet: ${switchError.message}`,
        }));
      }
    }
  }, [providerInstance, getBridgeKeyProvider]);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    setWalletState((prev) => ({
      ...prev,
      isConnected: false,
      account: null,
      balance: "0.0",
      error: null,
    }));
  }, []);

  /**
   * Listen for account and chain change events
   */
  useEffect(() => {
    const provider = providerInstance || getBridgeKeyProvider();
    if (!provider || !provider.on) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        const newAccount = accounts[0];
        setWalletState((prev) => ({
          ...prev,
          account: newAccount,
          isConnected: true,
        }));
        refreshBalance(newAccount, provider);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      const isCorrect = chainId === CORAL_CONFIG.chainId || chainId === 4646 || chainId === 54635;
      setWalletState((prev) => ({
        ...prev,
        chainId,
        isCorrectNetwork: isCorrect,
        error: isCorrect
          ? null
          : `Connected to Chain ID ${chainId}. ${CORAL_CONFIG.networkName} (Chain ID ${CORAL_CONFIG.chainId}) is required.`,
      }));
      if (walletState.account) {
        refreshBalance(walletState.account, provider);
      }
    };

    const handleDisconnect = () => {
      disconnect();
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);
    provider.on("disconnect", handleDisconnect);

    return () => {
      if (provider.removeListener) {
        provider.removeListener("accountsChanged", handleAccountsChanged);
        provider.removeListener("chainChanged", handleChainChanged);
        provider.removeListener("disconnect", handleDisconnect);
      }
    };
  }, [providerInstance, getBridgeKeyProvider, walletState.account, disconnect, refreshBalance]);

  /**
   * Get ethers BrowserProvider backed strictly by BridgeKey
   */
  const getEthersSigner = useCallback(async (): Promise<ethers.Signer> => {
    const provider = providerInstance || getBridgeKeyProvider();
    if (!provider) {
      throw new Error("BridgeKey provider is not available.");
    }

    if (!walletState.isCorrectNetwork) {
      throw new Error(`Active network is not ${CORAL_CONFIG.networkName} (Chain ID ${CORAL_CONFIG.chainId}). Please switch network in BridgeKey.`);
    }

    const browserProvider = new ethers.BrowserProvider(provider);
    return await browserProvider.getSigner();
  }, [providerInstance, getBridgeKeyProvider, walletState.isCorrectNetwork]);

  return {
    ...walletState,
    connect,
    disconnect,
    switchToCoral,
    refreshBalance: () => {
      if (walletState.account) {
        const p = providerInstance || getBridgeKeyProvider();
        if (p) refreshBalance(walletState.account, p);
      }
    },
    getEthersSigner,
    rawProvider: providerInstance || getBridgeKeyProvider(),
  };
}

