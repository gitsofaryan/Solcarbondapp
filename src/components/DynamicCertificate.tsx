import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    Animated,
    Easing,
    Pressable,
    Modal,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface DynamicCertificateProps {
    projectName: string;
    amount: number;
    mintDate: Date | string;
    tokenId: string;
    purchasingFirm?: string;
    uri?: string;
}

export const DynamicCertificate: React.FC<DynamicCertificateProps> = ({
    projectName,
    amount,
    mintDate,
    tokenId,
    purchasingFirm = 'Individual Collector',
    uri,
}) => {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const formattedDate = React.useMemo(() => {
        try {
            const d = mintDate instanceof Date ? mintDate : new Date(mintDate);
            if (isNaN(d.getTime())) return 'Mar 07, 2026';
            return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) {
            return 'Mar 07, 2026';
        }
    }, [mintDate]);

    // ── Multiple animated layers ──
    const shimmerProgress = React.useRef(new Animated.Value(0)).current;
    const pulseAnim = React.useRef(new Animated.Value(0.3)).current;
    const glowRotate = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        // Shimmer sweep
        const runShimmer = () => {
            shimmerProgress.setValue(0);
            Animated.timing(shimmerProgress, {
                toValue: 1,
                duration: 3500,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                useNativeDriver: Platform.OS !== 'web',
            }).start(() => runShimmer());
        };
        // Pulsing glow
        const runPulse = () => {
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 0.7, duration: 2000, easing: Easing.ease, useNativeDriver: Platform.OS !== 'web' }),
                Animated.timing(pulseAnim, { toValue: 0.3, duration: 2000, easing: Easing.ease, useNativeDriver: Platform.OS !== 'web' }),
            ]).start(() => runPulse());
        };
        // Rotating glow
        const runGlow = () => {
            glowRotate.setValue(0);
            Animated.timing(glowRotate, {
                toValue: 1,
                duration: 8000,
                easing: Easing.linear,
                useNativeDriver: Platform.OS !== 'web',
            }).start(() => runGlow());
        };
        runShimmer();
        runPulse();
        runGlow();
    }, []);

    const shimmerTranslateX = shimmerProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width * 1.5],
    });

    const glowRotation = glowRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const getExplorerUrl = () => {
        if (!tokenId || tokenId === 'PENDING...') return 'https://solcarbon.cc';
        const type = tokenId.length > 70 ? 'tx' : 'address';
        return `https://explorer.solana.com/${type}/${tokenId}?cluster=devnet`;
    };

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getExplorerUrl())}&color=14F195&bgcolor=0a0a14`;

    const renderCertificate = (isPopOut = false) => {
        const s = isPopOut ? 1.35 : 1; // scale factor for pop-out text
        return (
            <LinearGradient
                colors={['#0f0326', '#0a1628', '#021a0e', '#0a0a14']}
                locations={[0, 0.3, 0.7, 1]}
                style={[styles.certificate, isPopOut && styles.certificatePopOut]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* ── Animated background glow orbs ── */}
                <Animated.View style={[styles.glowOrb, styles.glowOrbPurple, { opacity: pulseAnim }]} />
                <Animated.View style={[styles.glowOrb, styles.glowOrbGreen, { opacity: pulseAnim }]} />

                {/* ── Rotating border glow ── */}
                <Animated.View style={[styles.borderGlow, { transform: [{ rotate: glowRotation }] }]}>
                    <LinearGradient
                        colors={['#9945FF', '#14F195', '#9945FF', '#14F195']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.borderGlowInner}
                    />
                </Animated.View>

                {/* ── Holographic shimmer sweep ── */}
                <Animated.View
                    style={[styles.shimmerContainer, { transform: [{ translateX: shimmerTranslateX }, { rotate: '20deg' }] }]}
                >
                    <LinearGradient
                        colors={['transparent', 'rgba(153,69,255,0.04)', 'rgba(20,241,149,0.1)', 'rgba(153,69,255,0.04)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.shimmer}
                    />
                </Animated.View>

                {/* ── Inner card frame ── */}
                <View style={styles.innerFrame}>

                    {/* ── TOP ROW: Brand + Badge ── */}
                    <View style={styles.headerRow}>
                        <View style={styles.brandGroup}>
                            <View style={styles.coinIconWrap}>
                                <LinearGradient colors={['#9945FF', '#14F195']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coinGradient}>
                                    <Image source={require('../../assets/solcarbon-logo.png')} style={styles.coinLogo} resizeMode="contain" />
                                </LinearGradient>
                            </View>
                            <View>
                                <Text style={[styles.brandName, { fontSize: 13 * s }]}>SOLCARBON</Text>
                                <Text style={[styles.brandSub, { fontSize: 7 * s }]}>CARBON CREDIT · SOLANA</Text>
                            </View>
                        </View>
                        <LinearGradient
                            colors={['#14F195', '#10b981']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.verifiedBadge}
                        >
                            <Ionicons name="shield-checkmark" size={10 * s} color="#022c22" />
                            <Text style={[styles.badgeText, { fontSize: 8 * s }]}>VERIFIED</Text>
                        </LinearGradient>
                    </View>

                    {/* ── CENTER: Amount hero ── */}
                    <View style={styles.heroSection}>
                        <Text style={[styles.labelMicro, { fontSize: 8 * s }]}>CARBON OFFSET CERTIFICATE</Text>
                        <View style={styles.amountRow}>
                            <Text style={[styles.heroAmount, { fontSize: 36 * s }]}>{amount}</Text>
                            <View style={styles.unitCol}>
                                <Text style={[styles.unitText, { fontSize: 14 * s }]}>TONNES</Text>
                                <Text style={[styles.unitSub, { fontSize: 10 * s }]}>CO₂e</Text>
                            </View>
                        </View>
                        <View style={styles.projectRow}>
                            <MaterialCommunityIcons name="leaf" size={14 * s} color="#14F195" />
                            <Text style={[styles.projectName, { fontSize: 13 * s }]} numberOfLines={1}>{projectName}</Text>
                        </View>
                    </View>

                    {/* ── BOTTOM: Metadata grid ── */}
                    <View style={styles.metaSection}>
                        <View style={styles.metaGrid}>
                            <View style={styles.metaItem}>
                                <Text style={[styles.labelMicro, { fontSize: 7 * s }]}>DATE MINTED</Text>
                                <Text style={[styles.metaValue, { fontSize: 11 * s }]}>{formattedDate}</Text>
                            </View>
                            <View style={[styles.metaDivider]} />
                            <View style={styles.metaItem}>
                                <Text style={[styles.labelMicro, { fontSize: 7 * s }]}>HOLDER</Text>
                                <Text style={[styles.metaValue, { fontSize: 11 * s }]} numberOfLines={1}>{purchasingFirm}</Text>
                            </View>
                            <View style={styles.metaDivider} />
                            <View style={styles.metaItemQR}>
                                <Image source={{ uri: qrUrl }} style={[styles.qrImage, isPopOut && { width: 52, height: 52 }]} />
                            </View>
                        </View>

                        {/* ── Asset ID footer ── */}
                        <View style={styles.assetRow}>
                            <View style={styles.chainBadge}>
                                <View style={styles.chainDot} />
                                <Text style={[styles.chainText, { fontSize: 7 * s }]}>SOLANA DEVNET</Text>
                            </View>
                            <Text style={[styles.assetId, { fontSize: 7 * s }]} numberOfLines={1}>
                                {tokenId ? (tokenId.length > 24 ? `${tokenId.slice(0, 8)}···${tokenId.slice(-8)}` : tokenId) : 'Generating...'}
                            </Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        );
    };

    return (
        <>
            <Pressable
                style={({ pressed }) => [
                    styles.container,
                    pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 }
                ]}
                onPress={() => setIsModalVisible(true)}
            >
                {renderCertificate(false)}
            </Pressable>

            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setIsModalVisible(false)}>
                    <View style={styles.popOutContainer}>
                        <TouchableOpacity style={styles.closeModalBtn} onPress={() => setIsModalVisible(false)}>
                            <Ionicons name="close" size={28} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.popOutCard}>
                            {renderCertificate(true)}
                        </View>
                        <Text style={styles.popOutHint}>
                            Tap QR to verify on Solana Explorer
                        </Text>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    // ── Container ──
    container: {
        width: '100%',
        aspectRatio: 1.55,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    certificate: {
        flex: 1,
        padding: 2,
        overflow: 'hidden',
    },
    certificatePopOut: {
        borderRadius: 28,
        aspectRatio: 1.55,
        width: width * 0.92,
    },

    // ── Animated glow orbs ──
    glowOrb: {
        position: 'absolute',
        borderRadius: 999,
    },
    glowOrbPurple: {
        width: 180,
        height: 180,
        top: -40,
        right: -30,
        backgroundColor: 'rgba(153, 69, 255, 0.15)',
    },
    glowOrbGreen: {
        width: 160,
        height: 160,
        bottom: -30,
        left: -20,
        backgroundColor: 'rgba(20, 241, 149, 0.12)',
    },

    // ── Rotating border glow ──
    borderGlow: {
        position: 'absolute',
        top: -200,
        left: -200,
        right: -200,
        bottom: -200,
        zIndex: 0,
    },
    borderGlowInner: {
        width: '100%',
        height: '100%',
        opacity: 0.08,
    },

    // ── Shimmer ──
    shimmerContainer: {
        position: 'absolute',
        top: -120,
        bottom: -120,
        width: 140,
        zIndex: 5,
    },
    shimmer: {
        flex: 1,
    },

    // ── Inner frame ──
    innerFrame: {
        flex: 1,
        borderWidth: 1,
        borderColor: 'rgba(153, 69, 255, 0.2)',
        borderRadius: 18,
        padding: 16,
        backgroundColor: 'rgba(10, 10, 20, 0.7)',
        justifyContent: 'space-between',
    },

    // ── Header row ──
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    brandGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    coinIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(153, 69, 255, 0.4)',
    },
    coinGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    coinLogo: {
        width: '100%',
        height: '100%',
    },
    brandName: {
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 2,
    },
    brandSub: {
        color: 'rgba(153, 69, 255, 0.7)',
        fontWeight: '700',
        letterSpacing: 1.5,
        marginTop: 1,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        color: '#022c22',
        fontWeight: '900',
        letterSpacing: 0.5,
    },

    // ── Hero section ──
    heroSection: {
        alignItems: 'center',
        gap: 4,
    },
    labelMicro: {
        color: 'rgba(20, 241, 149, 0.6)',
        fontWeight: '800',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    heroAmount: {
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1,
    },
    unitCol: {
        alignItems: 'flex-start',
    },
    unitText: {
        fontWeight: '800',
        color: '#14F195',
        letterSpacing: 1,
    },
    unitSub: {
        fontWeight: '700',
        color: 'rgba(20, 241, 149, 0.5)',
        marginTop: -2,
    },
    projectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: 'rgba(20, 241, 149, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(20, 241, 149, 0.15)',
        marginTop: 4,
    },
    projectName: {
        color: '#f0fdf4',
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    // ── Meta section ──
    metaSection: {
        gap: 8,
    },
    metaGrid: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flex: 1,
        gap: 3,
    },
    metaDivider: {
        width: 1,
        height: 28,
        backgroundColor: 'rgba(153, 69, 255, 0.2)',
        marginHorizontal: 10,
    },
    metaValue: {
        color: '#fff',
        fontWeight: '700',
    },
    metaItemQR: {
        alignItems: 'center',
    },
    qrImage: {
        width: 42,
        height: 42,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(20, 241, 149, 0.3)',
    },

    // ── Asset ID footer ──
    assetRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(153, 69, 255, 0.1)',
        paddingTop: 6,
    },
    chainBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    chainDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#14F195',
    },
    chainText: {
        color: 'rgba(153, 69, 255, 0.6)',
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    assetId: {
        color: 'rgba(255,255,255,0.3)',
        fontFamily: 'monospace',
        fontWeight: '600',
    },

    // ── Modal ──
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popOutContainer: {
        width: '100%',
        alignItems: 'center',
        padding: 16,
    },
    popOutCard: {
        ...Platform.select({
            web: { boxShadow: '0 0 60px rgba(153, 69, 255, 0.25), 0 0 120px rgba(20, 241, 149, 0.15)' },
            default: { elevation: 25 }
        }),
    },
    closeModalBtn: {
        position: 'absolute',
        top: 8,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    popOutHint: {
        color: colors.textSecondary,
        fontSize: 13,
        marginTop: 28,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});
