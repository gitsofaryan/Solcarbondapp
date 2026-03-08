import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useBlockchainStore, Transaction } from '../store/blockchain-store';
import { useWalletContext } from '../providers/WalletProvider';
import { CC_TOKEN_MINT } from '../utils/solana';


type FilterType = 'all' | 'buy' | 'sell' | 'retire';

export const HistoryScreen: React.FC = () => {
    const { transactions } = useBlockchainStore();
    const wallet = useWalletContext();
    const [filter, setFilter] = useState<FilterType>('all');
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    const myTransactions = transactions.filter(t => t.owner === wallet.walletAddress);

    const filtered = myTransactions.filter((tx) => {
        if (filter === 'all') return true;
        return tx.type === filter;
    });

    const formatDate = (date: any) =>
        new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Transaction History</Text>

                <TouchableOpacity
                    style={styles.globalActivityBtn}
                    onPress={() => Linking.openURL(`https://explorer.solana.com/address/${CC_TOKEN_MINT}?cluster=devnet`)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="globe-outline" size={16} color={colors.green} />
                    <Text style={styles.globalActivityText}>View Global SOLCC Activity</Text>
                </TouchableOpacity>

                <Text style={styles.subtitle}>{myTransactions.length} total transactions</Text>


                {/* Filters */}
                <View style={styles.filterRow}>
                    {(['all', 'buy', 'sell', 'retire'] as FilterType[]).map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                            onPress={() => setFilter(f)}
                        >
                            <Text
                                style={[
                                    styles.filterBtnText,
                                    filter === f && styles.filterBtnTextActive,
                                ]}
                            >
                                {f === 'all' ? 'All' : f === 'buy' ? 'Purchases' : f === 'sell' ? 'Sales' : 'Retired'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Transaction List */}
                <View style={styles.list}>
                    {filtered.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>No transactions yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Your transaction history will appear here
                            </Text>
                        </View>
                    ) : (
                        filtered.map((tx) => (
                            <TouchableOpacity
                                key={tx.id}
                                style={styles.tokenRow}
                                onPress={() => setSelectedTx(tx)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.tokenLogo, { backgroundColor: tx.type === 'buy' ? colors.greenBg : tx.type === 'retire' ? colors.redBg : colors.amberBg }]}>
                                    <Ionicons
                                        name={tx.type === 'buy' ? 'arrow-down' : tx.type === 'retire' ? 'flame' : 'arrow-up'}
                                        size={20}
                                        color={tx.type === 'buy' ? colors.green : tx.type === 'retire' ? colors.red : colors.amber}
                                    />
                                </View>

                                <View style={styles.tokenMid}>
                                    <Text style={styles.tokenTicker} numberOfLines={1}>
                                        {tx.projectName}
                                    </Text>
                                    <Text style={styles.tokenName}>{formatDate(tx.timestamp)}</Text>
                                </View>

                                <View style={styles.tokenRight}>
                                    <Text
                                        style={[
                                            styles.tokenBalance,
                                            { color: tx.type === 'buy' ? colors.green : tx.type === 'retire' ? colors.red : colors.amber },
                                        ]}
                                    >
                                        {tx.type === 'buy' ? '+' : tx.type === 'retire' ? '🔥 ' : '-'}{tx.amount} CC
                                    </Text>
                                    <Text style={styles.tokenUsd}>
                                        ◎ {tx.totalSOL.toFixed(4)} SOL
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Transaction Detail Modal */}
            <Modal
                visible={!!selectedTx}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedTx(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />

                        {selectedTx && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Transaction Details</Text>
                                    <TouchableOpacity
                                        onPress={() => setSelectedTx(null)}
                                        style={styles.modalClose}
                                    >
                                        <Ionicons name="close" size={22} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                <View
                                    style={[
                                        styles.modalTypeBox,
                                        {
                                            backgroundColor:
                                                selectedTx.type === 'buy' ? colors.greenBg : colors.amberBg,
                                            borderColor:
                                                selectedTx.type === 'buy'
                                                    ? 'rgba(16, 185, 129, 0.2)'
                                                    : 'rgba(245, 158, 11, 0.2)',
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={selectedTx.type === 'buy' ? 'arrow-down-circle' : 'arrow-up-circle'}
                                        size={28}
                                        color={selectedTx.type === 'buy' ? colors.green : colors.amber}
                                    />
                                    <Text
                                        style={[
                                            styles.modalTypeText,
                                            {
                                                color:
                                                    selectedTx.type === 'buy' ? colors.green : colors.amber,
                                            },
                                        ]}
                                    >
                                        {selectedTx.type === 'buy' ? 'Purchase' : 'Sale'}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.modalTypeAmount,
                                            {
                                                color:
                                                    selectedTx.type === 'buy' ? colors.green : colors.amber,
                                            },
                                        ]}
                                    >
                                        {selectedTx.amount} CC
                                    </Text>
                                </View>

                                <View style={styles.detailList}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Project</Text>
                                        <Text style={styles.detailValue}>{selectedTx.projectName}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Price/CC</Text>
                                        <Text style={styles.detailValue}>
                                            ◎ {selectedTx.pricePerCC.toFixed(4)} SOL
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Total</Text>
                                        <Text style={[styles.detailValue, { fontWeight: '800' }]}>
                                            ◎ {selectedTx.totalSOL.toFixed(4)} SOL
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Status</Text>
                                        <View style={styles.statusBadge}>
                                            <View style={styles.statusDot} />
                                            <Text style={styles.statusText}>
                                                {selectedTx.status.charAt(0).toUpperCase() +
                                                    selectedTx.status.slice(1)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Date</Text>
                                        <Text style={styles.detailValue}>
                                            {new Date(selectedTx.timestamp).toLocaleString()}
                                        </Text>
                                    </View>
                                    <View style={[styles.detailRow, { flexDirection: 'column', gap: 6 }]}>
                                        <Text style={styles.detailLabel}>Transaction Signature</Text>
                                        <Text style={[styles.detailValue, { fontSize: 11 }]} numberOfLines={2}>
                                            {selectedTx.signature}
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.explorerBtn}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        if (selectedTx.explorerUrl) {
                                            const { Linking } = require('react-native');
                                            Linking.openURL(selectedTx.explorerUrl);
                                        }
                                    }}
                                >
                                    <Ionicons name="open-outline" size={16} color={colors.blue} />
                                    <Text style={styles.explorerText}>View on Solana Explorer</Text>
                                </TouchableOpacity>
                            </>
                        )}
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
    filterRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    filterBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterBtnActive: {
        backgroundColor: colors.greenBg,
        borderColor: colors.green,
    },
    filterBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    filterBtnTextActive: {
        color: colors.green,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
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
    tokenLogo: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    tokenMid: {
        flex: 1,
        gap: 2,
    },
    tokenTicker: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    tokenName: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '500',
    },
    tokenRight: {
        alignItems: 'flex-end',
        gap: 2,
    },
    tokenBalance: {
        fontSize: 16,
        fontWeight: '700',
    },
    tokenUsd: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '500',
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
        padding: 24,
        paddingBottom: 40,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.borderLight,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    modalClose: {
        padding: 4,
    },
    modalTypeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 16,
        borderRadius: 14,
        marginBottom: 20,
        borderWidth: 1,
    },
    modalTypeText: {
        fontSize: 16,
        fontWeight: '700',
    },
    modalTypeAmount: {
        fontSize: 24,
        fontWeight: '800',
    },
    detailList: {
        gap: 10,
        marginBottom: 20,
    },
    detailRow: {
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
        fontWeight: '600',
        maxWidth: '60%',
        textAlign: 'right',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: colors.green,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.green,
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
    explorerText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.blue,
    },
    globalActivityBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.greenBg,
        marginHorizontal: 16,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        gap: 8,
        marginTop: 4,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
        alignSelf: 'flex-start',
    },
    globalActivityText: {
        color: colors.green,
        fontSize: 12,
        fontWeight: '700',
    },
});
