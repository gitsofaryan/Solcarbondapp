import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Platform,
    Linking,
    ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface DetectedWallet {
    id: string;
    name: string;
    icon: string;
    color: string;
    installed: boolean;
    installUrl: string;
}

// Auto-detect installed wallets based on environment
function detectWallets(): DetectedWallet[] {
    const wallets: DetectedWallet[] = [];

    if (Platform.OS === 'web') {
        // ── WEB: Check for browser extensions ──
        const win = window as any;

        wallets.push({
            id: 'phantom',
            name: 'Phantom',
            icon: '👻',
            color: '#AB9FF2',
            installed: !!(win.phantom?.solana?.isPhantom || win.solana?.isPhantom),
            installUrl: 'https://phantom.app/',
        });

        wallets.push({
            id: 'solflare',
            name: 'Solflare',
            icon: '🔥',
            color: '#FC8E2C',
            installed: !!(win.solflare?.isSolflare),
            installUrl: 'https://solflare.com/',
        });

        wallets.push({
            id: 'backpack',
            name: 'Backpack',
            icon: '🎒',
            color: '#E33E3F',
            installed: !!(win.backpack),
            installUrl: 'https://backpack.app/',
        });

        wallets.push({
            id: 'coinbase',
            name: 'Coinbase Wallet',
            icon: '🔵',
            color: '#0052FF',
            installed: !!(win.coinbaseSolana),
            installUrl: 'https://www.coinbase.com/wallet',
        });

        wallets.push({
            id: 'trustwallet',
            name: 'Trust Wallet',
            icon: '🛡️',
            color: '#3375BB',
            installed: !!(win.trustwallet?.solana),
            installUrl: 'https://trustwallet.com/',
        });

    } else {
        // ── MOBILE: Show MWA-compatible wallets ──
        wallets.push({
            id: 'phantom',
            name: 'Phantom',
            icon: '👻',
            color: '#AB9FF2',
            installed: true, // MWA will detect at connect time
            installUrl: 'https://phantom.app/',
        });

        wallets.push({
            id: 'solflare',
            name: 'Solflare',
            icon: '🔥',
            color: '#FC8E2C',
            installed: true,
            installUrl: 'https://solflare.com/',
        });

        wallets.push({
            id: 'ultimate',
            name: 'Ultimate Wallet',
            icon: '⚡',
            color: '#7B61FF',
            installed: true,
            installUrl: 'https://ultimate.app/',
        });
    }

    // Sort: installed first, then alphabetical
    return wallets.sort((a, b) => {
        if (a.installed && !b.installed) return -1;
        if (!a.installed && b.installed) return 1;
        return a.name.localeCompare(b.name);
    });
}

interface WalletModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectWallet: (walletId: string) => void;
    connecting: boolean;
    connectingWalletId: string | null;
}

export const WalletModal: React.FC<WalletModalProps> = ({
    visible,
    onClose,
    onSelectWallet,
    connecting,
    connectingWalletId,
}) => {
    const [wallets, setWallets] = useState<DetectedWallet[]>([]);

    useEffect(() => {
        if (visible) {
            // Re-detect on every open (user may have installed extension)
            setWallets(detectWallets());
        }
    }, [visible]);

    const installedCount = wallets.filter(w => w.installed).length;

    const handlePress = (wallet: DetectedWallet) => {
        if (wallet.installed) {
            onSelectWallet(wallet.id);
        } else {
            // Open install page
            if (Platform.OS === 'web') {
                (window as any).open(wallet.installUrl, '_blank');
            } else {
                Linking.openURL(wallet.installUrl);
            }
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity style={styles.modal} activeOpacity={1}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Connect Wallet</Text>
                            <Text style={styles.subtitle}>
                                {installedCount > 0
                                    ? `${installedCount} wallet${installedCount > 1 ? 's' : ''} detected`
                                    : 'No wallets detected'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {/* Detected Wallets */}
                    {installedCount > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>
                                <Ionicons name="checkmark-circle" size={12} color={colors.green} /> Detected
                            </Text>
                            {wallets.filter(w => w.installed).map((wallet) => (
                                <TouchableOpacity
                                    key={wallet.id}
                                    style={styles.walletRow}
                                    onPress={() => handlePress(wallet)}
                                    activeOpacity={0.7}
                                    disabled={connecting}
                                >
                                    <View style={[styles.walletIcon, { backgroundColor: wallet.color + '18' }]}>
                                        <Text style={styles.walletEmoji}>{wallet.icon}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.walletName}>{wallet.name}</Text>
                                        <Text style={styles.walletType}>
                                            {Platform.OS === 'web' ? 'Browser Extension' : 'Mobile App'}
                                        </Text>
                                    </View>
                                    {connecting && connectingWalletId === wallet.id ? (
                                        <ActivityIndicator size="small" color={wallet.color} />
                                    ) : (
                                        <View style={[styles.connectBadge, { borderColor: wallet.color + '50', backgroundColor: wallet.color + '12' }]}>
                                            <Text style={[styles.connectBadgeText, { color: wallet.color }]}>Connect</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Not Installed */}
                    {wallets.filter(w => !w.installed).length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>
                                <Ionicons name="download-outline" size={12} color={colors.textMuted} /> More Wallets
                            </Text>
                            {wallets.filter(w => !w.installed).map((wallet) => (
                                <TouchableOpacity
                                    key={wallet.id}
                                    style={[styles.walletRow, { opacity: 0.65 }]}
                                    onPress={() => handlePress(wallet)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.walletIcon, { backgroundColor: wallet.color + '10' }]}>
                                        <Text style={styles.walletEmoji}>{wallet.icon}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.walletName}>{wallet.name}</Text>
                                        <Text style={styles.walletType}>Not installed</Text>
                                    </View>
                                    <View style={[styles.installBadge]}>
                                        <Ionicons name="download-outline" size={12} color={colors.textMuted} />
                                        <Text style={styles.installText}>Install</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Footer */}
                    <View style={styles.footer}>
                        <MaterialCommunityIcons name="shield-check" size={13} color={colors.textMuted} />
                        <Text style={styles.footerText}>
                            SolCarbon never accesses your private keys. All transactions are signed in your wallet.
                        </Text>
                    </View>

                    {/* Network */}
                    <View style={styles.network}>
                        <View style={styles.networkDot} />
                        <Text style={styles.networkText}>Solana Devnet</Text>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modal: { width: '100%', maxWidth: 400, backgroundColor: colors.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3 },
    subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    section: { marginBottom: 16 },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    walletRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 6 },
    walletIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    walletEmoji: { fontSize: 20 },
    walletName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    walletType: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    connectBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
    connectBadgeText: { fontSize: 12, fontWeight: '700' },
    installBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    installText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border, marginBottom: 10 },
    footerText: { flex: 1, fontSize: 10, color: colors.textMuted, lineHeight: 15 },
    network: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
    networkDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9945FF' },
    networkText: { fontSize: 11, color: '#9945FF', fontWeight: '600' },
});
