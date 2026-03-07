import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

export interface DynamicCertificateProps {
    projectName: string;
    amount: number;
    date: string;
    assetId?: string;
    holderAddress: string;
    purchasingFirm?: string;
}

export const DynamicCertificate: React.FC<DynamicCertificateProps> = ({
    projectName,
    amount,
    date,
    assetId,
    holderAddress,
    purchasingFirm = 'SolCarbon Individual',
}) => {
    // Truncate address for display
    const displayAddress = holderAddress.length > 20
        ? `${holderAddress.substring(0, 8)}...${holderAddress.substring(holderAddress.length - 8)}`
        : holderAddress;

    const displayAssetId = assetId && assetId.length > 15
        ? `${assetId.substring(0, 6)}...${assetId.substring(assetId.length - 6)}`
        : assetId || 'PENDING';

    return (
        <View style={styles.cardContainer}>
            <LinearGradient
                colors={['#064e3b', '#065f46', '#022c22']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Decorative Elements */}
                <View style={styles.decorCircle1} />
                <View style={styles.decorCircle2} />

                <View style={styles.cardHeader}>
                    <View>
                        <MaterialCommunityIcons name="leaf" size={28} color={colors.green} />
                        <Text style={styles.brandTitle}>SOLCARBON</Text>
                    </View>
                    <View style={styles.verifiedStamp}>
                        <Ionicons name="shield-checkmark" size={16} color="#000" />
                        <Text style={styles.verifiedText}>VERIFIED CC</Text>
                    </View>
                </View>

                <View style={styles.cardMain}>
                    <Text style={styles.certLabel}>OFFICIAL CERTIFICATE OF RETIREMENT</Text>
                    <Text style={styles.projectName} numberOfLines={1}>{projectName.toUpperCase()}</Text>

                    <View style={styles.amountContainer}>
                        <Text style={styles.amountValue}>{amount.toLocaleString()}</Text>
                        <Text style={styles.amountUnit}>TONS CO2e</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.footerRow}>
                        <View style={styles.footerItem}>
                            <Text style={styles.footerLabel}>HOLDER</Text>
                            <Text style={styles.footerValue}>{displayAddress}</Text>
                        </View>
                        <View style={[styles.footerItem, { alignItems: 'flex-end' }]}>
                            <Text style={styles.footerLabel}>DATE</Text>
                            <Text style={styles.footerValue}>{date}</Text>
                        </View>
                    </View>

                    <View style={[styles.footerRow, { marginTop: 12 }]}>
                        <View style={styles.footerItem}>
                            <Text style={styles.footerLabel}>PURCHASING FIRM</Text>
                            <Text style={styles.footerValue} numberOfLines={1}>{purchasingFirm}</Text>
                        </View>
                        <View style={[styles.footerItem, { alignItems: 'flex-end' }]}>
                            <Text style={styles.footerLabel}>ASSET ID</Text>
                            <Text style={styles.footerValue}>{displayAssetId}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        width: '100%',
        aspectRatio: 1.6,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#000',
        ...Platform.select({
            ios: {
                boxShadow: `0 4px 6px rgba(0, 255, 0, 0.25)`,
            },
            android: {
                elevation: 8,
            },
            web: {
                boxShadow: '0 4px 12px rgba(0, 255, 0, 0.2)',
            },
        }),
    },
    cardGradient: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
    },
    decorCircle1: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
    },
    decorCircle2: {
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(52, 211, 153, 0.03)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    brandTitle: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        marginTop: 2,
    },
    verifiedStamp: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.green,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 4,
    },
    verifiedText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '800',
    },
    cardMain: {
        alignItems: 'center',
        marginVertical: 10,
    },
    certLabel: {
        color: colors.green,
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    projectName: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
        marginTop: 4,
    },
    amountValue: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '900',
    },
    amountUnit: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '600',
    },
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 16,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerItem: {
        flex: 1,
    },
    footerLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 2,
    },
    footerValue: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
});
