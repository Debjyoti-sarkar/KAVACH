import React, { useState } from "react";
import { View, StyleSheet, Pressable, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { Spacing, BorderRadius, NexaVaultColors, Shadows } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";

type TransactionType = "sent" | "received" | "refund" | "failed";

interface Transaction {
  id: string;
  type: TransactionType;
  name: string;
  upiId: string;
  amount: number;
  date: string;
  time: string;
  status: "completed" | "pending" | "failed";
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    type: "sent",
    name: "Rahul Sharma",
    upiId: "rahul@upi",
    amount: 500,
    date: "Today",
    time: "2:30 PM",
    status: "completed",
  },
  {
    id: "2",
    type: "received",
    name: "Priya Patel",
    upiId: "priya@ybl",
    amount: 1200,
    date: "Today",
    time: "11:45 AM",
    status: "completed",
  },
  {
    id: "3",
    type: "sent",
    name: "Amit Kumar",
    upiId: "amit@paytm",
    amount: 850,
    date: "Yesterday",
    time: "6:15 PM",
    status: "completed",
  },
  {
    id: "4",
    type: "failed",
    name: "Electric Bill",
    upiId: "electricity@bbps",
    amount: 2100,
    date: "Yesterday",
    time: "3:00 PM",
    status: "failed",
  },
  {
    id: "5",
    type: "received",
    name: "Sunita Devi",
    upiId: "sunita@okaxis",
    amount: 3000,
    date: "Nov 25",
    time: "9:30 AM",
    status: "completed",
  },
  {
    id: "6",
    type: "refund",
    name: "Amazon Refund",
    upiId: "refund@amazon",
    amount: 499,
    date: "Nov 24",
    time: "4:20 PM",
    status: "completed",
  },
  {
    id: "7",
    type: "sent",
    name: "Mobile Recharge",
    upiId: "recharge@jio",
    amount: 299,
    date: "Nov 23",
    time: "10:00 AM",
    status: "completed",
  },
];

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const { theme } = useTheme();

  const getTypeIcon = (): keyof typeof Feather.glyphMap => {
    switch (transaction.type) {
      case "sent":
        return "arrow-up-right";
      case "received":
        return "arrow-down-left";
      case "refund":
        return "rotate-ccw";
      case "failed":
        return "x-circle";
    }
  };

  const getTypeColor = () => {
    switch (transaction.type) {
      case "sent":
        return NexaVaultColors.sos;
      case "received":
        return NexaVaultColors.success;
      case "refund":
        return NexaVaultColors.info;
      case "failed":
        return NexaVaultColors.textSecondary;
    }
  };

  const getAmountPrefix = () => {
    switch (transaction.type) {
      case "sent":
        return "-";
      case "received":
      case "refund":
        return "+";
      case "failed":
        return "";
    }
  };

  return (
    <Pressable
      style={[styles.transactionItem, { backgroundColor: theme.card }]}
    >
      <View style={[styles.transactionIcon, { backgroundColor: getTypeColor() + "20" }]}>
        <Feather name={getTypeIcon()} size={20} color={getTypeColor()} />
      </View>
      <View style={styles.transactionInfo}>
        <ThemedText style={styles.transactionName}>{transaction.name}</ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {transaction.upiId}
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {transaction.date} at {transaction.time}
        </ThemedText>
      </View>
      <View style={styles.transactionAmount}>
        <ThemedText
          style={[
            styles.amountText,
            { color: transaction.type === "sent" || transaction.type === "failed" ? theme.text : NexaVaultColors.success },
          ]}
        >
          {getAmountPrefix()}₹{transaction.amount.toLocaleString("en-IN")}
        </ThemedText>
        {transaction.status === "failed" ? (
          <ThemedText type="caption" style={{ color: NexaVaultColors.sos }}>
            Failed
          </ThemedText>
        ) : transaction.status === "pending" ? (
          <ThemedText type="caption" style={{ color: NexaVaultColors.warning }}>
            Pending
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function TransactionHistoryScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { paddingTop, paddingBottom } = useScreenInsets();
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");

  const filteredTransactions = MOCK_TRANSACTIONS.filter((tx) => {
    if (filter === "all") return true;
    if (filter === "sent") return tx.type === "sent";
    if (filter === "received") return tx.type === "received" || tx.type === "refund";
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop }]}>
        <View style={styles.filterRow}>
          <FilterButton
            label="All"
            isActive={filter === "all"}
            onPress={() => setFilter("all")}
            theme={theme}
          />
          <FilterButton
            label="Sent"
            isActive={filter === "sent"}
            onPress={() => setFilter("sent")}
            theme={theme}
          />
          <FilterButton
            label="Received"
            isActive={filter === "received"}
            onPress={() => setFilter("received")}
            theme={theme}
          />
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color={theme.textSecondary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              No transactions found
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

function FilterButton({
  label,
  isActive,
  onPress,
  theme,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  theme: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterButton,
        {
          backgroundColor: isActive ? NexaVaultColors.primary : theme.backgroundSecondary,
        },
      ]}
    >
      <ThemedText
        type="small"
        style={{ color: isActive ? "#FFFFFF" : theme.text, fontWeight: "500" }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
    gap: 2,
  },
  transactionName: {
    fontWeight: "500",
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
});
