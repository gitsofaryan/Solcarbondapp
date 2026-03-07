import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { useBlockchainStore } from '../store/blockchain-store';
import { useWalletContext } from '../providers/WalletProvider';
import { verifiedProjects } from '../data/verified-projects';
import { solToUsd } from '../utils/price';

const { width } = Dimensions.get('window');

export const DashboardScreen: React.FC = () => {
    const { nftCertificates, transactions } = useBlockchainStore();
    const wallet = useWalletContext();
    const navigation = useNavigation<any>();

    const myCertificates = nftCertificates.filter(c => c.owner === wallet.walletAddress && c.amount > 0);
    const myCCBalance = myCertificates.reduce((sum, cert) => sum + cert.amount, 0);

    const avgPrice = verifiedProjects.reduce((s, p) => s + p.pricePerCC, 0) / verifiedProjects.length;
    const portfolioValueSOL = myCCBalance * avgPrice;
    const totalSupply = verifiedProjects.reduce((s, p) => s + p.availableCC, 0);

    const sorted = [...verifiedProjects].sort((a, b) => b.change24h - a.change24h);
    const topGainers = sorted.slice(0, 3);
    const recentTxs = transactions.slice(0, 3);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Portfolio Card */}
            <LinearGradient
                colors={['#0d2818', '#0a0f0a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.portfolioCard}
            >
                <Text style={styles.portfolioLabel}>Portfolio Value</Text>
                <Text style={styles.portfolioValue}>
                    ◎ {portfolioValueSOL.toFixed(4)} SOL
                </Text>
                <Text style={styles.portfolioUsd}>≈ ${solToUsd(portfolioValueSOL).toFixed(2)} USD</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statPill}>
                        <Ionicons name="leaf" size={12} color={colors.green} />
                        <Text style={styles.statPillText}>{myCCBalance} CC</Text>
                    </View>
                    <View style={styles.statPill}>
                        <MaterialCommunityIcons name="certificate" size={12} color={colors.blue} />
                        <Text style={styles.statPillText}>{myCertificates.length} NFTs</Text>
                    </View>
                    {wallet.connected && wallet.solBalance !== null && (
                        <View style={styles.statPill}>
                            <Text style={[styles.statPillText, { color: '#9945FF' }]}>
                                ◎ {wallet.solBalance.toFixed(4)}
                            </Text>
                            <Text style={styles.statPillLabel}>≈ ${solToUsd(wallet.solBalance).toFixed(0)}</Text>
                        </View>
                    )}
                </View>
            </LinearGradient>

            {/* Quick Actions */}
            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('Tabs', { screen: 'Market' })}
                >
                    <LinearGradient colors={[colors.green, '#059669']} style={styles.actionGradient}>
                        <Ionicons name="cart" size={18} color="#000" />
                    </LinearGradient>
                    <Text style={styles.actionLabel}>Buy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionBtn}
                    activeOpacity={0.85}
                    onPress={() => {
                        if (myCCBalance > 0) {
                            navigation.navigate('SellProject');
                        } else {
                            Alert.alert('No Credits', 'You do not have any Carbon Credits to sell. Buy some from the Market first!');
                        }
                    }}
                >
                    <LinearGradient colors={[colors.amber, '#d97706']} style={styles.actionGradient}>
                        <Ionicons name="pricetag" size={18} color="#000" />
                    </LinearGradient>
                    <Text style={styles.actionLabel}>Sell</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionBtn}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('ListProject')}
                >
                    <LinearGradient colors={[colors.blue, '#2563eb']} style={styles.actionGradient}>
                        <Ionicons name="add-circle" size={18} color="#000" />
                    </LinearGradient>
                    <Text style={styles.actionLabel}>List</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionBtn}
                    activeOpacity={0.85}
                    onPress={wallet.connected ? wallet.openDisconnectModal : wallet.openConnectModal}
                >
                    <LinearGradient colors={['#9945FF', '#7c3aed']} style={styles.actionGradient}>
                        <Ionicons name="wallet" size={18} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.actionLabel}>Wallet</Text>
                </TouchableOpacity>
            </View>

            {/* Trending Projects */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>🔥 Trending</Text>
                    <Text style={styles.sectionLink}>See All</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    {topGainers.map((project) => (
                        <View key={project.id} style={styles.trendCard}>
                            <Image source={{ uri: project.image }} style={styles.trendImage} />
                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.trendGradient} />
                            <View style={styles.trendContent}>
                                <Text style={styles.trendName} numberOfLines={1}>{project.name}</Text>
                                <View style={styles.trendBottom}>
                                    <Text style={styles.trendPrice}>◎ {project.pricePerCC.toFixed(3)}</Text>
                                    <Text style={styles.trendUsd}>≈ ${solToUsd(project.pricePerCC).toFixed(2)}</Text>
                                    <View style={[styles.trendBadge, { backgroundColor: project.change24h >= 0 ? colors.greenBg : 'rgba(239,68,68,0.15)' }]}>
                                        <Ionicons name={project.change24h >= 0 ? 'caret-up' : 'caret-down'} size={8} color={project.change24h >= 0 ? colors.green : '#EF4444'} />
                                        <Text style={[styles.trendChange, { color: project.change24h >= 0 ? colors.green : '#EF4444' }]}>
                                            {Math.abs(project.change24h).toFixed(1)}%
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Market Stats */}
            <View style={styles.marketCard}>
                <Text style={styles.sectionTitle}>Market Overview</Text>
                <View style={styles.marketGrid}>
                    <View style={styles.marketItem}>
                        <MaterialCommunityIcons name="chart-line" size={18} color={colors.blue} />
                        <Text style={styles.marketValue}>◎ {avgPrice.toFixed(3)}</Text>
                        <Text style={styles.marketUsd}>≈ ${solToUsd(avgPrice).toFixed(2)}</Text>
                        <Text style={styles.marketLabel}>Avg Price</Text>
                    </View>
                    <View style={styles.marketDivider} />
                    <View style={styles.marketItem}>
                        <MaterialCommunityIcons name="package-variant" size={18} color={colors.green} />
                        <Text style={styles.marketValue}>{verifiedProjects.length}</Text>
                        <Text style={styles.marketLabel}>Projects</Text>
                    </View>
                    <View style={styles.marketDivider} />
                    <View style={styles.marketItem}>
                        <MaterialCommunityIcons name="earth" size={18} color={colors.amber} />
                        <Text style={styles.marketValue}>{(totalSupply / 1000).toFixed(1)}K</Text>
                        <Text style={styles.marketLabel}>Supply</Text>
                    </View>
                </View>
            </View>

            {/* Recent Activity */}
            {recentTxs.length > 0 && (
                <View style={styles.recentCard}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    {recentTxs.map(tx => (
                        <View key={tx.id} style={styles.txRow}>
                            <View style={[styles.txIcon, { backgroundColor: tx.type === 'buy' ? colors.greenBg : colors.amberBg }]}>
                                <Ionicons name={tx.type === 'buy' ? 'arrow-down' : 'arrow-up'} size={14} color={tx.type === 'buy' ? colors.green : colors.amber} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.txProject}>{tx.projectName}</Text>
                                <Text style={styles.txTime}>{new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.txAmount, { color: tx.type === 'buy' ? colors.green : colors.amber }]}>
                                    {tx.type === 'buy' ? '+' : '-'}{tx.amount} CC
                                </Text>
                                <Text style={styles.txSol}>◎ {tx.totalSOL.toFixed(4)}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 16 },
    portfolioCard: { borderRadius: 20, padding: 22, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.12)' },
    portfolioLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    portfolioValue: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5, marginBottom: 14 },
    statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    statPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    statPillText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
    statPillLabel: { fontSize: 10, fontWeight: '500', color: colors.textMuted },
    actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    actionBtn: { flex: 1, alignItems: 'center', gap: 6 },
    actionGradient: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    actionLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
    section: { marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    sectionLink: { fontSize: 12, fontWeight: '600', color: colors.green },
    trendCard: { width: width * 0.42, height: 160, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    trendImage: { width: '100%', height: '100%', position: 'absolute' },
    trendGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%' },
    trendContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
    trendName: { fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
    trendBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    trendPrice: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
    trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
    trendChange: { fontSize: 10, fontWeight: '800' },
    marketCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    marketGrid: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    marketItem: { flex: 1, alignItems: 'center', gap: 4 },
    marketDivider: { width: 1, height: 36, backgroundColor: colors.border },
    marketValue: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
    marketLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
    recentCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
    txRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    txIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    txProject: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
    txTime: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
    txAmount: { fontSize: 13, fontWeight: '800' },
    txSol: { fontSize: 10, fontWeight: '600', color: colors.textMuted, marginTop: 1 },
    portfolioUsd: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 14 },
    trendUsd: { fontSize: 9, fontWeight: '600', color: colors.textMuted },
    marketUsd: { fontSize: 10, fontWeight: '600', color: colors.textMuted },
});
