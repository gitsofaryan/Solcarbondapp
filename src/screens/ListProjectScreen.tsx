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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { useBlockchainStore } from '../store/blockchain-store';
import { solToUsd } from '../utils/price';

export const ListProjectScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    // We'll reuse sellCredits for listing for now, but really this would be a new function
    // in the actual contract (e.g. createProject)
    const { sellCredits, carbonCredits, isLoading } = useBlockchainStore();

    const [projectName, setProjectName] = useState('');
    const [projectType, setProjectType] = useState('');
    const [location, setLocation] = useState('');
    const [amount, setAmount] = useState('');
    const [price, setPrice] = useState('0.10');

    const numAmount = parseFloat(amount) || 0;
    const numPrice = parseFloat(price) || 0;
    const expectedRevenue = numAmount * numPrice;

    const handleList = async () => {
        if (!projectName || !projectType || !location) {
            Alert.alert('Missing Info', 'Please fill in project name, type, and location.');
            return;
        }
        if (numAmount <= 0 || numPrice <= 0) {
            Alert.alert('Invalid Input', 'Please enter a valid amount and price.');
            return;
        }
        if (numAmount > carbonCredits) {
            Alert.alert('Insufficient Credits', `You only have ${carbonCredits} CC available to list.`);
            return;
        }

        try {
            // In a real app this would call a createProject/listCredits function
            const sig = await sellCredits(numAmount, numPrice);
            Alert.alert(
                '✅ Project Listed!',
                `Listed ${numAmount} CC for "${projectName}" at ◎ ${numPrice}/CC\n\nSignature: ${sig.substring(0, 20)}...`,
                [{ text: 'Done', onPress: () => navigation.goBack() }]
            );
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
                <Text style={styles.headerTitle}>List New Project</Text>
                <View style={{ width: 36 }} /> {/* Balance out back button */}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Project Details</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Project Name</Text>
                        <TextInput
                            style={styles.input}
                            value={projectName}
                            onChangeText={setProjectName}
                            placeholder="e.g. Gujarat Solar Farm Expansion"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Project Type</Text>
                        <TextInput
                            style={styles.input}
                            value={projectType}
                            onChangeText={setProjectType}
                            placeholder="e.g. Solar, Wind, Reforestation"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Location</Text>
                        <TextInput
                            style={styles.input}
                            value={location}
                            onChangeText={setLocation}
                            placeholder="e.g. Gujarat, India"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Listing Parameters</Text>

                    <View style={styles.surplusInfo}>
                        <Ionicons name="leaf" size={16} color={colors.green} />
                        <Text style={styles.surplusText}>Available in Wallet: {carbonCredits} CC</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Amount to List (CC)</Text>
                        <TextInput
                            style={styles.input}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            placeholder={`Max ${carbonCredits}`}
                            placeholderTextColor={colors.textMuted}
                        />
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

                <View style={styles.revenueBox}>
                    <Text style={styles.revenueLabel}>Expected Total Revenue</Text>
                    <Text style={styles.revenueValue}>◎ {expectedRevenue.toFixed(4)} SOL</Text>
                    <Text style={styles.revenueUsd}>≈ ${solToUsd(expectedRevenue).toFixed(2)} USD</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Bottom Action */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.submitBtn, (isLoading || numAmount <= 0) && styles.disabledBtn]}
                    onPress={handleList}
                    disabled={isLoading || numAmount <= 0}
                    activeOpacity={0.8}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#000" size="small" />
                    ) : (
                        <LinearGradient colors={[colors.blue, '#2563eb']} style={styles.submitGradient}>
                            <Ionicons name="add-circle" size={20} color="#fff" />
                            <Text style={styles.submitText}>Create Listing</Text>
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
    card: {
        backgroundColor: colors.card, borderRadius: 16, padding: 16,
        marginBottom: 16, borderWidth: 1, borderColor: colors.border,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
    input: {
        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
        borderRadius: 12, padding: 14, fontSize: 15, color: colors.textPrimary, fontWeight: '500',
    },
    usdHint: { fontSize: 11, color: colors.textMuted, marginTop: 6, fontWeight: '500' },
    surplusInfo: {
        flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.greenBg,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)',
    },
    surplusText: { color: colors.green, fontSize: 13, fontWeight: '600' },
    revenueBox: {
        backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: 16, padding: 20,
        alignItems: 'center', borderWidth: 1, borderColor: 'rgba(37, 99, 235, 0.2)',
    },
    revenueLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
    revenueValue: { color: colors.blue, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    revenueUsd: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginTop: 4 },
    bottomBar: {
        padding: 16, paddingBottom: 32, backgroundColor: colors.card,
        borderTopWidth: 1, borderTopColor: colors.border,
    },
    submitBtn: { borderRadius: 16, overflow: 'hidden' },
    submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    disabledBtn: { opacity: 0.5 },
});
