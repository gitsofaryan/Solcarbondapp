import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, ReactNode } from 'react';
import { Platform, Alert } from 'react-native';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import { WalletModal } from '../components/WalletModal';
import { DisconnectModal } from '../components/DisconnectModal';
import { CC_TOKEN_MINT } from '../utils/solana';

const TREASURY_ADDRESS = '4yEfgUdei5xQUrTwDA79vNTD9dPGS713qocD6XbkZcFB';

// MWA imports — only used on native mobile
let transactMWA: any = null;
if (Platform.OS !== 'web') {
    try {
        const mwa = require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
        transactMWA = mwa.transact;
    } catch (e) { }
}

const APP_IDENTITY = {
    name: 'SolCarbon',
    uri: 'https://solcarbon.io',
    icon: 'favicon.ico',
};

interface WalletContextType {
    publicKey: PublicKey | null;
    connected: boolean;
    connecting: boolean;
    sending: boolean;
    walletAddress: string | null;
    walletName: string | null;
    solBalance: number | null;
    openConnectModal: () => void;
    openDisconnectModal: () => void;
    disconnect: () => void;
    getBalance: () => Promise<number>;
    refreshBalance: () => Promise<void>;
    signTransaction: (tx: Transaction) => Promise<Transaction>;
    sendSOL: (toAddress: string, amountSOL: number) => Promise<any>;
    connection: Connection;
    protocolInfo: {
        treasury: string;
        mint: string;
    };
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWalletContext() {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error('useWalletContext must be used within WalletProvider');
    return ctx;
}

// ── WEB WALLET CONNECT ──
async function connectWebWallet(walletId: string): Promise<{ pubkey: PublicKey; name: string }> {
    let provider: any = null;

    if (walletId === 'phantom') {
        provider = (window as any).phantom?.solana ?? (window as any).solana;
    } else if (walletId === 'solflare') {
        provider = (window as any).solflare;
    } else if (walletId === 'backpack') {
        provider = (window as any).backpack;
    } else {
        // Fallback to any available
        provider = (window as any).phantom?.solana ?? (window as any).solana ?? (window as any).solflare;
    }

    if (!provider) {
        const names: Record<string, string> = {
            phantom: 'Phantom', solflare: 'Solflare', backpack: 'Backpack', glow: 'Glow',
        };
        const urls: Record<string, string> = {
            phantom: 'https://phantom.app/', solflare: 'https://solflare.com/',
            backpack: 'https://backpack.app/', glow: 'https://glow.app/',
        };
        Alert.alert(
            `Install ${names[walletId] || 'Wallet'}`,
            `${names[walletId] || 'Wallet'} extension not detected.\nInstall it from your browser's extension store.`,
            [
                { text: 'Get It', onPress: () => { (window as any).open(urls[walletId] || 'https://phantom.app/', '_blank'); } },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
        throw new Error('Wallet not installed');
    }

    const resp = await provider.connect();
    return { pubkey: new PublicKey(resp.publicKey.toString()), name: walletId };
}

// ── MOBILE WALLET CONNECT ──
async function connectMobileWallet(): Promise<{ pubkey: PublicKey; name: string }> {
    if (!transactMWA) {
        Alert.alert('Error', 'Mobile Wallet Adapter not available. Please install Phantom.');
        throw new Error('MWA not available');
    }
    const authResult = await transactMWA(async (wallet: any) => {
        return await wallet.authorize({ chain: 'solana:devnet', identity: APP_IDENTITY });
    });
    return {
        pubkey: new PublicKey(Buffer.from(authResult.accounts[0].address, 'base64')),
        name: 'phantom',
    };
}

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
    const [walletName, setWalletName] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [connectingWalletId, setConnectingWalletId] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [connectModalVisible, setConnectModalVisible] = useState(false);
    const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);

    const connection = useMemo(() => new Connection(clusterApiUrl('devnet'), 'confirmed'), []);

    const handleSelectWallet = useCallback(async (walletId: string) => {
        setConnecting(true);
        setConnectingWalletId(walletId);
        try {
            let result: { pubkey: PublicKey; name: string };
            if (Platform.OS === 'web') {
                result = await connectWebWallet(walletId);
            } else {
                result = await connectMobileWallet();
            }
            setPublicKey(result.pubkey);
            setWalletName(result.name);
            setConnectModalVisible(false);
        } catch (err: any) {
            console.error('Wallet connect error:', err);
            if (err.message !== 'Wallet not installed') {
                Alert.alert('Connection Failed', err.message || 'Could not connect wallet.');
            }
        } finally {
            setConnecting(false);
            setConnectingWalletId(null);
        }
    }, []);

    const disconnect = useCallback(() => {
        if (Platform.OS === 'web') {
            try {
                const solana = (window as any).phantom?.solana ?? (window as any).solana;
                if (solana?.disconnect) solana.disconnect();
            } catch (_) { }
        }
        setPublicKey(null);
        setWalletName(null);
        setSolBalance(null);
    }, []);

    const openConnectModal = useCallback(() => setConnectModalVisible(true), []);
    const openDisconnectModal = useCallback(() => setDisconnectModalVisible(true), []);

    const getBalance = useCallback(async () => {
        if (!publicKey) return 0;
        const balance = await connection.getBalance(publicKey);
        return balance / LAMPORTS_PER_SOL;
    }, [publicKey, connection]);

    const signTransaction = useCallback(
        async (tx: Transaction) => {
            if (!publicKey) throw new Error('Wallet not connected');

            if (Platform.OS === 'web') {
                const win = window as any;
                let provider: any = null;

                if (walletName === 'phantom') provider = win.phantom?.solana ?? win.solana;
                else if (walletName === 'solflare') provider = win.solflare;
                else if (walletName === 'backpack') provider = win.backpack;
                else provider = win.solana;

                if (!provider) throw new Error(`${walletName || 'Wallet'} provider not found`);
                return await provider.signTransaction(tx);
            } else {
                if (!transactMWA) throw new Error('MWA not available');
                return await transactMWA(async (wallet: any) => {
                    await wallet.authorize({ chain: 'solana:devnet', identity: APP_IDENTITY });
                    const signed = await wallet.signTransactions({ transactions: [tx] });
                    // MWA returns the transaction in the same format/Buffer, we need to re-parse or return
                    return Transaction.from(Buffer.from(signed[0]));
                });
            }
        },
        [publicKey]
    );

    const sendSOL = useCallback(
        async (toAddress: string, amountSOL: number) => {
            if (!publicKey) throw new Error('Wallet not connected');
            setSending(true);
            try {
                const tx = new Transaction().add(
                    SystemProgram.transfer({
                        fromPubkey: publicKey,
                        toPubkey: new PublicKey(toAddress),
                        lamports: Math.round(amountSOL * LAMPORTS_PER_SOL),
                    })
                );
                const { blockhash } = await connection.getLatestBlockhash();
                tx.recentBlockhash = blockhash;
                tx.feePayer = publicKey;

                const signed = await signTransaction(tx);
                const sig = await connection.sendRawTransaction(signed.serialize());
                await connection.confirmTransaction(sig, 'confirmed');

                // Refresh balance immediately after success
                refreshBalance();
                return sig;
            } finally {
                setSending(false);
            }
        },
        [publicKey, connection, signTransaction]
    );

    // ── Auto-fetch SOL balance on connect & every 30s ──
    const refreshBalance = useCallback(async () => {
        if (!publicKey) { setSolBalance(null); return; }
        try {
            const bal = await connection.getBalance(publicKey);
            setSolBalance(bal / LAMPORTS_PER_SOL);
        } catch (e) {
            console.error('Failed to fetch balance:', e);
        }
    }, [publicKey, connection]);

    useEffect(() => {
        if (publicKey) {
            refreshBalance();
            const interval = setInterval(refreshBalance, 10000); // 10s refresh for "Very Real" feel
            return () => clearInterval(interval);
        } else {
            setSolBalance(null);
        }
    }, [publicKey, refreshBalance]);

    // ── Listen for account changes (Web) ──
    useEffect(() => {
        if (Platform.OS === 'web') {
            const win = window as any;
            const provider = win.phantom?.solana ?? win.solana ?? win.solflare;
            if (provider?.on) {
                const handleAccountChange = (newPublicKey: PublicKey | null) => {
                    if (newPublicKey) {
                        setPublicKey(new PublicKey(newPublicKey.toString()));
                    } else {
                        disconnect();
                    }
                };
                provider.on('accountChanged', handleAccountChange);
                provider.on('connect', (pk: PublicKey) => setPublicKey(new PublicKey(pk.toString())));
                provider.on('disconnect', disconnect);
                return () => {
                    if (provider.removeListener) {
                        provider.removeListener('accountChanged', handleAccountChange);
                        provider.removeListener('connect', setPublicKey);
                        provider.removeListener('disconnect', disconnect);
                    }
                };
            }
        }
    }, [disconnect]);

    const value = useMemo(() => ({
        publicKey,
        connected: !!publicKey,
        connecting,
        sending,
        walletAddress: publicKey?.toBase58() ?? null,
        walletName,
        solBalance,
        openConnectModal,
        openDisconnectModal,
        disconnect,
        getBalance,
        refreshBalance,
        signTransaction,
        sendSOL,
        connection,
        protocolInfo: {
            treasury: TREASURY_ADDRESS,
            mint: CC_TOKEN_MINT,
        },
    }), [publicKey, connecting, sending, walletName, solBalance, openConnectModal, openDisconnectModal, disconnect, getBalance, refreshBalance, signTransaction, sendSOL, connection]);

    return (
        <WalletContext.Provider value={value}>
            {children}
            <WalletModal
                visible={connectModalVisible}
                onClose={() => setConnectModalVisible(false)}
                onSelectWallet={handleSelectWallet}
                connecting={connecting}
                connectingWalletId={connectingWalletId}
            />
            <DisconnectModal
                visible={disconnectModalVisible}
                onClose={() => setDisconnectModalVisible(false)}
                walletAddress={publicKey?.toBase58() ?? ''}
                solBalance={solBalance}
                onDisconnect={disconnect}
            />
        </WalletContext.Provider>
    );
};
