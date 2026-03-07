import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { mockProjects } from '../data/mock-projects';
import { solToUsd } from '../utils/price';
import { useWalletContext } from '../providers/WalletProvider';
import { ProtocolInfoModal } from '../components/ProtocolInfoModal';

const { width } = Dimensions.get('window');

// Mini sparkline component
const Sparkline: React.FC<{ data: number[]; positive: boolean; width?: number; height?: number }> = ({
    data, positive, width: w = 60, height: h = 24,
}) => {
    if (!data.length) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    return (
        <View style={{ width: w, height: h }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: h, gap: 2 }}>
                {data.map((v, i) => {
                    const barH = Math.max(3, ((v - min) / range) * h);
                    return (
                        <View
                            key={i}
                            style={{
                                flex: 1,
                                height: barH,
                                backgroundColor: positive ? colors.green + '60' : '#EF444460',
                                borderRadius: 2,
                            }}
                        />
                    );
                })}
            </View>
        </View>
    );
};

export const MarketplaceScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const wallet = useWalletContext();
    const [sortBy, setSortBy] = useState<'price' | 'change' | 'volume'>('change');
    const [protocolVisible, setProtocolVisible] = useState(false);

    const sortedProjects = [...mockProjects].sort((a, b) => {
        if (sortBy === 'price') return b.pricePerCC - a.pricePerCC;
        if (sortBy === 'change') return b.change24h - a.change24h;
        return b.volume24h - a.volume24h;
    });

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Title Row */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.title}>Carbon Markets</Text>
                        <Text style={styles.subtitle}>{mockProjects.length} verified projects</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.protocolBtn}
                        onPress={() => setProtocolVisible(true)}
                    >
                        <Ionicons name="code-working" size={18} color={colors.blue} />
                        <Text style={styles.protocolText}>Protocol</Text>
                    </TouchableOpacity>
                </View>

                {/* Sort Tabs */}
                <View style={styles.sortRow}>
                    {(['change', 'price', 'volume'] as const).map((key) => (
                        <TouchableOpacity
                            key={key}
                            style={[styles.sortTab, sortBy === key && styles.sortTabActive]}
                            onPress={() => setSortBy(key)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.sortText, sortBy === key && styles.sortTextActive]}>
                                {key === 'change' ? '🔥 Trending' : key === 'price' ? '💰 Price' : '📊 Volume'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Column Headers */}
                <View style={styles.listHeader}>
                    <Text style={styles.colName}>Project</Text>
                    <Text style={styles.colRight}>Price</Text>
                    <Text style={styles.colRight}>24h</Text>
                </View>

                {/* Project List — Stock Ticker Style */}
                {sortedProjects.map((project) => (
                    <TouchableOpacity
                        key={project.id}
                        style={styles.tickerRow}
                        onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
                        activeOpacity={0.7}
                    >
                        <Image source={{ uri: project.image }} style={styles.tickerImage} />
                        <View style={styles.tickerInfo}>
                            <Text style={styles.tickerName} numberOfLines={1}>{project.name}</Text>
                            <View style={styles.tickerMeta}>
                                <View style={styles.typeBadge}>
                                    <Text style={styles.typeText}>{project.type}</Text>
                                </View>
                                <Text style={styles.tickerSupply}>
                                    {(project.availableCC / 1000).toFixed(1)}K avail
                                </Text>
                            </View>
                        </View>
                        <View style={styles.tickerRight}>
                            <Text style={styles.tickerPrice}>◎ {project.pricePerCC.toFixed(3)}</Text>
                            <Text style={styles.tickerUsd}>≈ ${solToUsd(project.pricePerCC).toFixed(2)}</Text>
                            <Sparkline data={project.sparkline} positive={project.change24h >= 0} />
                        </View>
                        <View
                            style={[
                                styles.changeBadge,
                                { backgroundColor: project.change24h >= 0 ? colors.greenBg : 'rgba(239,68,68,0.15)' },
                            ]}
                        >
                            <Ionicons
                                name={project.change24h >= 0 ? 'caret-up' : 'caret-down'}
                                size={10}
                                color={project.change24h >= 0 ? colors.green : '#EF4444'}
                            />
                            <Text
                                style={[
                                    styles.changeText,
                                    { color: project.change24h >= 0 ? colors.green : '#EF4444' },
                                ]}
                            >
                                {Math.abs(project.change24h).toFixed(1)}%
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={{ height: 100 }} />
            </ScrollView>

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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, paddingLeft: 16, letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2, paddingLeft: 16 },
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
    },
    protocolText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.blue,
    },
    sortRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
    sortTab: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    sortTabActive: { backgroundColor: colors.greenBg, borderColor: 'rgba(16, 185, 129, 0.3)' },
    sortText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
    sortTextActive: { color: colors.green },
    listHeader: {
        flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    colName: { flex: 1, fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    colRight: { width: 70, fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' },
    tickerRow: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10,
    },
    tickerImage: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface },
    tickerInfo: { flex: 1 },
    tickerName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 3 },
    tickerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    typeBadge: {
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    typeText: { fontSize: 9, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
    tickerSupply: { fontSize: 10, color: colors.textMuted },
    tickerRight: { alignItems: 'flex-end', gap: 2 },
    tickerPrice: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
    tickerUsd: { fontSize: 10, fontWeight: '600', color: colors.textMuted },
    changeBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, minWidth: 60, justifyContent: 'center',
    },
    changeText: { fontSize: 12, fontWeight: '800' },
});
