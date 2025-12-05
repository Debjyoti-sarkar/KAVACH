import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, NexaVaultColors, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { createPaymentOrder } from "@/services/paymentGateway";

const RECENT_CONTACTS = [
  { id: "1", name: "Rahul Sharma", upiId: "rahul@upi", avatar: "R" },
  { id: "2", name: "Priya Patel", upiId: "priya@ybl", avatar: "P" },
  { id: "3", name: "Amit Kumar", upiId: "amit@paytm", avatar: "A" },
  { id: "4", name: "Sunita Devi", upiId: "sunita@okaxis", avatar: "S" },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ContactCard({
  contact,
  isSelected,
  onSelect,
}: {
  contact: typeof RECENT_CONTACTS[0];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onSelect}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      }}
      style={[
        styles.contactCard,
        {
          backgroundColor: isSelected ? NexaVaultColors.primary + "15" : theme.card,
          borderColor: isSelected ? NexaVaultColors.primary : theme.border,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: NexaVaultColors.primary + "30" }]}>
        <ThemedText style={[styles.avatarText, { color: NexaVaultColors.primary }]}>
          {contact.avatar}
        </ThemedText>
      </View>
      <View style={styles.contactInfo}>
        <ThemedText style={styles.contactName}>{contact.name}</ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {contact.upiId}
        </ThemedText>
      </View>
      {isSelected ? (
        <Feather name="check-circle" size={20} color={NexaVaultColors.primary} />
      ) : null}
    </AnimatedPressable>
  );
}

export default function SendMoneyScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "SendMoney">>();
  const { t } = useLanguage();

  const [recipient, setRecipient] = useState(route.params?.recipient || "");
  const [amount, setAmount] = useState(route.params?.amount || "");
  const [note, setNote] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleContactSelect = (contact: typeof RECENT_CONTACTS[0]) => {
    setSelectedContact(contact.id);
    setRecipient(contact.upiId);
  };

  const handleReviewPayment = () => {
    if (!recipient || !amount) {
      Alert.alert("Missing Information", "Please enter recipient and amount");
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmPayment = async () => {
    try {
      setIsProcessing(true);

      // Create payment order
      const paymentOrder = await createPaymentOrder(
        parseFloat(amount),
        recipient,
        note || undefined
      );

      // Navigate to payment processing screen
      navigation.navigate("PaymentProcessing", { paymentOrder });
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to initiate payment. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (showConfirmation) {
    return (
      <ScreenKeyboardAwareScrollView>
        <View style={styles.confirmationContainer}>
          <View style={[styles.confirmIcon, { backgroundColor: NexaVaultColors.primary + "15" }]}>
            <Feather name="send" size={48} color={NexaVaultColors.primary} />
          </View>

          <ThemedText type="h3" style={styles.confirmTitle}>
            Confirm Payment
          </ThemedText>

          <View style={[styles.confirmCard, { backgroundColor: theme.card }, Shadows.md]}>
            <View style={styles.confirmRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Sending to
              </ThemedText>
              <ThemedText style={styles.confirmValue}>{recipient}</ThemedText>
            </View>
            <View style={styles.confirmDivider} />
            <View style={styles.confirmRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Amount
              </ThemedText>
              <ThemedText type="h2" style={{ color: NexaVaultColors.primary }}>
                ₹ {parseFloat(amount).toLocaleString("en-IN")}
              </ThemedText>
            </View>
            {note ? (
              <>
                <View style={styles.confirmDivider} />
                <View style={styles.confirmRow}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Note
                  </ThemedText>
                  <ThemedText>{note}</ThemedText>
                </View>
              </>
            ) : null}
          </View>

          <View style={styles.confirmButtons}>
            <Button
              onPress={handleConfirmPayment}
              disabled={isProcessing}
              style={{ backgroundColor: NexaVaultColors.primary, flex: 1 }}
            >
              {isProcessing ? "Processing..." : t("confirm")}
            </Button>
            <Pressable
              onPress={() => setShowConfirmation(false)}
              disabled={isProcessing}
              style={[styles.cancelButton, { borderColor: theme.border }]}
            >
              <ThemedText>{t("cancel")}</ThemedText>
            </Pressable>
          </View>
        </View>
      </ScreenKeyboardAwareScrollView>
    );
  }

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Recent Contacts
        </ThemedText>
        <View style={styles.contactsGrid}>
          {RECENT_CONTACTS.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              isSelected={selectedContact === contact.id}
              onSelect={() => handleContactSelect(contact)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {t("recipientUpi")}
        </ThemedText>
        <View style={styles.inputContainer}>
          <Feather name="user" size={20} color={theme.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Enter UPI ID or phone number"
            placeholderTextColor={theme.textSecondary}
            value={recipient}
            onChangeText={setRecipient}
            autoCapitalize="none"
          />
        </View>

        <Pressable
          onPress={() => navigation.navigate("QRScanner")}
          style={[styles.qrButton, { borderColor: NexaVaultColors.primary }]}
        >
          <Feather name="camera" size={20} color={NexaVaultColors.primary} />
          <ThemedText style={{ color: NexaVaultColors.primary, marginLeft: Spacing.sm }}>
            Scan QR Code
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {t("amount")}
        </ThemedText>
        <View style={styles.amountContainer}>
          <ThemedText type="h1" style={styles.currencySymbol}>
            ₹
          </ThemedText>
          <TextInput
            style={[styles.amountInput, { color: theme.text }]}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {t("note")}
        </ThemedText>
        <TextInput
          style={[
            styles.noteInput,
            { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
          ]}
          placeholder="Add a note (optional)"
          placeholderTextColor={theme.textSecondary}
          value={note}
          onChangeText={setNote}
          multiline
        />
      </View>

      <Button
        onPress={handleReviewPayment}
        disabled={!recipient || !amount}
        style={{ backgroundColor: NexaVaultColors.primary, marginTop: Spacing.xl }}
      >
        {t("reviewPayment")}
      </Button>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contactsGrid: {
    gap: Spacing.sm,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontWeight: "500",
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: Spacing.lg,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 52,
    paddingLeft: Spacing["4xl"],
    paddingRight: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 16,
  },
  qrButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: Spacing.md,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  currencySymbol: {
    fontSize: 36,
    marginRight: Spacing.sm,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: "700",
    minWidth: 100,
    textAlign: "center",
  },
  noteInput: {
    height: 80,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 16,
    textAlignVertical: "top",
  },
  confirmationContainer: {
    alignItems: "center",
    paddingTop: Spacing["3xl"],
  },
  confirmIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  confirmTitle: {
    marginBottom: Spacing.xl,
  },
  confirmCard: {
    width: "100%",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  confirmRow: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  confirmValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  confirmDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: Spacing.lg,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
});
