import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface DisconnectModalProps {
    visible: boolean;
    onClose: () => void;
    walletAddress: string;
    solBalance: number | null;
    onDisconnect: () => void;
}

export const DisconnectModal: React.FC<DisconnectModalProps> = ({
    visible,
    onClose,
    walletAddress,
    solBalance,
    onDisconnect,
}) => {
    const handleDisconnect = () => {
        onDisconnect();
        onClose();
    };

    const shortAddr = walletAddress
        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}`
        : '';

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity style={styles.modal} activeOpacity={1}>
                    {/* Wallet icon */}
                    <View style={styles.iconCircle}>
                        <Ionicons name="wallet" size={28} color={colors.green} />
                    </View>

                    <Text style={styles.title}>Connected Wallet</Text>

                    {/* Address */}
                    <View style={styles.addressBox}>
                        <Text style={styles.addressLabel}>Address</Text>
                        <Text style={styles.addressValue}>{shortAddr}</Text>
                    </View>

                    {/* SOL Balance */}
                    {solBalance !== null && (
                        <View style={styles.balanceBox}>
                            <Text style={styles.balanceLabel}>Balance</Text>
                            <Text style={styles.balanceValue}>◎ {solBalance.toFixed(4)} SOL</Text>
                        </View>
                    )}

                    {/* Info Rows */}
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Network</Text>
                        <View style={styles.networkBadge}>
                            <View style={styles.networkDot} />
                            <Text style={styles.networkText}>Devnet</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Status</Text>
                        <View style={styles.statusBadge}>
                            <View style={[styles.networkDot, { backgroundColor: colors.green }]} />
                            <Text style={[styles.networkText, { color: colors.green }]}>Connected</Text>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.copyBtn}
                            onPress={() => {
                                Alert.alert('Copied!', 'Wallet address copied to clipboard.');
                            }}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="copy-outline" size={16} color={colors.blue} />
                            <Text style={styles.copyText}>Copy Address</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.explorerBtn}
                            onPress={() => { }}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.explorerText}>Explorer</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Disconnect */}
                    <TouchableOpacity
                        style={styles.disconnectBtn}
                        onPress={handleDisconnect}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                        <Text style={styles.disconnectText}>Disconnect Wallet</Text>
                    </TouchableOpacity>

                    {/* Cancel */}
                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
                        <Text style={styles.cancelText}>Close</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modal: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.greenBg,
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 20,
        letterSpacing: -0.3,
    },
    addressBox: {
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    addressLabel: {
        fontSize: 11,
        color: colors.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    addressValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#9945FF',
        fontFamily: 'monospace',
        letterSpacing: 0.5,
    },
    balanceBox: {
        width: '100%',
        backgroundColor: 'rgba(153, 69, 255, 0.08)',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(153, 69, 255, 0.15)',
    },
    balanceLabel: {
        fontSize: 11,
        color: colors.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    balanceValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#9945FF',
    },
    infoRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    infoLabel: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '600',
    },
    networkBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    networkDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#9945FF',
    },
    networkText: {
        fontSize: 12,
        color: '#9945FF',
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
        marginTop: 18,
        marginBottom: 12,
    },
    copyBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: colors.blueBg,
        borderWidth: 1,
        borderColor: 'rgba(96, 165, 250, 0.2)',
    },
    copyText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.blue,
    },
    explorerBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    explorerText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    disconnectBtn: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        marginBottom: 8,
    },
    disconnectText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#EF4444',
    },
    cancelBtn: {
        paddingVertical: 10,
    },
    cancelText: {
        fontSize: 14,
        color: colors.textMuted,
        fontWeight: '600',
    },
});
