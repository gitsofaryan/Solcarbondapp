import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

// ─── Indian Emission Factors (CEA / BEE 2024) ─────────────────────────────────
const EMISSION_FACTORS = {
    grid_kwh: 0.82,       // kg CO₂/kWh — Indian grid average
    petrol_litre: 2.31,   // kg CO₂/L
    diesel_litre: 2.68,   // kg CO₂/L
    lpg_kg: 2.98,         // kg CO₂/kg
    cng_kg: 2.21,         // kg CO₂/kg
    air_domestic_km: 0.255, // kg CO₂/km per passenger
    air_intl_km: 0.195,     // kg CO₂/km per passenger
    employee_services: 2.5, // tCO₂/employee/year (scope 3 estimate)
};

const INR_PER_CC = 1050; // ~$12.5 at 84 INR/USD

// ─── MSME Industry Types ──────────────────────────────────────────────────────
const INDUSTRIES = [
    { id: 'manufacturing', label: 'Manufacturing', icon: 'factory', multiplier: 1.4 },
    { id: 'it', label: 'IT & Services', icon: 'monitor', multiplier: 0.6 },
    { id: 'retail', label: 'Retail & Trade', icon: 'storefront', multiplier: 0.8 },
    { id: 'food', label: 'Food & Hospitality', icon: 'restaurant', multiplier: 1.1 },
    { id: 'healthcare', label: 'Healthcare', icon: 'medical', multiplier: 0.9 },
    { id: 'logistics', label: 'Transport & Logistics', icon: 'car', multiplier: 1.6 },
];

const EXPORT_MARKETS = [
    { id: 'eu', label: 'European Union', flag: '🇪🇺', cbam: true },
    { id: 'usa', label: 'United States', flag: '🇺🇸', cbam: false },
    { id: 'japan', label: 'Japan', flag: '🇯🇵', cbam: false },
    { id: 'singapore', label: 'Singapore', flag: '🇸🇬', cbam: false },
    { id: 'none', label: 'Domestic Only', flag: '🇮🇳', cbam: false },
];

// ─── Offset Presets ──────────────────────────────────────────────────────────
const OFFSET_PRESETS = [
    { label: '✈️  Delhi → Mumbai', sub: 'One-way flight', cc: 0.15 },
    { label: '✈️  Delhi → London', sub: 'International flight', cc: 0.82 },
    { label: '🚗  Monthly Commute', sub: '15 km/day petrol car', cc: 0.31 },
    { label: '💡  Monthly Electricity', sub: '500 kWh home usage', cc: 0.41 },
    { label: '🏭  Small Office/Year', sub: '10 employees, services', cc: 25.0 },
    { label: '🌱  Go Carbon Neutral', sub: 'Average Indian annual', cc: 1.9 },
];

