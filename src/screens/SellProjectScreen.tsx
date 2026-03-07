import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { useBlockchainStore } from '../store/blockchain-store';
import { solToUsd } from '../utils/price';

export const SellProjectScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { carbonCredits, nftCertificates, sellCredits, isLoading } = useBlockchainStore();

    const [amount, setAmount] = useState('');
    const [price, setPrice] = useState('0.10');

    const numAmount = parseFloat(amount) || 0;
    const numPrice = parseFloat(price) || 0;
    const totalRevenue = numAmount * numPrice;

    const handleSell = async () => {
        if (numAmount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount of CCs to sell.');
            return;
        }
        if (numAmount > carbonCredits) {
            Alert.alert('Insufficient Credits', `You only have ${carbonCredits} CC available.`);
            return;
        }
        if (numPrice <= 0) {
            Alert.alert('Invalid Price', 'Please enter a valid selling price.');
            return;
        }

        try {
            const sig = await sellCredits(numAmount, numPrice);
            Alert.alert(
                '✅ Credits Listed!',
                `Your ${numAmount} CC have been listed on the market at ◎ ${numPrice}/CC\n\nSignature: ${sig.substring(0, 20)}...`,
                [{ text: 'Done', onPress: () => navigation.goBack() }]
            );
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sell Carbon Credits</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Wallet Balance Info */}
                <View style={styles.walletCard}>
                    <View style={styles.walletHeader}>
                        <Ionicons name="wallet" size={20} color={colors.amber} />
                        <Text style={styles.walletTitle}>Your Available Credits</Text>
                    </View>
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceValue}>{carbonCredits} CC</Text>
                        <View style={styles.nftBadge}>
                            <MaterialCommunityIcons name="certificate" size={12} color={colors.blue} />
                            <Text style={styles.nftText}>{nftCertificates.length} Certificates</Text>
                        </View>
                    </View>
                    <Text style={styles.walletSub}>These are credits you have purchased and hold in your connected Solana wallet.</Text>
                </View>

                {/* Sell Form */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Listing Details</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Amount to Sell (CC)</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                placeholder={`Max ${carbonCredits}`}
                                placeholderTextColor={colors.textMuted}
                            />
                            <TouchableOpacity
                                style={styles.maxBtn}
                                onPress={() => setAmount(carbonCredits.toString())}
                            >
                                <Text style={styles.maxText}>MAX</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Price per CC (◎ SOL)</Text>
                        <TextInput
                            style={styles.input}
                            value={price}
                            onChangeText={setPrice}
                            keyboardType="decimal-pad"
                            placeholder="0.10"
                            placeholderTextColor={colors.textMuted}
                        />
                        <Text style={styles.usdHint}>≈ ${solToUsd(numPrice).toFixed(2)} USD / CC</Text>
                    </View>
                </View>

                {/* Revenue Summary */}
                <View style={styles.revenueBox}>
                    <Text style={styles.revenueLabel}>Expected Total Revenue</Text>
                    <Text style={styles.revenueValue}>◎ {totalRevenue.toFixed(4)} SOL</Text>
                    <Text style={styles.revenueUsd}>≈ ${solToUsd(totalRevenue).toFixed(2)} USD</Text>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={20} color={colors.textMuted} />
                    <Text style={styles.infoText}>
                        When you list these credits, they will be transferred from your wallet to the marketplace escrow until sold. Your corresponding NFT certificate will be updated to reflect the new balance.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Bottom Action */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.submitBtn, (isLoading || numAmount <= 0) && styles.disabledBtn]}
                    onPress={handleSell}
                    disabled={isLoading || numAmount <= 0}
                    activeOpacity={0.8}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#000" size="small" />
                    ) : (
                        <LinearGradient colors={[colors.amber, '#d97706']} style={styles.submitGradient}>
                            <Ionicons name="pricetag" size={20} color="#fff" />
                            <Text style={styles.submitText}>List on Marketplace</Text>
                        </LinearGradient>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: colors.border,
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
    scrollContent: { padding: 16 },

    walletCard: {
        backgroundColor: 'rgba(245, 158, 11, 0.08)', borderRadius: 16, padding: 16,
        marginBottom: 16, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    walletHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    walletTitle: { fontSize: 14, fontWeight: '700', color: colors.amber },
    balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    balanceValue: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
    nftBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(59, 130, 246, 0.15)',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    },
    nftText: { fontSize: 11, fontWeight: '700', color: colors.blue },
    walletSub: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },

    card: {
        backgroundColor: colors.card, borderRadius: 16, padding: 16,
        marginBottom: 16, borderWidth: 1, borderColor: colors.border,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
    inputWrapper: { position: 'relative', justifyContent: 'center' },
    input: {
        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
        borderRadius: 12, padding: 14, fontSize: 15, color: colors.textPrimary, fontWeight: '500',
    },
    maxBtn: {
        position: 'absolute', right: 8, backgroundColor: colors.background,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    },
    maxText: { fontSize: 11, fontWeight: '800', color: colors.amber },
    usdHint: { fontSize: 11, color: colors.textMuted, marginTop: 6, fontWeight: '500' },

    revenueBox: {
        backgroundColor: colors.surface, borderRadius: 16, padding: 20,
        alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 16,
    },
    revenueLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
    revenueValue: { color: colors.amber, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    revenueUsd: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginTop: 4 },

    infoBox: {
        flexDirection: 'row', gap: 12, backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    },
    infoText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },

    bottomBar: {
        padding: 16, paddingBottom: 32, backgroundColor: colors.card,
        borderTopWidth: 1, borderTopColor: colors.border,
    },
    submitBtn: { borderRadius: 16, overflow: 'hidden' },
    submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    disabledBtn: { opacity: 0.5 },
});
