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
            // Capture the certificate view as an image
            const uri = await captureRef(viewRef, {
                format: 'png',
                quality: 1,
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share my SolCarbon Certificate',
                });
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to share certificate');
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
                        ownerAddress={wallet.publicKey?.toBase58() || ''}
                    />
                </View>

                <Text style={styles.instruction}>
                    This NFT represents your ownership of verified carbon credits. You can hold them, sell them on the marketplace, or permanently retire them.
                </Text>

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
        aspectRatio: 0.75, // Standard certificate ratio
        marginBottom: 24,
        ...Platform.select({
            web: { boxShadow: `0 10px 20px ${colors.green}26` },
            default: {
                shadowColor: colors.green,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
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
});
