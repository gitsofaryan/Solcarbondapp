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
import { verifiedProjects } from '../data/verified-projects';
import { solToUsd } from '../utils/price';

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

    // ── Filter data by current wallet identity ──
    const myCertificates = nftCertificates.filter(c => c.owner === wallet.walletAddress && c.amount > 0);
    const myTransactions = transactions.filter(t => t.owner === wallet.walletAddress);

    // ── Derive CC balance from owned certificates ──
    const totalCC = myCertificates.reduce((sum, cert) => sum + cert.amount, 0);
    const portfolioValueSOL = myCertificates.reduce((sum, cert) => {
        const proj = verifiedProjects.find(p => p.id === cert.projectId);
        return sum + (cert.amount * (proj?.pricePerCC || 0));
    }, 0);
    const retiredCount = myTransactions.filter(t => t.type === 'retire').length;

    const handleRetire = async () => {
        if (!retireTarget || !selectedPurpose) return;
        setRetiring(true);
        try {
            const sig = await retireCredits(
                retireTarget.id,
                wallet.connected ? wallet.walletAddress ?? undefined : undefined,
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
                        <Text style={styles.summaryValue}>{totalCC}</Text>
                        <Text style={styles.summaryLabel}>Total CC</Text>
                    </LinearGradient>

                    <View style={styles.summaryCardDark}>
                        <Ionicons name="trending-up" size={20} color={colors.amber} />
                        <Text style={[styles.summaryValue, { color: colors.amber }]}>
                            ◎ {portfolioValueSOL.toFixed(2)}
                        </Text>
                        <Text style={styles.summaryLabelDark}>Value</Text>
                    </View>

                    <View style={styles.summaryCardDark}>
                        <MaterialCommunityIcons name="certificate" size={20} color={colors.blue} />
                        <Text style={[styles.summaryValue, { color: colors.blue }]}>
                            {myCertificates.length}
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
                {myCertificates.length === 0 ? (
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
                    <View style={styles.list}>
                        {myCertificates.map((nft) => {
                            const proj = Object.values(verifiedProjects).find(p => p.name === nft.projectName);
                            const valUsd = solToUsd(nft.amount * (proj?.pricePerCC || 0));
                            return (
                                <View key={nft.id} style={styles.tokenRow}>
                                    <TouchableOpacity
                                        style={styles.tokenRowTouch}
                                        onPress={() => navigation.navigate('CertificateDetail', { id: nft.id })}
                                        activeOpacity={0.7}
                                    >
                                        <Image source={{ uri: proj?.image || nft.uri }} style={styles.tokenLogo} />
                                        <View style={styles.tokenMid}>
                                            <Text style={styles.tokenTicker}>{proj?.symbol || 'CC'}</Text>
                                            <Text style={styles.tokenName}>{nft.projectName}</Text>
                                        </View>
                                        <View style={styles.tokenRight}>
                                            <Text style={styles.tokenBalance}>{nft.amount} CC</Text>
                                            <Text style={styles.tokenUsd}>${valUsd.toFixed(2)}</Text>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.inlineRetireBtn}
                                        activeOpacity={0.7}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        onPress={() => { setRetireTarget(nft); setSelectedPurpose(null); }}
                                    >
                                        <Ionicons name="flame" size={16} color={colors.red} />
                                        <Text style={styles.retireBtnLabel}>Retire</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
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
                            <View style={[styles.retireHeader, { backgroundColor: colors.redBg, borderWidth: 1, borderColor: colors.red + '30' }]}>
                                <Text style={styles.retireFlame}>🔥</Text>
                                <Text style={styles.retireHeaderTitle}>Retire Carbon Credits</Text>
                                <Text style={styles.retireHeaderSub}>
                                    {'Permanently burn '}{retireTarget?.amount}{' CC from "'}{retireTarget?.projectName}{'" on-chain.\nThis action is irreversible and creates a verifiable offset proof.'}
                                </Text>
                            </View>

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
    list: {
        gap: 0,
    },
    tokenRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tokenRowTouch: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tokenLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, marginRight: 12 },
    tokenMid: { flex: 1, gap: 2 },
    tokenTicker: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    tokenName: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
    tokenRight: { alignItems: 'flex-end', gap: 2, marginRight: 16 },
    tokenBalance: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    tokenUsd: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
    inlineRetireBtn: {
        minWidth: 52,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: colors.redBg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.red + '40',
        zIndex: 10,
        flexDirection: 'row',
        gap: 4,
    },
    retireBtnLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.red,
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
