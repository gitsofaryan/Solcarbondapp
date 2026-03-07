import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

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
    const formattedDate = mintDate instanceof Date
        ? mintDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date(mintDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Using a QR code API for visual proof
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=10b981&bgcolor=022c22&data=${tokenId}`;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#064e3b', '#022c22', '#011a14']}
                style={styles.certificate}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Decorative Inner Frame */}
                <View style={styles.innerFrame}>
                    {/* Header: SolCarbon Logo and Title */}
                    <View style={styles.header}>
                        <View style={styles.logoAndTitle}>
                            <View style={styles.logoContainer}>
                                <Image
                                    source={require('../../assets/solcarbon-logo.png')}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>
                            <View>
                                <Text style={styles.title}>SOLCARBON</Text>
                                <Text style={styles.subtitle}>CARBON CREDIT ASSET</Text>
                            </View>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>VERIFIED</Text>
                        </View>
                    </View>

                    {/* Main Content: Amount and Project */}
                    <View style={styles.mainContent}>
                        <View style={styles.amountSection}>
                            <Text style={styles.amountLabel}>OFFSET QUANTITY</Text>
                            <Text style={styles.amount}>{amount} TONNES CO₂e</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.projectSection}>
                            <Text style={styles.label}>CERTIFIED PROJECT</Text>
                            <Text style={styles.projectName}>{projectName}</Text>
                        </View>

                        <View style={styles.detailsGrid}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>MINT DATE</Text>
                                <Text style={styles.detailValue}>{formattedDate}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>HOLDER</Text>
                                <Text style={styles.detailValue} numberOfLines={1}>{purchasingFirm}</Text>
                            </View>
                        </View>

                        <View style={styles.tokenSection}>
                            <Text style={styles.detailLabel}>ON-CHAIN ID (METAPLEX CORE)</Text>
                            <Text style={styles.tokenText}>{tokenId}</Text>
                        </View>
                    </View>

                    {/* Footer: Stamp and QR */}
                    <View style={styles.footer}>
                        <View style={styles.guaranteeText}>
                            <Text style={styles.legalLabel}>AUTHENTICITY GUARANTEE</Text>
                            <Text style={styles.legalSub}>This certificate represents real-world carbon sequestration verified by the SolCarbon protocol. Each credit is backed by on-chain assets on the Solana Blockchain.</Text>
                        </View>

                        <View style={styles.stampAndQR}>
                            {/* SOL CARBON STAMP */}
                            <View style={styles.stamp}>
                                <Text style={styles.stampTextInner}>SOL CARBON</Text>
                                <View style={styles.stampRing}>
                                    <Text style={styles.stampCenter}>AUTHENTIC</Text>
                                </View>
                                <Text style={styles.stampTextInner}>CERTIFIED</Text>
                            </View>

                            {/* PROOF QR CODE */}
                            <View style={styles.qrContainer}>
                                <Image
                                    source={{ uri: qrUrl }}
                                    style={styles.qrCode}
                                />
                                <Text style={styles.qrLabel}>SCAN FOR PROOF</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 1.6, // Landscape orientation
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    certificate: {
        flex: 1,
        padding: 12,
    },
    innerFrame: {
        flex: 1,
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        borderRadius: 14,
        padding: 16,
        backgroundColor: 'rgba(2, 44, 34, 0.4)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    logoAndTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoContainer: {
        width: 36,
        height: 36,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 8,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 16,
        fontWeight: '900',
        color: '#f0fdf4',
        letterSpacing: 1.5,
    },
    subtitle: {
        fontSize: 8,
        color: colors.green,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    badge: {
        backgroundColor: colors.green,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: '#022c22',
        fontSize: 8,
        fontWeight: '900',
    },
    mainContent: {
        flex: 1,
        justifyContent: 'center',
    },
    amountSection: {
        marginBottom: 8,
    },
    amountLabel: {
        fontSize: 8,
        color: colors.green,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 2,
    },
    amount: {
        fontSize: 24,
        fontWeight: '900',
        color: '#ffffff',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        marginVertical: 8,
    },
    projectSection: {
        marginBottom: 8,
    },
    label: {
        fontSize: 8,
        color: colors.green,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 2,
    },
    projectName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#f0fdf4',
    },
    detailsGrid: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 8,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 7,
        color: colors.green,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 10,
        fontWeight: '600',
        color: '#ffffff',
    },
    tokenSection: {
        marginTop: 4,
    },
    tokenText: {
        fontSize: 7,
        fontFamily: 'monospace',
        color: 'rgba(240, 253, 244, 0.6)',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 10,
    },
    guaranteeText: {
        flex: 1,
        paddingRight: 10,
    },
    legalLabel: {
        fontSize: 7,
        fontWeight: '800',
        color: colors.green,
        marginBottom: 2,
    },
    legalSub: {
        fontSize: 6,
        color: 'rgba(240, 253, 244, 0.5)',
        lineHeight: 8,
    },
    stampAndQR: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stamp: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: 'rgba(16, 185, 129, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '-15deg' }],
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
    },
    stampTextInner: {
        fontSize: 4,
        fontWeight: '900',
        color: colors.green,
        letterSpacing: 0.5,
    },
    stampRing: {
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.green,
        marginVertical: 1,
    },
    stampCenter: {
        fontSize: 5,
        fontWeight: '900',
        color: colors.green,
    },
    qrContainer: {
        alignItems: 'center',
        backgroundColor: '#022c22',
        padding: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    qrCode: {
        width: 48,
        height: 48,
        borderRadius: 4,
    },
    qrLabel: {
        fontSize: 5,
        fontWeight: '800',
        color: colors.green,
        marginTop: 2,
    },
});
