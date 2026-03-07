import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface Props {
    connected: boolean;
    connecting: boolean;
    publicKey: string | null;
    onConnect: () => void;
    onDisconnect: () => void;
}

export const ConnectButton: React.FC<Props> = ({
    connected,
    connecting,
    publicKey,
    onConnect,
    onDisconnect,
}) => {
    if (connecting) {
        return (
            <View style={[styles.button, styles.connecting]}>
                <ActivityIndicator size="small" color={colors.textPrimary} />
                <Text style={styles.buttonText}>Connecting...</Text>
            </View>
        );
    }

    if (connected && publicKey) {
        return (
            <TouchableOpacity
                style={[styles.button, styles.connected]}
                onPress={onDisconnect}
                activeOpacity={0.8}
            >
                <Ionicons name="wallet" size={14} color={colors.green} />
                <Text style={styles.connectedText}>
                    {publicKey.slice(0, 4)}..{publicKey.slice(-4)}
                </Text>
                <Ionicons name="close-circle-outline" size={13} color={colors.textMuted} />
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[styles.button, styles.disconnected]}
            onPress={onConnect}
            activeOpacity={0.8}
        >
            <Ionicons name="wallet-outline" size={14} color="#fff" />
            <Text style={styles.buttonText}>Connect</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 16,
        gap: 5,
    },
    disconnected: {
        backgroundColor: '#9945FF',
    },
    connected: {
        backgroundColor: colors.greenBg,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    connecting: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    buttonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    connectedText: {
        color: colors.green,
        fontSize: 11,
        fontWeight: '700',
        fontFamily: 'monospace',
    },
});
