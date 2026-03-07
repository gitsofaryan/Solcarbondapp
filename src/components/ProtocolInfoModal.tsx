import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Linking,
    Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface ProtocolInfoModalProps {
    visible: boolean;
    onClose: () => void;
    treasuryAddress: string;
    mintAddress: string;
}

export const ProtocolInfoModal: React.FC<ProtocolInfoModalProps> = ({
    visible,
    onClose,
    treasuryAddress,
    mintAddress,
}) => {
    const openExplorer = (address: string) => {
        const url = `https://explorer.solana.com/address/${address}?cluster=devnet`;
        if (Platform.OS === 'web') {
            (window as any).open(url, '_blank');
        } else {
            Linking.openURL(url);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.handle} />

                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Protocol Infrastructure</Text>
                            <Text style={styles.subtitle}>Solana Devnet Smart Contract Details</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {/* Treasury */}
                        <View style={styles.infoBox}>
                            <View style={styles.infoLabelRow}>
                                <MaterialCommunityIcons name="bank" size={16} color={colors.amber} />
                                <Text style={styles.infoLabel}>Treasury (Mint Authority)</Text>
                            </View>
                            <Text style={styles.addressText}>{treasuryAddress}</Text>
                            <TouchableOpacity
                                style={styles.explorerBtn}
                                onPress={() => openExplorer(treasuryAddress)}
                            >
                                <Text style={styles.explorerText}>View on Explorer</Text>
                                <Ionicons name="open-outline" size={14} color={colors.blue} />
                            </TouchableOpacity>
                        </View>

                        {/* Mint */}
                        <View style={styles.infoBox}>
                            <View style={styles.infoLabelRow}>
                                <Ionicons name="leaf" size={16} color={colors.green} />
                                <Text style={styles.infoLabel}>Carbon Credit (CC) Mint</Text>
                            </View>
                            <Text style={styles.addressText}>{mintAddress}</Text>
                            <TouchableOpacity
                                style={styles.explorerBtn}
                                onPress={() => openExplorer(mintAddress)}
                            >
                                <Text style={styles.explorerText}>View on Explorer</Text>
                                <Ionicons name="open-outline" size={14} color={colors.blue} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.noteBox}>
                            <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
                            <Text style={styles.noteText}>
                                All Carbon Credit issuance and retirement is verified on-chain via the SolCarbon Protocol.
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.doneBtn}
                        onPress={onClose}
                    >
                        <Text style={styles.doneBtnText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        borderWidth: 1,
        borderColor: colors.border,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
    subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    content: { gap: 16 },
    infoBox: {
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    infoLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    infoLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
    addressText: { fontSize: 13, color: colors.textPrimary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: 12 },
    explorerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    explorerText: { fontSize: 13, fontWeight: '600', color: colors.blue },
    noteBox: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, marginTop: 8 },
    noteText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
    doneBtn: {
        backgroundColor: colors.textPrimary,
        height: 54,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },
    doneBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },
});
