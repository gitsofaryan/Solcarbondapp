import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useBlockchainStore } from '../store/blockchain-store';
import { useWalletContext } from '../providers/WalletProvider';

export const Header: React.FC = () => {
    const { nftCertificates } = useBlockchainStore();
    const insets = useSafeAreaInsets();
    const wallet = useWalletContext();

    // ── Derive CC balance from owned certificates ──
    const myCertificates = nftCertificates.filter(c => c.owner === wallet.walletAddress);
    const myCCBalance = myCertificates.reduce((sum, cert) => sum + cert.amount, 0);

    return (
        <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
            {/* Top Row: Logo + Wallet */}
            <View style={styles.topRow}>
                <View style={styles.leftSection}>
                    <View style={styles.logoBg}>
                        <Image
                            source={require('../../assets/solcarbon-logo.png')}
                            style={styles.headerLogo}
                        />
                    </View>
                    <View>
                        <Text style={styles.appName}>SolCarbon</Text>
                        <Text style={styles.networkLabel}>Devnet</Text>
                    </View>
                </View>

                {wallet.connected ? (
                    <TouchableOpacity
                        style={styles.connectedBtn}
                        onPress={wallet.openDisconnectModal}
                        activeOpacity={0.8}
                    >
                        <View style={styles.connectedDot} />
                        <Text style={styles.connectedText}>
                            {wallet.walletAddress!.slice(0, 4)}..{wallet.walletAddress!.slice(-4)}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.connectBtn}
                        onPress={wallet.openConnectModal}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="wallet-outline" size={14} color="#fff" />
                        <Text style={styles.connectText}>Connect</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Bottom Row: Balance pills */}
            <View style={styles.pills}>
                {wallet.connected && wallet.solBalance !== null && (
                    <View style={[styles.pill, styles.solPill]}>
                        <Text style={[styles.pillLabel, { color: '#9945FF' }]}>◎</Text>
                        <Text style={styles.pillValue}>
                            {wallet.solBalance.toFixed(4)} SOL
                        </Text>
                    </View>
                )}
                <View style={[styles.pill, styles.ccPill]}>
                    <Ionicons name="leaf" size={11} color={colors.green} />
                    <Text style={styles.pillValue}>{myCCBalance} CC</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 10,
        backgroundColor: colors.background,
        gap: 10,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    headerLogo: {
        width: '100%',
        height: '100%',
    },
    appName: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.3,
    },
    networkLabel: {
        fontSize: 10,
        color: '#9945FF',
        fontWeight: '600',
    },
    connectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 14,
        backgroundColor: '#9945FF',
    },
    connectText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    connectedBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 16,
        backgroundColor: colors.card,
    },
    connectedDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.green,
    },
    connectedText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textPrimary,
        fontFamily: 'monospace',
    },
    pills: {
        flexDirection: 'row',
        gap: 6,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: colors.card,
    },
    solPill: {},
    ccPill: {},
    pillLabel: {
        fontSize: 12,
        fontWeight: '800',
    },
    pillValue: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textPrimary,
    },
});
