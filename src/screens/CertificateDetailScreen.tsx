import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { colors } from '../theme/colors';
import { useBlockchainStore } from '../store/blockchain-store';
import { useWalletContext } from '../providers/WalletProvider';
import { ProtocolInfoModal } from '../components/ProtocolInfoModal';
import { DynamicCertificate } from '../components/DynamicCertificate';

const { width } = Dimensions.get('window');

export const CertificateDetailScreen: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { id } = route.params;

    const { nftCertificates, retireCredits } = useBlockchainStore();
    const wallet = useWalletContext();
    const [protocolVisible, setProtocolVisible] = useState(false);
    const cert = nftCertificates.find(c => c.id === id);

    const viewRef = useRef(null);

    if (!cert) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Certificate not found.</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleShare = async () => {
        try {
            let uri;
            if (Platform.OS === 'web') {
                // Web-specific capture logic using html2canvas
                const html2canvas = require('html2canvas');
                if (viewRef.current) {
                    const canvas = await html2canvas(viewRef.current, {
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: colors.background,
                    });
                    uri = canvas.toDataURL('image/png');
                }
            } else {
                // Capture the certificate view as an image for Native
                uri = await captureRef(viewRef, {
                    format: 'png',
                    quality: 1,
                });
            }

            if (!uri) throw new Error('Failed to capture certificate');

            if (Platform.OS === 'web') {
                // On web, sharing usually isn't available via system dialog for blob URIs
                // We provide a direct download fallback
                const link = document.createElement('a');
                link.download = `SolCarbon_Certificate_${cert.projectName.replace(/\s+/g, '_')}_${cert.id}.png`;
                link.href = uri;
                link.click();
            } else if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share my SolCarbon Certificate',
                });
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to share/save certificate. If you are on Web, ensure third-party cookies are allowed.');
        }
    };

    const handleRetire = () => {
        Alert.alert(
            'Retire Carbon Credits?',
            `This will permanently burn ${cert.amount} CC. This proves you have consumed this carbon offset.\n\nThis action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Burn & Retire',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const sig = await retireCredits(
                                cert.id,
                                wallet.publicKey?.toBase58(),
                                wallet.signTransaction
                            );
                            Alert.alert('✅ Credits Retired', `You have officially offset ${cert.amount} tons of CO2.\n\nSig: ${sig.substring(0, 16)}...`, [
                                { text: 'Done', onPress: () => navigation.goBack() }
                            ]);
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to retire credits');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>NFT Certificate</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => setProtocolVisible(true)} style={styles.headerBtn}>
                        <Ionicons name="code-working" size={22} color={colors.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
                        <Ionicons name="share-outline" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.content}>

                {/* The View to be captured as an image for sharing */}
                <View style={styles.certificateWrapper} ref={viewRef} collapsable={false}>
                    <DynamicCertificate
                        projectName={cert.projectName}
                        amount={cert.amount}
                        date={new Date(cert.mintDate).toLocaleDateString('en-US', { year: '2-digit', month: '2-digit' })}
                        assetId={cert.tokenId}
                        holderAddress={wallet.walletAddress || ''}
                        purchasingFirm={cert.purchasingFirm}
                    />
                </View>

                <Text style={styles.instruction}>
                    This NFT represents your ownership of verified carbon credits. You can hold them, sell them on the marketplace, or permanently retire them.
                </Text>

                <View style={styles.detailsCard}>
                    <Text style={styles.detailsTitle}>ON-CHAIN DETAILS</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>On-Chain Asset / Tx</Text>
                        <TouchableOpacity
                            onPress={() => {
                                const { Linking } = require('react-native');
                                let target = cert.tokenId;
                                if (target.startsWith('spl-')) target = target.split('-')[1];

                                // Base64 fallback (old test data)
                                if (target.endsWith('==')) {
                                    Alert.alert('Old Test Data', 'This certificate is from an older test run.');
                                    return;
                                }

                                // If length roughly matches signature length (88), it's a tx.
                                // If it matches pubkey length (44), it's an address.
                                const path = target.length > 70 ? 'tx' : 'address';
                                Linking.openURL(`https://explorer.solana.com/${path}/${target}?cluster=devnet`);
                            }}
                        >
                            <Text style={styles.signatureText} numberOfLines={2}>{cert.tokenId}</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.explorerLink}
                        onPress={() => {
                            const { Linking } = require('react-native');
                            Linking.openURL(`https://explorer.solana.com/address/${wallet.publicKey?.toBase58()}?cluster=devnet`);
                        }}
                    >
                        <Ionicons name="open-outline" size={14} color={colors.blue} />
                        <Text style={styles.explorerLinkText}>View All Minting Activity</Text>
                    </TouchableOpacity>
                </View>

            </View>

            {/* Action Bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.retireBtn} onPress={handleRetire} activeOpacity={0.8}>
                    <LinearGradient colors={['#ef4444', '#b91c1c']} style={styles.retireGradient}>
                        <Ionicons name="flame" size={20} color="#fff" />
                        <Text style={styles.retireBtnText}>Burn & Retire Credits</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
            <ProtocolInfoModal
                visible={protocolVisible}
                onClose={() => setProtocolVisible(false)}
                treasuryAddress={wallet.protocolInfo.treasury}
                mintAddress={wallet.protocolInfo.mint}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: colors.textSecondary, fontSize: 16, marginBottom: 20 },
    backBtn: { padding: 12, backgroundColor: colors.surface, borderRadius: 8 },
    backText: { color: colors.textPrimary, fontWeight: '600' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    headerBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: colors.border,
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },

    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    certificateWrapper: {
        width: '100%',
        aspectRatio: 1.6, // Horizontal Credit Card Ratio
        marginBottom: 24,
        ...Platform.select({
            web: { boxShadow: `0 10px 20px ${colors.green}26` },
            default: {
                boxShadow: `0 10px 20px rgba(16, 185, 129, 0.15)`,
                elevation: 10,
            }
        })
    },
    // Certificate styles moved to DynamicCertificate.tsx

    instruction: {
        color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10,
    },

    bottomBar: {
        padding: 16, paddingBottom: 32, backgroundColor: colors.card,
        borderTopWidth: 1, borderTopColor: colors.border,
    },
    retireBtn: { borderRadius: 16, overflow: 'hidden' },
    retireGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    retireBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    detailsCard: {
        width: '100%',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginTop: 24,
        borderWidth: 1,
        borderColor: colors.border,
    },
    detailsTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.textMuted,
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    detailRow: {
        backgroundColor: colors.surface,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 4,
    },
    signatureText: {
        fontSize: 11,
        color: colors.blue,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    explorerLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 16,
        paddingVertical: 8,
    },
    explorerLinkText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.blue,
    },
});
