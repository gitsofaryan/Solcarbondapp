import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useBlockchainStore, CarbonProject } from '../store/blockchain-store';
import { verifiedProjects } from '../data/verified-projects';
import { solToUsd } from '../utils/price';
import { useWalletContext } from '../providers/WalletProvider';

const { width } = Dimensions.get('window');
const CHART_W = width - 32;
const CHART_H = 180;

// ── Price Chart ──
const PriceChart: React.FC<{ data: number[]; positive: boolean }> = ({ data, positive }) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 0.001;

    const color = positive ? colors.green : '#EF4444';
    const bgColor = positive ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)';

    return (
        <View style={styles.chartContainer}>
            <LinearGradient
                colors={[bgColor, 'transparent']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
            />
            {/* Y-axis labels */}
            <View style={styles.yAxis}>
                <Text style={styles.yLabel}>◎ {max.toFixed(3)}</Text>
                <Text style={styles.yLabel}>◎ {((max + min) / 2).toFixed(3)}</Text>
                <Text style={styles.yLabel}>◎ {min.toFixed(3)}</Text>
            </View>
            {/* Chart bars */}
            <View style={styles.chartBars}>
                {data.map((v, i) => {
                    const pct = ((v - min) / range);
                    const barH = Math.max(8, pct * (CHART_H - 50));
                    const isLast = i === data.length - 1;
                    return (
                        <View key={i} style={styles.barWrapper}>
                            <View
                                style={[
                                    styles.bar,
                                    {
                                        height: barH,
                                        backgroundColor: isLast ? color : color + '30',
                                        borderColor: isLast ? color : 'transparent',
                                        borderWidth: isLast ? 2 : 0,
                                        borderTopLeftRadius: 4,
                                        borderTopRightRadius: 4,
                                    },
                                ]}
                            />
                            {isLast && (
                                <View style={[styles.barDot, { backgroundColor: color, ...Platform.select({ ios: { shadowColor: color, shadowOpacity: 0.5, shadowRadius: 5 }, web: { boxShadow: `0 0 10px ${color}` }, default: { elevation: 5 } }) }]} />
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

// ── Time Range Selector ──
const timeRanges = ['1D', '1W', '1M', '3M', 'ALL'] as const;

interface ProjectDetailScreenProps {
    projectId: string;
    prefilledAmount?: number;
    onBack: () => void;
}

export const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({ projectId, prefilledAmount, onBack }) => {
    const navigation = useNavigation<any>();
    const { buyCredits, sellCredits, nftCertificates, isLoading } = useBlockchainStore();
    const wallet = useWalletContext();

    // ── Derive CC balance from owned certificates ──
    const myCertificates = nftCertificates.filter(c => c.owner === wallet.walletAddress);
    const myTotalCC = myCertificates.reduce((sum, cert) => sum + cert.amount, 0);

    const [buyAmount, setBuyAmount] = useState(prefilledAmount ?? 10);
    const [activeRange, setActiveRange] = useState<typeof timeRanges[number]>('1W');
    const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

    const project = useMemo(
        () => verifiedProjects.find(p => p.id === projectId) || verifiedProjects[0],
        [projectId],
    );

    // Generate chart data based on range (simulated from sparkline)
    const chartData = useMemo(() => {
        const base = project.sparkline;
        if (activeRange === '1D') return base.slice(-3);
        if (activeRange === '1W') return base;
        if (activeRange === '1M') return [...base, ...base.map((v: number) => v * (1 + Math.random() * 0.05))];
        if (activeRange === '3M') return [...base, ...base, ...base.map((v: number) => v * (1 + Math.random() * 0.08))];
        return [...base, ...base, ...base, ...base.map((v: number) => v * (1 + Math.random() * 0.1))];
    }, [project.sparkline, activeRange]);

    const totalCostSOL = buyAmount * project.pricePerCC;

    const handleBuy = async () => {
        if (!wallet.connected) {
            wallet.openConnectModal();
            return;
        }

        try {
            const result = await buyCredits(
                buyAmount,
                project.pricePerCC,
                project.name,
                project.id,
                project.image,
                wallet.publicKey?.toBase58(),
                wallet.signTransaction
            );

            // Navigate to the new Confirmation screen
            navigation.navigate('Confirmation', {
                amount: buyAmount,
                projectName: project.name,
                totalCostSOL: totalCostSOL,
                assetId: result?.assetId || 'PENDING MINT',
                signature: result?.signature || '',
                purchasingFirm: 'Individual Collector'
            });

            setBuyAmount(10);
            wallet.refreshBalance();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Purchase failed');
        }
    };

    const handleSell = async () => {
        if (!wallet.connected) {
            wallet.openConnectModal();
            return;
        }
        if (buyAmount > myTotalCC) {
            Alert.alert('Insufficient Credits', `You only have ${myTotalCC} CC in your certificates.`);
            return;
        }
        try {
            const sig = await sellCredits(
                buyAmount,
                project.pricePerCC,
                wallet.publicKey?.toBase58(),
                wallet.signTransaction
            );
            Alert.alert(
                '✅ Credits Sold!',
                `Sold ${buyAmount} CC at ◎ ${project.pricePerCC}/CC\n\nSig: ${sig.substring(0, 24)}...`,
            );
            setBuyAmount(10);
            wallet.refreshBalance();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Sale failed');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{project.name}</Text>
                    <Text style={styles.headerSub}>{project.type} · {project.location}</Text>
                </View>
                {project.verified && (
                    <View style={styles.verifiedBadge}>
                        <Ionicons name="shield-checkmark" size={14} color={colors.green} />
                        <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Price */}
                <View style={styles.priceSection}>
                    <View style={styles.priceRow}>
                        <Text style={styles.bigPrice}>◎ {project.pricePerCC.toFixed(3)}</Text>
                        <Text style={styles.bigUsd}>≈ ${solToUsd(project.pricePerCC).toFixed(2)}</Text>
                    </View>
                    <View
                        style={[
                            styles.changePill,
                            { backgroundColor: project.change24h >= 0 ? colors.greenBg : 'rgba(239,68,68,0.12)' },
                        ]}
                    >
                        <Ionicons
                            name={project.change24h >= 0 ? 'caret-up' : 'caret-down'}
                            size={12}
                            color={project.change24h >= 0 ? colors.green : '#EF4444'}
                        />
                        <Text style={{ color: project.change24h >= 0 ? colors.green : '#EF4444', fontWeight: '800', fontSize: 14 }}>
                            {project.change24h >= 0 ? '+' : ''}{project.change24h.toFixed(1)}%
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>24h</Text>
                    </View>
                </View>

                {/* Price Chart */}
                <PriceChart data={chartData} positive={project.change24h >= 0} />

                {/* Time Range Selector */}
                <View style={styles.rangeRow}>
                    {timeRanges.map((r) => (
                        <TouchableOpacity
                            key={r}
                            style={[styles.rangeBtn, activeRange === r && styles.rangeBtnActive]}
                            onPress={() => setActiveRange(r)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.rangeText, activeRange === r && styles.rangeTextActive]}>{r}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Market Cap</Text>
                        <Text style={styles.statValue}>◎ {project.marketCap.toFixed(0)}</Text>
                        <Text style={styles.statUsd}>≈ ${solToUsd(project.marketCap).toFixed(0)}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>24h Volume</Text>
                        <Text style={styles.statValue}>◎ {project.volume24h.toFixed(0)}</Text>
                        <Text style={styles.statUsd}>≈ ${solToUsd(project.volume24h).toFixed(0)}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>7d Change</Text>
                        <Text style={[styles.statValue, { color: project.change7d >= 0 ? colors.green : '#EF4444' }]}>
                            {project.change7d >= 0 ? '+' : ''}{project.change7d.toFixed(1)}%
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Available</Text>
                        <Text style={styles.statValue}>{(project.availableCC / 1000).toFixed(1)}K CC</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Supply</Text>
                        <Text style={styles.statValue}>{(project.totalSupply / 1000).toFixed(1)}K CC</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Rating</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <Ionicons name="star" size={13} color={colors.amber} />
                            <Text style={styles.statValue}>{project.rating}</Text>
                        </View>
                    </View>
                </View>

                {/* About */}
                <View style={styles.aboutCard}>
                    <Text style={styles.aboutTitle}>About</Text>
                    <Text style={styles.aboutText}>{project.description}</Text>
                    <View style={styles.aboutMeta}>
                        <View style={styles.metaItem}>
                            <Ionicons name="location" size={14} color={colors.textMuted} />
                            <Text style={styles.metaText}>{project.location}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <MaterialCommunityIcons name="leaf" size={14} color={colors.green} />
                            <Text style={styles.metaText}>{project.type}</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Trade Panel */}
            <View style={styles.tradePanel}>
                {/* Buy/Sell toggle */}
                <View style={styles.toggleRow}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, activeTab === 'buy' && styles.toggleBuyActive]}
                        onPress={() => setActiveTab('buy')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.toggleText, activeTab === 'buy' && styles.toggleBuyText]}>Buy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, activeTab === 'sell' && styles.toggleSellActive]}
                        onPress={() => setActiveTab('sell')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.toggleText, activeTab === 'sell' && styles.toggleSellText]}>Sell</Text>
                    </TouchableOpacity>
                </View>

                {/* Amount selector */}
                <View style={[styles.amountRow, { flexWrap: 'wrap' }]}>
                    {[1, 2, 10, 50, 100, 500].map((amt) => (
                        <TouchableOpacity
                            key={amt}
                            style={[
                                styles.amountBtn,
                                buyAmount === amt && (activeTab === 'buy' ? styles.amountBuyActive : styles.amountSellActive),
                                { width: (width - 48) / 3 - 4, marginBottom: 6 }
                            ]}
                            onPress={() => setBuyAmount(amt)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.amountText, buyAmount === amt && { color: activeTab === 'buy' ? colors.green : '#EF4444' }]}>
                                {amt === 500 ? '500 (Max)' : amt}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Total + Action */}
                <View style={styles.totalRow}>
                    <View>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>◎ {totalCostSOL.toFixed(4)} SOL</Text>
                        <Text style={styles.totalUsd}>≈ ${solToUsd(totalCostSOL).toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            activeTab === 'buy' ? styles.buyBtn : styles.sellBtn,
                            isLoading && styles.disabledBtn,
                        ]}
                        onPress={activeTab === 'buy' ? handleBuy : handleSell}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#000" size="small" />
                        ) : (
                            <>
                                <Ionicons name={activeTab === 'buy' ? 'flash' : 'pricetag'} size={16} color="#000" />
                                <Text style={styles.actionText}>
                                    {activeTab === 'buy' ? 'Buy' : 'Sell'} {buyAmount} CC
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: colors.border,
    },
    headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
    headerSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    verifiedBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
        backgroundColor: colors.greenBg, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)',
    },
    verifiedText: { fontSize: 10, fontWeight: '700', color: colors.green },
    priceSection: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
    },
    priceRow: {},
    bigPrice: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
    bigUsd: { fontSize: 14, fontWeight: '600', color: colors.textMuted, marginTop: 2 },
    changePill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    },
    chartContainer: {
        marginHorizontal: 16, borderRadius: 16, padding: 12,
        height: CHART_H, flexDirection: 'row',
        borderWidth: 1, borderColor: colors.border,
    },
    yAxis: { justifyContent: 'space-between', marginRight: 8, width: 58 },
    yLabel: { fontSize: 9, color: colors.textMuted, fontWeight: '600' },
    chartBars: {
        flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 3,
    },
    barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    bar: { width: '100%', borderRadius: 4 },
    barDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
    rangeRow: {
        flexDirection: 'row', gap: 6, paddingHorizontal: 16, marginTop: 12, marginBottom: 16,
    },
    rangeBtn: {
        flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    rangeBtnActive: { backgroundColor: colors.greenBg, borderColor: 'rgba(16,185,129,0.3)' },
    rangeText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
    rangeTextActive: { color: colors.green },
    statsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 16,
    },
    statBox: {
        width: (width - 48) / 3, backgroundColor: colors.card,
        borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border,
    },
    statLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 },
    statValue: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
    statUsd: { fontSize: 10, fontWeight: '600', color: colors.textMuted, marginTop: 2 },
    aboutCard: {
        marginHorizontal: 16, backgroundColor: colors.card,
        borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border,
    },
    aboutTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
    aboutText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
    aboutMeta: { flexDirection: 'row', gap: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },

    // Trade Panel
    tradePanel: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 16, paddingBottom: 24,
        borderTopWidth: 1, borderTopColor: colors.border,
        ...Platform.select({
            web: { boxShadow: '0 -4px 12px rgba(0,0,0,0.3)' },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 10,
            }
        })
    },
    toggleRow: {
        flexDirection: 'row', gap: 6, marginBottom: 10,
        backgroundColor: colors.surface, borderRadius: 12, padding: 3,
    },
    toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
    toggleText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
    toggleBuyActive: { backgroundColor: colors.greenBg },
    toggleBuyText: { color: colors.green },
    toggleSellActive: { backgroundColor: 'rgba(239,68,68,0.12)' },
    toggleSellText: { color: '#EF4444' },
    amountRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
    amountBtn: {
        flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    amountBuyActive: { backgroundColor: colors.greenBg, borderColor: 'rgba(16,185,129,0.3)' },
    amountSellActive: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' },
    amountText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
    totalValue: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
    totalUsd: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginTop: 1 },
    actionButton: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14,
    },
    buyBtn: { backgroundColor: colors.green },
    sellBtn: { backgroundColor: '#EF4444' },
    disabledBtn: { opacity: 0.5 },
    actionText: { color: '#000', fontSize: 15, fontWeight: '800' },
});
