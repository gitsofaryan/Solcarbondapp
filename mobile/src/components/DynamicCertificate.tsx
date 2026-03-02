import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

// Use the new Premium Carbon Project Shareholding template
const TEMPLATE_IMAGE = require('../../assets/carbon_certificate_v2.png');

interface DynamicCertificateProps {
    projectName: string;
    amount: number;
    date: string;
    assetId?: string;
    holderAddress: string;
}

export const DynamicCertificate: React.FC<DynamicCertificateProps> = ({
    projectName,
    amount,
    date,
    assetId,
    holderAddress
}) => {
    // Format holder address for display (shorthand)
    const displayAddress = holderAddress.length > 20
        ? `${holderAddress.slice(0, 10)}...${holderAddress.slice(-10)}`
        : holderAddress;

    return (
        <View style={styles.container}>
            <Image
                source={TEMPLATE_IMAGE}
                style={styles.backgroundImage}
                resizeMode="cover"
            />

            <View style={styles.overlay}>
                {/* Holder Name Field */}
                <View style={styles.holderSection}>
                    <Text style={styles.label}>[HOLDER NAME]</Text>
                    <Text style={[styles.value, styles.holderText]}>{displayAddress}</Text>
                </View>

                {/* Project Name Field */}
                <View style={styles.projectSection}>
                    <Text style={styles.label}>PARTICULAR CARBON PROJECT NAME:</Text>
                    <Text style={[styles.value, styles.projectText]}>{projectName}</Text>
                </View>

                <View style={styles.statsRow}>
                    {/* Shares Owned Section */}
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>NUMBER OF SHARES OWNED</Text>
                        <Text style={styles.statValue}>{amount.toLocaleString()}</Text>
                    </View>

                    {/* Carbon Credits Section */}
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>CARBON CREDITS (tCO2e)</Text>
                        <Text style={styles.statValue}>{(amount * 0.5).toFixed(1)} tCO2e</Text>
                    </View>
                </View>

                {/* Footer Info */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>DATE: {date}</Text>
                    {assetId && <Text style={styles.footerText}>ASSET ID: {assetId.slice(0, 15)}...</Text>}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 350,
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#000',
        elevation: 10,
        shadowColor: '#00FF00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    overlay: {
        flex: 1,
        padding: 15,
        justifyContent: 'space-between',
    },
    holderSection: {
        marginTop: 35,
        marginLeft: 40,
    },
    projectSection: {
        marginLeft: 40,
        marginTop: 5,
    },
    label: {
        color: '#00FF00',
        fontSize: 8,
        fontWeight: 'bold',
        opacity: 0.8,
    },
    value: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    holderText: {
        color: '#fff',
        fontSize: 11,
    },
    projectText: {
        color: '#FFD700', // Gold for emphasis
        fontSize: 10,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingHorizontal: 30,
    },
    statBox: {
        alignItems: 'center',
        width: '45%',
    },
    statLabel: {
        color: '#00FF00',
        fontSize: 7,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    statValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingHorizontal: 10,
        opacity: 0.6,
    },
    footerText: {
        color: '#00FF00',
        fontSize: 6,
        fontWeight: 'bold',
    }
});
