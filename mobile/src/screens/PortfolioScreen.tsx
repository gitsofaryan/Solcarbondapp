import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Modal,
    Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { useBlockchainStore, NFTCertificate } from '../store/blockchain-store';
import { useWalletContext } from '../providers/WalletProvider';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48 - 12) / 2;

export const PortfolioScreen: React.FC = () => {
    const { carbonCredits, nftCertificates, transactions } = useBlockchainStore();
    const wallet = useWalletContext();
    const navigation = useNavigation<any>();


    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Your Portfolio</Text>
                <Text style={styles.subtitle}>NFT Carbon certificates</Text>

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

                    {wallet.connected && wallet.solBalance !== null && (
                        <View style={styles.summaryCardDark}>
                            <Ionicons name="wallet" size={20} color="#9945FF" />
                            <Text style={[styles.summaryValue, { color: '#9945FF' }]}>
                                {wallet.solBalance.toFixed(2)}
                            </Text>
                            <Text style={styles.summaryLabelDark}>SOL</Text>
                        </View>
                    )}
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
                            <TouchableOpacity
                                key={nft.id}
                                style={styles.nftCard}
                                onPress={() => navigation.navigate('CertificateDetail', { id: nft.id })}
                                activeOpacity={0.85}
                            >
                                <Image
                                    source={{ uri: nft.uri }}
                                    style={styles.nftImage}
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.85)']}
                                    style={styles.nftGradient}
                                />
                                <View style={styles.nftBadge}>
                                    <Ionicons name="shield-checkmark" size={10} color={colors.green} />
                                    <Text style={styles.nftBadgeText}>NFT</Text>
                                </View>
                                <View style={styles.nftContent}>
                                    <Text style={styles.nftTitle} numberOfLines={1}>
                                        {nft.projectName}
                                    </Text>
                                    <Text style={styles.nftAmount}>{nft.amount} CC</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
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
    nftCard: {
        width: CARD_SIZE,
        height: CARD_SIZE * 1.2,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
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
});
