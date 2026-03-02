import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { DynamicCertificate } from '../components/DynamicCertificate';
import { useWalletContext } from '../providers/WalletProvider';

export const ConfirmationScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const wallet = useWalletContext();

    // Animation value for the card entrance
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));

    // Fallback values in case params are missing
    const {
        amount = 0,
        projectName = 'Unknown Project',
        totalCostSOL = 0,
        assetId = 'PENDING...',
        signature = '',
    } = route.params || {};

    // Get current date formatted
    const dateStr = new Date().toLocaleDateString('en-US', { year: '2-digit', month: '2-digit' });

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handlePortfolio = () => {
        // Reset stack to Tabs and go to Portfolio
        navigation.reset({
            index: 0,
            routes: [
                {
                    name: 'Tabs',
                    state: {
                        routes: [
                            { name: 'Portfolio' }
                        ]
                    }
                }
            ],
        });
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(16, 185, 129, 0.1)', colors.background]}
                style={StyleSheet.absoluteFillObject}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header / Success Indicator */}
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="checkmark-sharp" size={40} color={colors.green} />
                    </View>
                    <Text style={styles.title}>Purchase Successful</Text>
                    <Text style={styles.subtitle}>Your carbon credits have been minted to your wallet.</Text>
                </View>

                {/* The "ATM Card" Certificate Visual */}
                <Animated.View style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                    width: '100%',
                    paddingHorizontal: 16,
                    marginVertical: 32,
                }}>
                    <DynamicCertificate
                        projectName={projectName}
                        amount={amount}
                        date={dateStr}
                        assetId={assetId}
                        ownerAddress={wallet.publicKey ? wallet.publicKey.toString() : ''}
                    />
                </Animated.View>

                {/* Receipt Details */}
                <View style={styles.receiptCard}>
                    <Text style={styles.receiptTitle}>Transaction Receipt</Text>

                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Item</Text>
                        <Text style={styles.receiptValue}>{amount.toFixed(2)} CC</Text>
                    </View>

                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Project</Text>
                        <Text style={styles.receiptValue}>{projectName}</Text>
                    </View>

                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Total Paid</Text>
                        <Text style={styles.receiptHighlight}>◎ {totalCostSOL.toFixed(4)} SOL</Text>
                    </View>

                    {signature ? (
                        <View style={[styles.receiptRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                            <Text style={styles.receiptLabel}>Tx Hash</Text>
                            <Text style={[styles.receiptValue, { fontSize: 11, color: colors.blue }]}>
                                {signature.slice(0, 12)}...{signature.slice(-12)}
                            </Text>
                        </View>
                    ) : null}
                </View>

            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.portfolioBtn} onPress={handlePortfolio} activeOpacity={0.8}>
                    <Ionicons name="wallet-outline" size={20} color="#fff" />
                    <Text style={styles.portfolioBtnText}>View in Portfolio</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.navigate('Tabs')} activeOpacity={0.7}>
                    <Text style={styles.closeBtnText}>Return to Dashboard</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingTop: 80,
        paddingBottom: 40,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.greenBg,
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.textPrimary,
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    receiptCard: {
        width: '90%',
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    receiptTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    receiptRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    receiptLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    receiptValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    receiptHighlight: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.green,
    },
    bottomBar: {
        padding: 24,
        paddingBottom: 40,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: 12,
    },
    portfolioBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.green,
        paddingVertical: 16,
        borderRadius: 16,
    },
    portfolioBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    closeBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    closeBtnText: {
        color: colors.textMuted,
        fontSize: 15,
        fontWeight: '600',
    },
});