// ─── Helper ──────────────────────────────────────────────────────────────────
function tonne(kgPerYear: number) {
    return kgPerYear / 1000;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export const ToolsScreen: React.FC = () => {
    const [activeSection, setActiveSection] = useState<'home' | 'msme' | 'brsr' | 'offset'>('home');

    // MSME Wizard state
    const [wizardStep, setWizardStep] = useState(0);
    const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
    const [electricity, setElectricity] = useState('');
    const [diesel, setDiesel] = useState('');
    const [petrol, setPetrol] = useState('');
    const [employees, setEmployees] = useState('');
    const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
    const [wizardResult, setWizardResult] = useState<any>(null);

    // BRSR Generator state
    const [brsrElec, setBrsrElec] = useState('');
    const [brsrDiesel, setBrsrDiesel] = useState('');
    const [brsrPetrol, setBrsrPetrol] = useState('');
    const [brsrEmployees, setBrsrEmployees] = useState('');
    const [brsrResult, setBrsrResult] = useState<any>(null);

    // Offset calculator
    const [customCC, setCustomCC] = useState('');
    const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

    // ── MSME Wizard Logic ──
    const computeWizardResult = () => {
        const industry = INDUSTRIES.find(i => i.id === selectedIndustry);
        const elecKwh = parseFloat(electricity) || 0;
        const dieselL = parseFloat(diesel) || 0;
        const petrolL = parseFloat(petrol) || 0;
        const emp = parseFloat(employees) || 0;

        const scope1_kg = (dieselL * EMISSION_FACTORS.diesel_litre + petrolL * EMISSION_FACTORS.petrol_litre) * 12;
        const scope2_kg = elecKwh * EMISSION_FACTORS.grid_kwh * 12;
        const scope3_t = emp * EMISSION_FACTORS.employee_services;

        const scope1_t = tonne(scope1_kg) * (industry?.multiplier ?? 1);
        const scope2_t = tonne(scope2_kg) * (industry?.multiplier ?? 1);
        const total_t = scope1_t + scope2_t + scope3_t;
        const cc_needed = Math.ceil(total_t);
        const cost_inr = cc_needed * INR_PER_CC;

        const hasCBAM = selectedMarkets.some(m => EXPORT_MARKETS.find(e => e.id === m)?.cbam);

        setWizardResult({
            scope1: scope1_t.toFixed(2),
            scope2: scope2_t.toFixed(2),
            scope3: scope3_t.toFixed(2),
            total: total_t.toFixed(2),
            cc_needed,
            cost_inr,
            hasCBAM,
            industry: industry?.label ?? 'Business',
        });
        setWizardStep(5);
    };

    // ── BRSR Logic ──
    const computeBRSR = () => {
        const elec = parseFloat(brsrElec) || 0;
        const diesel_ = parseFloat(brsrDiesel) || 0;
        const petrol_ = parseFloat(brsrPetrol) || 0;
        const emp = parseFloat(brsrEmployees) || 0;

        const scope1 = tonne((diesel_ * EMISSION_FACTORS.diesel_litre + petrol_ * EMISSION_FACTORS.petrol_litre) * 12);
        const scope2 = tonne(elec * EMISSION_FACTORS.grid_kwh * 12);
        const scope3 = emp * EMISSION_FACTORS.employee_services;
        const total = scope1 + scope2 + scope3;

        setBrsrResult({
            scope1: scope1.toFixed(2), scope2: scope2.toFixed(2), scope3: scope3.toFixed(2),
            total: total.toFixed(2),
            intensity: emp > 0 ? (total / emp).toFixed(2) : '—',
            fy: '2024–25',
            elec_kwh: (elec * 12).toFixed(0),
            elec_renew_pct: '0',
        });
    };

    // ─── HOME ─────────────────────────────────────────────────────────────────
    if (activeSection === 'home') {
        return (
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <Text style={styles.pageTitle}>Tools & Insights</Text>
                <Text style={styles.pageSubtitle}>India-first carbon compliance tools</Text>

                {/* Phase 1: Offset Calculator */}
                <TouchableOpacity activeOpacity={0.88} onPress={() => setActiveSection('offset')}>
                    <LinearGradient colors={['#064e3b', '#022c22']} style={styles.toolCard}>
                        <View style={styles.toolCardBadge}>
                            <Text style={styles.toolCardBadgeText}>Phase 1</Text>
                        </View>
                        <View style={styles.toolCardIcon}>
                            <Ionicons name="calculator" size={28} color={colors.green} />
                        </View>
                        <Text style={styles.toolCardTitle}>Fractional Offset Calculator</Text>
                        <Text style={styles.toolCardDesc}>
                            Calculate your carbon footprint for flights, commutes, and electricity — then offset as little as 0.1 CC (≈ ₹105)
                        </Text>
                        <View style={styles.toolCardFooter}>
                            <Text style={styles.toolCardFooterText}>Min. 0.1 CC · Prices in ₹ &amp; $</Text>
                            <Ionicons name="arrow-forward" size={16} color={colors.green} />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Phase 2a: MSME Wizard */}
                <TouchableOpacity activeOpacity={0.88} onPress={() => { setWizardStep(0); setWizardResult(null); setActiveSection('msme'); }}>
                    <LinearGradient colors={['#1e3a5f', '#0a1628']} style={styles.toolCard}>
                        <View style={[styles.toolCardBadge, { backgroundColor: 'rgba(96,165,250,0.15)', borderColor: colors.blue + '40' }]}>
                            <Text style={[styles.toolCardBadgeText, { color: colors.blue }]}>Phase 2</Text>
                        </View>
                        <View style={[styles.toolCardIcon, { backgroundColor: colors.blueBg }]}>
                            <Ionicons name="business" size={28} color={colors.blue} />
                        </View>
                        <Text style={styles.toolCardTitle}>MSME Carbon Wizard</Text>
                        <Text style={styles.toolCardDesc}>
                            5-question audit for your business. Get Scope 1, 2 &amp; 3 emissions and an offset bundle — ready for export buyers &amp; BEE compliance.
                        </Text>
                        <View style={styles.toolCardFooter}>
                            <Text style={[styles.toolCardFooterText, { color: colors.blue }]}>63M MSMEs · BEE · EU CBAM ready</Text>
                            <Ionicons name="arrow-forward" size={16} color={colors.blue} />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Phase 2b: BRSR Generator */}
                <TouchableOpacity activeOpacity={0.88} onPress={() => { setBrsrResult(null); setActiveSection('brsr'); }}>
                    <LinearGradient colors={['#3b1f5e', '#180d2e']} style={styles.toolCard}>
                        <View style={[styles.toolCardBadge, { backgroundColor: 'rgba(167,139,250,0.15)', borderColor: '#a78bfa40' }]}>
                            <Text style={[styles.toolCardBadgeText, { color: '#a78bfa' }]}>Phase 2</Text>
                        </View>
                        <View style={[styles.toolCardIcon, { backgroundColor: 'rgba(167,139,250,0.1)' }]}>
                            <MaterialCommunityIcons name="file-chart" size={28} color="#a78bfa" />
                        </View>
                        <Text style={styles.toolCardTitle}>BRSR Report Generator</Text>
                        <Text style={styles.toolCardDesc}>
                            Auto-generate SEBI BRSR Section A &amp; C using your electricity bills and fuel data. Indian emission factors pre-loaded.
                        </Text>
                        <View style={styles.toolCardFooter}>
                            <Text style={[styles.toolCardFooterText, { color: '#a78bfa' }]}>SEBI mandated · Top 1000 cos.</Text>
                            <Ionicons name="arrow-forward" size={16} color="#a78bfa" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* India Carbon Market Info */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>🇮🇳 India Carbon Market 2025</Text>
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoValue}>₹1,050</Text>
                            <Text style={styles.infoLabel}>Avg CC Price</Text>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoItem}>
                            <Text style={styles.infoValue}>0.82</Text>
                            <Text style={styles.infoLabel}>Grid Factor kg/kWh</Text>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoItem}>
                            <Text style={styles.infoValue}>63M</Text>
                            <Text style={styles.infoLabel}>MSMEs Impacted</Text>
                        </View>
                    </View>
                    <Text style={styles.infoCite}>Source: BEE, CEA, SEBI 2024</Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        );
    }

    // ─── OFFSET CALCULATOR ────────────────────────────────────────────────────
    if (activeSection === 'offset') {
        const ccAmount = selectedPreset !== null
            ? OFFSET_PRESETS[selectedPreset].cc
            : parseFloat(customCC) || 0;
        const totalINR = (ccAmount * INR_PER_CC).toFixed(0);
        const totalUSD = (ccAmount * 12.5).toFixed(2);

        return (
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => setActiveSection('home')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
                    <Text style={styles.backText}>Tools</Text>
                </TouchableOpacity>

                <Text style={styles.pageTitle}>Fractional Offset</Text>
                <Text style={styles.pageSubtitle}>Buy as little as 0.1 CC · Prices shown in ₹</Text>

                {/* Quick Offset Presets */}
                <Text style={styles.sectionLabel}>Quick Offset Presets</Text>
                {OFFSET_PRESETS.map((preset, i) => (
                    <TouchableOpacity
                        key={i}
                        activeOpacity={0.85}
                        style={[styles.presetRow, selectedPreset === i && styles.presetRowActive]}
                        onPress={() => { setSelectedPreset(i); setCustomCC(''); }}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={styles.presetLabel}>{preset.label}</Text>
                            <Text style={styles.presetSub}>{preset.sub}</Text>
                        </View>
                        <View style={styles.presetRight}>
                            <Text style={styles.presetCC}>{preset.cc} CC</Text>
                            <Text style={styles.presetINR}>≈ ₹{(preset.cc * INR_PER_CC).toFixed(0)}</Text>
                        </View>
                        {selectedPreset === i && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.green} style={{ marginLeft: 8 }} />
                        )}
                    </TouchableOpacity>
                ))}

                {/* Custom Amount */}
                <Text style={styles.sectionLabel}>Or Enter Custom Amount</Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        value={customCC}
                        onChangeText={t => { setCustomCC(t); setSelectedPreset(null); }}
                        keyboardType="decimal-pad"
                        placeholder="e.g. 2.5"
                        placeholderTextColor={colors.textMuted}
                    />
                    <Text style={styles.inputUnit}>CC</Text>
                </View>
                <Text style={styles.inputHint}>Minimum 0.1 CC · 1 CC = 1 tonne CO₂ offset</Text>

                {/* Cost Summary */}
                {ccAmount > 0 && (
                    <LinearGradient colors={['#064e3b', '#022c22']} style={styles.costCard}>
                        <Text style={styles.costLabel}>Offset Cost</Text>
                        <Text style={styles.costINR}>₹{totalINR}</Text>
                        <Text style={styles.costUSD}>≈ ${totalUSD} USD</Text>
                        <View style={styles.costRow}>
                            <View style={styles.costPill}>
                                <Ionicons name="leaf" size={12} color={colors.green} />
                                <Text style={styles.costPillText}>{ccAmount} CC</Text>
                            </View>
                            <View style={styles.costPill}>
                                <Ionicons name="cloud" size={12} color={colors.green} />
                                <Text style={styles.costPillText}>{ccAmount} tCO₂ offset</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.buyBtn}
                            activeOpacity={0.85}
                            onPress={() => Alert.alert(
                                '✅ Offset Initiated (Demo)',
                                `This would purchase ${ccAmount} CC (~₹${totalINR}) from the cheapest verified Indian project and permanently retire them on-chain.\n\nIn production, this connects to your Phantom wallet.`,
                            )}
                        >
                            <Text style={styles.buyBtnText}>Offset {ccAmount} CC Now →</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        );
    }

    // ─── MSME WIZARD ─────────────────────────────────────────────────────────
    if (activeSection === 'msme') {
        const totalSteps = 5;
        const progress = wizardStep / totalSteps;

        // Result Screen
        if (wizardResult) {
            return (
                <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity onPress={() => { setActiveSection('home'); setWizardStep(0); setWizardResult(null); }} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
                        <Text style={styles.backText}>Tools</Text>
                    </TouchableOpacity>

                    <LinearGradient colors={['#064e3b', '#022c22']} style={styles.resultHeader}>
                        <MaterialCommunityIcons name="check-decagram" size={44} color={colors.green} />
                        <Text style={styles.resultTitle}>Your Carbon Audit</Text>
                        <Text style={styles.resultSub}>{wizardResult.industry} · Annual estimate</Text>
                    </LinearGradient>

                    {/* Scope Breakdown */}
                    <View style={styles.scopeCard}>
                        <Text style={styles.scopeTitle}>Emissions Breakdown</Text>
                        {[
                            { label: 'Scope 1 — Direct (fuel)', val: wizardResult.scope1, color: colors.amber, icon: 'flame' },
                            { label: 'Scope 2 — Electricity', val: wizardResult.scope2, color: colors.blue, icon: 'flash' },
                            { label: 'Scope 3 — Value Chain', val: wizardResult.scope3, color: '#a78bfa', icon: 'people' },
                        ].map((s, i) => (
                            <View key={i} style={styles.scopeRow}>
                                <View style={[styles.scopeIcon, { backgroundColor: s.color + '18' }]}>
                                    <Ionicons name={s.icon as any} size={16} color={s.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.scopeLabel}>{s.label}</Text>
                                    <View style={styles.progressBar}>
                                        <View style={[styles.progressFill, {
                                            width: `${Math.min((parseFloat(s.val) / parseFloat(wizardResult.total)) * 100, 100)}%`,
                                            backgroundColor: s.color,
                                        }]} />
                                    </View>
                                </View>
                                <Text style={[styles.scopeVal, { color: s.color }]}>{s.val} t</Text>
                            </View>
                        ))}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Annual Footprint</Text>
                            <Text style={styles.totalVal}>{wizardResult.total} tCO₂</Text>
                        </View>
                    </View>

                    {/* Offset Packages */}
                    <Text style={styles.sectionLabel}>Recommended Offset Packages</Text>
                    {[
                        { label: '🥉 Bronze — Partial Offset', pct: 0.33, color: '#cd7f32' },
                        { label: '🥈 Silver — Half Offset', pct: 0.5, color: colors.textSecondary },
                        { label: '🥇 Gold — Full Carbon Neutral', pct: 1.0, color: colors.amber },
                    ].map((pkg, i) => {
                        const cc = Math.ceil(wizardResult.cc_needed * pkg.pct);
                        const inr = cc * INR_PER_CC;
                        return (
                            <TouchableOpacity
                                key={i}
                                style={styles.pkgCard}
                                activeOpacity={0.85}
                                onPress={() => Alert.alert(`${pkg.label} (Demo)`, `Purchase ${cc} CC for ₹${inr.toLocaleString()}\n\nIn production this routes to the marketplace with the amount pre-filled.`)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.pkgLabel}>{pkg.label}</Text>
                                    <Text style={styles.pkgSub}>{cc} CC · {Math.round(pkg.pct * 100)}% offset</Text>
                                </View>
                                <View>
                                    <Text style={[styles.pkgINR, { color: pkg.color }]}>₹{inr.toLocaleString()}</Text>
                                    <Text style={styles.pkgUSD}>≈ ${(inr / 84).toFixed(0)}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    {/* CBAM Alert */}
                    {wizardResult.hasCBAM && (
                        <View style={styles.cbamAlert}>
                            <Ionicons name="alert-circle" size={20} color={colors.amber} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cbamTitle}>EU CBAM Compliance Required</Text>
                                <Text style={styles.cbamText}>
                                    You export to the EU. The Carbon Border Adjustment Mechanism requires you to report and purchase carbon certificates from 2026 onwards.
                                </Text>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity style={styles.restartBtn} onPress={() => { setWizardStep(0); setWizardResult(null); setSelectedIndustry(null); setElectricity(''); setDiesel(''); setPetrol(''); setEmployees(''); setSelectedMarkets([]); }}>
                        <Text style={styles.restartBtnText}>Start New Audit</Text>
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </ScrollView>
            );
        }

        return (
            <View style={styles.container}>
                {/* Progress Header */}
                <View style={styles.wizardHeader}>
                    <TouchableOpacity onPress={() => wizardStep === 0 ? setActiveSection('home') : setWizardStep(s => s - 1)} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.blue }]} />
                        </View>
                        <Text style={styles.wizardStepText}>Step {wizardStep + 1} of {totalSteps}</Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, paddingHorizontal: 16 }}>

                    {/* Step 0: Industry */}
                    {wizardStep === 0 && (
                        <View>
                            <Text style={styles.wizardQ}>What type of business are you?</Text>
                            <Text style={styles.wizardHint}>This sets your baseline emission intensity</Text>
                            {INDUSTRIES.map(ind => (
                                <TouchableOpacity
                                    key={ind.id}
                                    style={[styles.optionCard, selectedIndustry === ind.id && styles.optionCardActive]}
                                    onPress={() => setSelectedIndustry(ind.id)}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons name={ind.icon as any} size={22} color={selectedIndustry === ind.id ? colors.blue : colors.textMuted} />
                                    <Text style={[styles.optionLabel, selectedIndustry === ind.id && { color: colors.blue }]}>{ind.label}</Text>
                                    {selectedIndustry === ind.id && <Ionicons name="checkmark-circle" size={20} color={colors.blue} />}
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={[styles.nextBtn, !selectedIndustry && styles.nextBtnDisabled]}
                                disabled={!selectedIndustry}
                                onPress={() => setWizardStep(1)}
                            >
                                <Text style={styles.nextBtnText}>Next →</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Step 1: Energy */}
                    {wizardStep === 1 && (
                        <View>
                            <Text style={styles.wizardQ}>Monthly Energy Consumption</Text>
                            <Text style={styles.wizardHint}>Check your electricity bill for total kWh. Diesel &amp; petrol in litres.</Text>

                            <Text style={styles.inputLabel}>⚡ Electricity (kWh/month)</Text>
                            <TextInput style={styles.input} value={electricity} onChangeText={setElectricity} keyboardType="decimal-pad" placeholder="e.g. 2500" placeholderTextColor={colors.textMuted} />

                            <Text style={styles.inputLabel}>⛽ Diesel (litres/month)</Text>
                            <TextInput style={styles.input} value={diesel} onChangeText={setDiesel} keyboardType="decimal-pad" placeholder="e.g. 200" placeholderTextColor={colors.textMuted} />

                            <Text style={styles.inputLabel}>🛢️ Petrol (litres/month)</Text>
                            <TextInput style={styles.input} value={petrol} onChangeText={setPetrol} keyboardType="decimal-pad" placeholder="e.g. 100" placeholderTextColor={colors.textMuted} />

                            <View style={styles.factorNote}>
                                <Ionicons name="information-circle" size={14} color={colors.textMuted} />
                                <Text style={styles.factorNoteText}>Indian Grid Factor: 0.82 kg CO₂/kWh (BEE 2024)</Text>
                            </View>
                            <TouchableOpacity style={styles.nextBtn} onPress={() => setWizardStep(2)}>
                                <Text style={styles.nextBtnText}>Next →</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Step 2: Employees */}
                    {wizardStep === 2 && (
                        <View>
                            <Text style={styles.wizardQ}>How many employees?</Text>
                            <Text style={styles.wizardHint}>Used to estimate Scope 3 value chain emissions.</Text>
                            <TextInput style={styles.input} value={employees} onChangeText={setEmployees} keyboardType="number-pad" placeholder="e.g. 45" placeholderTextColor={colors.textMuted} />
                            <View style={styles.factorNote}>
                                <Ionicons name="information-circle" size={14} color={colors.textMuted} />
                                <Text style={styles.factorNoteText}>Scope 3 estimate: 2.5 tCO₂/employee/year (services average)</Text>
                            </View>
                            <TouchableOpacity style={[styles.nextBtn, !employees && styles.nextBtnDisabled]} disabled={!employees} onPress={() => setWizardStep(3)}>
                                <Text style={styles.nextBtnText}>Next →</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Step 3: Export Markets */}
                    {wizardStep === 3 && (
                        <View>
                            <Text style={styles.wizardQ}>Where do you export to?</Text>
                            <Text style={styles.wizardHint}>We check EU CBAM applicability and premium credit eligibility.</Text>
                            {EXPORT_MARKETS.map(m => {
                                const selected = selectedMarkets.includes(m.id);
                                return (
                                    <TouchableOpacity
                                        key={m.id}
                                        style={[styles.optionCard, selected && styles.optionCardActive]}
                                        onPress={() => setSelectedMarkets(prev =>
                                            prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id]
                                        )}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={styles.optionFlag}>{m.flag}</Text>
                                        <Text style={[styles.optionLabel, selected && { color: colors.blue }]}>{m.label}</Text>
                                        {m.cbam && <View style={styles.cbamChip}><Text style={styles.cbamChipText}>CBAM</Text></View>}
                                        {selected && <Ionicons name="checkmark-circle" size={20} color={colors.blue} />}
                                    </TouchableOpacity>
                                );
                            })}
                            <TouchableOpacity style={[styles.nextBtn, selectedMarkets.length === 0 && styles.nextBtnDisabled]} disabled={selectedMarkets.length === 0} onPress={() => setWizardStep(4)}>
                                <Text style={styles.nextBtnText}>Next →</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Step 4: Review & Calculate */}
                    {wizardStep === 4 && (
                        <View>
                            <Text style={styles.wizardQ}>Ready to calculate your footprint!</Text>
                            <Text style={styles.wizardHint}>Here's what we'll compute:</Text>
                            {[
                                { label: 'Industry', val: INDUSTRIES.find(i => i.id === selectedIndustry)?.label },
                                { label: 'Electricity', val: `${electricity || 0} kWh/month` },
                                { label: 'Diesel', val: `${diesel || 0} L/month` },
                                { label: 'Petrol', val: `${petrol || 0} L/month` },
                                { label: 'Employees', val: employees },
                                { label: 'Export Markets', val: selectedMarkets.map(id => EXPORT_MARKETS.find(m => m.id === id)?.label).join(', ') || 'None' },
                            ].map((row, i) => (
                                <View key={i} style={styles.reviewRow}>
                                    <Text style={styles.reviewLabel}>{row.label}</Text>
                                    <Text style={styles.reviewVal}>{row.val}</Text>
                                </View>
                            ))}
                            <TouchableOpacity style={styles.nextBtn} onPress={computeWizardResult}>
                                <Text style={styles.nextBtnText}>Calculate Footprint 🌿</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            </View>
        );
    }

    // ─── BRSR GENERATOR ──────────────────────────────────────────────────────
    if (activeSection === 'brsr') {
        return (
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => setActiveSection('home')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
                    <Text style={styles.backText}>Tools</Text>
                </TouchableOpacity>

                <Text style={styles.pageTitle}>BRSR Report Generator</Text>
                <Text style={styles.pageSubtitle}>SEBI BRSR Section A &amp; C · FY 2024–25</Text>

                <View style={styles.brsrInputCard}>
                    <Text style={styles.brsrInputTitle}>Annual Input Data</Text>
                    <Text style={styles.inputLabel}>⚡ Electricity consumed (kWh/month)</Text>
                    <TextInput style={styles.input} value={brsrElec} onChangeText={setBrsrElec} keyboardType="decimal-pad" placeholder="e.g. 15000" placeholderTextColor={colors.textMuted} />
                    <Text style={styles.inputLabel}>⛽ Diesel used (litres/month)</Text>
                    <TextInput style={styles.input} value={brsrDiesel} onChangeText={setBrsrDiesel} keyboardType="decimal-pad" placeholder="e.g. 500" placeholderTextColor={colors.textMuted} />
                    <Text style={styles.inputLabel}>🛢️ Petrol used (litres/month)</Text>
                    <TextInput style={styles.input} value={brsrPetrol} onChangeText={setBrsrPetrol} keyboardType="decimal-pad" placeholder="e.g. 200" placeholderTextColor={colors.textMuted} />
                    <Text style={styles.inputLabel}>👥 Total employees</Text>
                    <TextInput style={styles.input} value={brsrEmployees} onChangeText={setBrsrEmployees} keyboardType="number-pad" placeholder="e.g. 250" placeholderTextColor={colors.textMuted} />

                    <TouchableOpacity style={styles.nextBtn} onPress={computeBRSR}>
                        <Text style={styles.nextBtnText}>Generate BRSR Report →</Text>
                    </TouchableOpacity>
                </View>

                {brsrResult && (
                    <View>
                        {/* Report Header */}
                        <LinearGradient colors={['#1e1b4b', '#0d0b26']} style={styles.brsrHeader}>
                            <MaterialCommunityIcons name="file-chart-outline" size={32} color="#a78bfa" />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.brsrHeaderTitle}>BRSR — Section C · Principle 6</Text>
                                <Text style={styles.brsrHeaderSub}>Environmental Responsibility · FY {brsrResult.fy}</Text>
                                <Text style={styles.brsrHeaderSub}>As per SEBI LODR Amendment 2021</Text>
                            </View>
                        </LinearGradient>

                        {/* Scope Table */}
                        <View style={styles.brsrTable}>
                            <View style={styles.brsrTableHeader}>
                                <Text style={[styles.brsrCell, styles.brsrCellHeader, { flex: 2 }]}>Emission Category</Text>
                                <Text style={[styles.brsrCell, styles.brsrCellHeader]}>tCO₂e</Text>
                            </View>
                            {[
                                { label: 'Scope 1 — Direct Emissions', val: brsrResult.scope1, color: colors.amber },
                                { label: 'Scope 2 — Energy Indirect', val: brsrResult.scope2, color: colors.blue },
                                { label: 'Scope 3 — Other Indirect', val: brsrResult.scope3, color: '#a78bfa' },
                                { label: 'TOTAL GHG Emissions', val: brsrResult.total, color: colors.green, bold: true },
                            ].map((row, i) => (
                                <View key={i} style={[styles.brsrTableRow, i % 2 === 0 && styles.brsrTableRowAlt]}>
                                    <Text style={[styles.brsrCell, { flex: 2, color: row.bold ? colors.textPrimary : colors.textSecondary, fontWeight: row.bold ? '700' : '500' }]}>{row.label}</Text>
                                    <Text style={[styles.brsrCell, { color: row.color, fontWeight: '700' }]}>{row.val}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Energy Table */}
                        <View style={styles.brsrTable}>
                            <View style={styles.brsrTableHeader}>
                                <Text style={[styles.brsrCell, styles.brsrCellHeader, { flex: 2 }]}>Energy Parameter</Text>
                                <Text style={[styles.brsrCell, styles.brsrCellHeader]}>Value</Text>
                            </View>
                            {[
                                { label: 'Total electricity consumed (kWh)', val: brsrResult.elec_kwh },
                                { label: 'Renewable energy %', val: `${brsrResult.elec_renew_pct}%` },
                                { label: 'Emission intensity (tCO₂/employee)', val: brsrResult.intensity },
                            ].map((row, i) => (
                                <View key={i} style={[styles.brsrTableRow, i % 2 === 0 && styles.brsrTableRowAlt]}>
                                    <Text style={[styles.brsrCell, { flex: 2, color: colors.textSecondary, fontWeight: '500' }]}>{row.label}</Text>
                                    <Text style={[styles.brsrCell, { color: colors.textPrimary, fontWeight: '700' }]}>{row.val}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Methodology Note */}
                        <View style={styles.methodNote}>
                            <Text style={styles.methodNoteTitle}>Methodology &amp; Emission Factors</Text>
                            <Text style={styles.methodNoteText}>
                                • Grid electricity: 0.82 kg CO₂/kWh (CEA 2023–24){'\n'}
                                • Diesel: 2.68 kg CO₂/L · Petrol: 2.31 kg CO₂/L{'\n'}
                                • Scope 3: GHG Protocol Corporate Standard{'\n'}
                                • Reporting boundary: Operational control approach
                            </Text>
                        </View>

                        {/* Download Button */}
                        <TouchableOpacity
                            style={styles.downloadBtn}
                            activeOpacity={0.85}
                            onPress={() => Alert.alert('📄 Export (Demo)', 'In production, this exports a SEBI-formatted PDF including all tables, methodology notes, and your SolCarbon retirement certificates as proof of offset.\n\nComing in Phase 3.')}
                        >
                            <Ionicons name="download" size={18} color="#a78bfa" />
                            <Text style={styles.downloadBtnText}>Export BRSR PDF (Demo)</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        );
    }

    return null;
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16, paddingTop: 4 },
    pageTitle: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5, marginTop: 4 },
    pageSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 20 },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 16 },
    backText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20, marginBottom: 10 },

    // Tool Cards
    toolCard: { borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(16,185,129,0.12)' },
    toolCardBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)', marginBottom: 12 },
    toolCardBadgeText: { fontSize: 10, fontWeight: '800', color: colors.green, textTransform: 'uppercase', letterSpacing: 0.5 },
    toolCardIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.greenBg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    toolCardTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 6, letterSpacing: -0.3 },
    toolCardDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 },
    toolCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    toolCardFooterText: { fontSize: 11, fontWeight: '600', color: colors.green },

    // Info Card
    infoCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 4 },
    infoTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 14 },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    infoItem: { flex: 1, alignItems: 'center' },
    infoValue: { fontSize: 16, fontWeight: '800', color: colors.green },
    infoLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
    infoDivider: { width: 1, height: 30, backgroundColor: colors.border },
    infoCite: { fontSize: 10, color: colors.textMuted, marginTop: 10, textAlign: 'right' },

    // Offset presets
    presetRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    presetRowActive: { borderColor: colors.green, backgroundColor: 'rgba(16,185,129,0.05)' },
    presetLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
    presetSub: { fontSize: 11, color: colors.textMuted },
    presetRight: { alignItems: 'flex-end', marginRight: 4 },
    presetCC: { fontSize: 13, fontWeight: '800', color: colors.green },
    presetINR: { fontSize: 11, color: colors.textMuted },

    // Input
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    input: { flex: 1, backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
    inputUnit: { fontSize: 14, fontWeight: '700', color: colors.textMuted, marginBottom: 8 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 12 },
    inputHint: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
    factorNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 4 },
    factorNoteText: { fontSize: 11, color: colors.textMuted },

    // Cost Card
    costCard: { borderRadius: 20, padding: 20, marginTop: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
    costLabel: { fontSize: 11, fontWeight: '700', color: colors.green, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    costINR: { fontSize: 36, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 },
    costUSD: { fontSize: 14, color: colors.textMuted, marginBottom: 12 },
    costRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    costPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.greenBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    costPillText: { fontSize: 12, fontWeight: '700', color: colors.green },
    buyBtn: { backgroundColor: colors.green, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, width: '100%', alignItems: 'center' },
    buyBtnText: { fontSize: 15, fontWeight: '800', color: '#000' },

    // MSME Wizard
    wizardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    wizardQ: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3, marginBottom: 6, marginTop: 4 },
    wizardHint: { fontSize: 13, color: colors.textMuted, marginBottom: 20, lineHeight: 18 },
    wizardStepText: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
    optionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    optionCardActive: { borderColor: colors.blue, backgroundColor: 'rgba(96,165,250,0.06)' },
    optionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    optionFlag: { fontSize: 22 },
    cbamChip: { backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: colors.amber + '40' },
    cbamChipText: { fontSize: 9, fontWeight: '800', color: colors.amber },
    nextBtn: { backgroundColor: colors.blue, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
    nextBtnDisabled: { backgroundColor: colors.border },
    nextBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
    reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    reviewLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
    reviewVal: { fontSize: 13, color: colors.textPrimary, fontWeight: '700', maxWidth: '55%', textAlign: 'right' },

    // Progress
    progressTrack: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
    progressBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginTop: 6 },
    progressFill: { height: '100%', borderRadius: 3 },

    // Result
    resultHeader: { borderRadius: 20, padding: 24, alignItems: 'center', gap: 6, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
    resultTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3, marginTop: 8 },
    resultSub: { fontSize: 13, color: colors.textMuted },
    scopeCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
    scopeTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 14 },
    scopeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    scopeIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    scopeLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
    scopeVal: { fontSize: 14, fontWeight: '800', minWidth: 50, textAlign: 'right' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 },
    totalLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    totalVal: { fontSize: 18, fontWeight: '800', color: colors.green },
    pkgCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    pkgLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 3 },
    pkgSub: { fontSize: 12, color: colors.textMuted },
    pkgINR: { fontSize: 16, fontWeight: '800', textAlign: 'right' },
    pkgUSD: { fontSize: 10, color: colors.textMuted, textAlign: 'right', marginTop: 2 },
    cbamAlert: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.amber + '30', marginVertical: 12 },
    cbamTitle: { fontSize: 13, fontWeight: '700', color: colors.amber, marginBottom: 4 },
    cbamText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
    restartBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
    restartBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },

    // BRSR
    brsrInputCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
    brsrInputTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
    brsrHeader: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#a78bfa20' },
    brsrHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#a78bfa' },
    brsrHeaderSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    brsrTable: { backgroundColor: colors.card, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    brsrTableHeader: { flexDirection: 'row', backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    brsrTableRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12 },
    brsrTableRowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
    brsrCell: { flex: 1, fontSize: 12, color: colors.textMuted },
    brsrCellHeader: { fontWeight: '700', color: colors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 },
    methodNote: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    methodNoteTitle: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 },
    methodNoteText: { fontSize: 11, color: colors.textMuted, lineHeight: 18 },
    downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.08)', marginBottom: 8 },
    downloadBtnText: { fontSize: 14, fontWeight: '700', color: '#a78bfa' },
});
