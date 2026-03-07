import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Modal,
    Alert,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { useBlockchainStore, NFTCertificate } from '../store/blockchain-store';
import { useWalletContext } from '../providers/WalletProvider';
import { ProtocolInfoModal } from '../components/ProtocolInfoModal';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48 - 12) / 2;

const RETIRE_PURPOSES = [
    { id: 'esg', label: 'ESG / BRSR Compliance', icon: 'shield-checkmark', color: colors.blue },
    { id: 'personal', label: 'Personal Carbon Neutral', icon: 'leaf', color: colors.green },
    { id: 'supply', label: 'Supply Chain Offset', icon: 'git-network', color: '#a78bfa' },
    { id: 'gift', label: 'Climate Gift', icon: 'gift', color: colors.amber },
];

export const PortfolioScreen: React.FC = () => {
    const { carbonCredits, nftCertificates, transactions, retireCredits, isLoading } = useBlockchainStore();
    const wallet = useWalletContext();
    const navigation = useNavigation<any>();
    const [protocolVisible, setProtocolVisible] = useState(false);
    const [retireTarget, setRetireTarget] = useState<NFTCertificate | null>(null);
    const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
    const [retiring, setRetiring] = useState(false);
    const retiredCount = transactions.filter(t => t.type === 'retire').length;

    const handleRetire = async () => {
        if (!retireTarget || !selectedPurpose) return;
        setRetiring(true);
        try {
            const sig = await retireCredits(
                retireTarget.id,
                wallet.connected ? wallet.publicKey ?? undefined : undefined,
                wallet.connected ? wallet.signTransaction : undefined,
            );
            setRetireTarget(null);
            setSelectedPurpose(null);
            Alert.alert(
                '🔥 Credits Retired',
                `${retireTarget.amount} CC from "${retireTarget.projectName}" permanently burned on-chain.\n\nSig: ${sig.slice(0, 12)}...`,
            );
        } catch (e: any) {
            Alert.alert('Retirement Failed', e.message);
        } finally {
            setRetiring(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.title}>Your Portfolio</Text>
                        <Text style={styles.subtitle}>NFT Carbon certificates</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.protocolBtn}
                        onPress={() => setProtocolVisible(true)}
                    >
                        <Ionicons name="code-working" size={18} color={colors.blue} />
                        <Text style={styles.protocolText}>Protocol</Text>
                    </TouchableOpacity>
                </View>
                {/* Summary */}
                <View style={styles.summaryRow}>
                    <LinearGradient
                        colors={[...colors.gradientGreen]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.summaryCard}
                    >
                        <Ionicons name="leaf" size={20} color="#000" />
                        <Text style={styles.summaryValue}>{carbonCredits}</Text>
                        <Text style={styles.summaryLabel}>Total CC</Text>
                    </LinearGradient>

                    <View style={styles.summaryCardDark}>
                        <Ionicons name="trending-up" size={20} color={colors.amber} />
                        <Text style={[styles.summaryValue, { color: colors.amber }]}>
                            ◎ {(carbonCredits * 0.1).toFixed(2)}
                        </Text>
                        <Text style={styles.summaryLabelDark}>Value</Text>
                    </View>

                    <View style={styles.summaryCardDark}>
                        <MaterialCommunityIcons name="certificate" size={20} color={colors.blue} />
                        <Text style={[styles.summaryValue, { color: colors.blue }]}>
                            {nftCertificates.length}
                        </Text>
                        <Text style={styles.summaryLabelDark}>NFTs</Text>
                    </View>

                    <View style={styles.summaryCardDark}>
                        <MaterialCommunityIcons name="fire" size={20} color={colors.red} />
                        <Text style={[styles.summaryValue, { color: colors.red }]}>
                            {retiredCount}
                        </Text>
                        <Text style={styles.summaryLabelDark}>Retired</Text>
                    </View>
                </View>

                {/* Certificates Grid */}
                {nftCertificates.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons
                            name="certificate-outline"
                            size={56}
                            color={colors.textMuted}
                        />
                        <Text style={styles.emptyTitle}>No certificates yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Purchase carbon credits to receive NFT certificates
                        </Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {nftCertificates.map((nft) => (
                            <View key={nft.id} style={styles.nftCardWrap}>
                                <TouchableOpacity
                                    style={styles.nftCard}
                                    onPress={() => navigation.navigate('CertificateDetail', { id: nft.id })}
                                    activeOpacity={0.85}
                                >
                                    <Image source={{ uri: nft.uri }} style={styles.nftImage} />
                                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.nftGradient} />
                                    <View style={styles.nftBadge}>
                                        <Ionicons name="shield-checkmark" size={10} color={colors.green} />
                                        <Text style={styles.nftBadgeText}>NFT</Text>
                                    </View>
                                    <View style={styles.nftContent}>
                                        <Text style={styles.nftTitle} numberOfLines={1}>{nft.projectName}</Text>
                                        <Text style={styles.nftAmount}>{nft.amount} CC</Text>
                                    </View>
                                </TouchableOpacity>
                                {/* Retire Button */}
                                <TouchableOpacity
                                    style={styles.retireBtn}
                                    activeOpacity={0.85}
                                    onPress={() => { setRetireTarget(nft); setSelectedPurpose(null); }}
                                >
                                    <Ionicons name="flame" size={13} color={colors.red} />
                                    <Text style={styles.retireBtnText}>Retire</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            <ProtocolInfoModal
                visible={protocolVisible}
                onClose={() => setProtocolVisible(false)}
                treasuryAddress={wallet.protocolInfo.treasury}
                mintAddress={wallet.protocolInfo.mint}
            />

            {/* ── Retire Modal ─────────────────────────────────────────── */}
            <Modal visible={!!retireTarget} transparent animationType="slide" onRequestClose={() => setRetireTarget(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <ScrollView contentContainerStyle={styles.modalContent}>
                            {/* Flame Header */}
                            <LinearGradient colors={['#3b0a0a', '#1a0404']} style={styles.retireHeader}>
                                <Text style={styles.retireFlame}>🔥</Text>
                                <Text style={styles.retireHeaderTitle}>Retire Carbon Credits</Text>
                                <Text style={styles.retireHeaderSub}>
                                    {'Permanently burn '}{retireTarget?.amount}{' CC from "'}{retireTarget?.projectName}{'" on-chain.\nThis action is irreversible and creates a verifiable offset proof.'}
                                </Text>
                            </LinearGradient>

                            {/* Purpose Selection */}
                            <Text style={styles.purposeLabel}>Why are you retiring?</Text>
                            {RETIRE_PURPOSES.map(p => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[styles.purposeOption, selectedPurpose === p.id && { borderColor: p.color, backgroundColor: p.color + '10' }]}
                                    onPress={() => setSelectedPurpose(p.id)}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons name={p.icon as any} size={20} color={selectedPurpose === p.id ? p.color : colors.textMuted} />
                                    <Text style={[styles.purposeText, selectedPurpose === p.id && { color: p.color }]}>{p.label}</Text>
                                    {selectedPurpose === p.id && <Ionicons name="checkmark-circle" size={18} color={p.color} />}
                                </TouchableOpacity>
                            ))}

                            {/* Warning */}
                            <View style={styles.retireWarning}>
                                <Ionicons name="warning" size={16} color={colors.amber} />
                                <Text style={styles.retireWarningText}>Once retired, these credits cannot be sold or transferred. A retirement certificate will be recorded in your transaction history.</Text>
                            </View>

                            {/* Confirm */}
                            <TouchableOpacity
                                style={[styles.retireConfirmBtn, (!selectedPurpose || retiring) && styles.nextBtnDisabled]}
                                disabled={!selectedPurpose || retiring}
                                onPress={handleRetire}
                                activeOpacity={0.85}
                            >
                                {retiring
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <><Ionicons name="flame" size={18} color="#fff" /><Text style={styles.retireConfirmText}>Confirm Retirement</Text></>
                                }
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setRetireTarget(null)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
        paddingHorizontal: 16,
        paddingTop: 16,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        paddingHorizontal: 16,
        marginTop: 4,
        marginBottom: 16,
    },
    protocolBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: colors.blueBg,
        borderWidth: 1,
        borderColor: colors.blue + '30',
        marginTop: 10,
    },
    protocolText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.blue,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    summaryCard: {
        flex: 1,
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        gap: 4,
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#000',
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.6)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryCardDark: {
        flex: 1,
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 4,
    },
    summaryLabelDark: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    emptySubtitle: {
        fontSize: 13,
        color: colors.textMuted,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingHorizontal: 16,
    },
    nftCardWrap: {
        width: CARD_SIZE,
        gap: 6,
    },
    nftCard: {
        width: '100%',
        height: CARD_SIZE * 1.2,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    retireBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 7,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.red + '40',
        backgroundColor: colors.redBg,
    },
    retireBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.red,
    },
    nftImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    nftGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
    },
    nftBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    nftBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: colors.green,
    },
    nftContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 10,
    },
    nftTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    nftAmount: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.green,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.borderLight,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
    },
    modalImage: {
        width: '100%',
        height: 180,
        marginTop: 16,
    },
    modalContent: {
        padding: 24,
        paddingBottom: 40,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    modalSubtitle: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 2,
    },
    modalClose: {
        padding: 4,
    },
    detailGrid: {
        gap: 12,
        marginBottom: 20,
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    detailLabel: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 13,
        color: colors.textPrimary,
        fontWeight: '700',
        maxWidth: '60%',
    },
    explorerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.blue,
        backgroundColor: colors.blueBg,
    },
    explorerBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.blue,
    },

    // ── Retire Modal Styles ──────────────────────────────────────────────────
    retireHeader: { borderRadius: 16, padding: 20, alignItems: 'center', gap: 6, marginBottom: 20 },
    retireFlame: { fontSize: 40, marginBottom: 4 },
    retireHeaderTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
    retireHeaderSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
    purposeLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
    purposeOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    purposeText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    retireWarning: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.amber + '30', marginVertical: 14 },
    retireWarningText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
    retireConfirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.red, borderRadius: 14, paddingVertical: 14, marginBottom: 10 },
    retireConfirmText: { fontSize: 15, fontWeight: '800', color: '#fff' },
    cancelBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    cancelBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
    nextBtnDisabled: { opacity: 0.4 },
});
