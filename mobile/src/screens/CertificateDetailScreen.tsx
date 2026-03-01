import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { colors } from '../theme/colors';
import { useBlockchainStore } from '../store/blockchain-store';

const { width } = Dimensions.get('window');

export const CertificateDetailScreen: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { id } = route.params;

    const { nftCertificates, retireCredits } = useBlockchainStore();
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
                        const sig = await retireCredits(cert.id);
                        Alert.alert('✅ Credits Retired', `You have officially offset ${cert.amount} tons of CO2.\n\nSig: ${sig.substring(0, 16)}...`, [
                            { text: 'Done', onPress: () => navigation.goBack() }
                        ]);
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
                <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
                    <Ionicons name="share-outline" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>

                {/* The View to be captured as an image for sharing */}
                <View style={styles.certificateWrapper} ref={viewRef} collapsable={false}>
                    <View style={styles.certCard}>
                        <Image source={{ uri: cert.uri }} style={styles.certImageFull} />

                        <View style={styles.certHeader}>
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="shield-checkmark" size={14} color={colors.green} />
                                <Text style={styles.verifiedText}>Verified On-Chain</Text>
                            </View>
                            <MaterialCommunityIcons name="integrated-circuit-chip" size={24} color={colors.border} />
                        </View>

                        <View style={styles.certBody}>
                            <Text style={styles.certTitle}>Carbon Offset Certificate</Text>
                            <Text style={styles.certProject}>{cert.projectName}</Text>

                            <View style={styles.certStats}>
                                <View style={styles.certStat}>
                                    <Text style={styles.certStatLabel}>Amount</Text>
                                    <Text style={styles.certStatValue}>{cert.amount} CC</Text>
                                </View>
                                <View style={styles.certStat}>
                                    <Text style={styles.certStatLabel}>Network</Text>
                                    <Text style={styles.certStatValue}>Solana</Text>
                                </View>
                                <View style={styles.certStat}>
                                    <Text style={styles.certStatLabel}>Asset ID</Text>
                                    <Text style={styles.certStatValue}>{cert.id.substring(0, 12)}...</Text>
                                </View>
                            </View>

                            {/* Footer of the generated image */}
                            <View style={styles.certFooter}>
                                <Text style={styles.certFooterText}>SolCarbon Eco-dApp</Text>
                                <View style={styles.barcodeLine} />
                            </View>
                        </View>
                    </View>
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
        shadowColor: colors.green,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    certCard: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    certImageFull: {
        width: '100%', height: '40%', opacity: 0.9,
    },
    certHeader: {
        position: 'absolute', top: 16, left: 16, right: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    verifiedBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    verifiedText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    certBody: { flex: 1, padding: 24, justifyContent: 'space-between' },
    certTitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    certProject: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
    certStats: { gap: 12, marginTop: 24 },
    certStat: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8 },
    certStatLabel: { color: colors.textSecondary, fontSize: 13 },
    certStatValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
    certFooter: { alignItems: 'center', marginTop: 20 },
    certFooterText: { color: colors.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
    barcodeLine: { width: '80%', height: 2, backgroundColor: colors.border },

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
