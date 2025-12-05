// screens/VoiceAssistantScreen.tsx
import React, { useRef, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import * as Speech from 'expo-speech';
import { useNavigation } from '@react-navigation/native';
import { VoiceRecorder, VoiceRecorderHandle } from "../components/VoiceRecorder";
import { AssistantInput } from "../components/AssistantInput";
import { TestConnection } from "../components/TestConnection";
import { parseText, ParseResponse } from "../services/assistant";
import { useTheme } from "../hooks/useTheme";

// Helper to get colors with fallbacks
const getColors = (theme: any) => ({
  ...theme,
  background: theme.backgroundRoot || theme.background || '#F5F1E8',
  textSecondary: theme.textSecondary || '#888',
});

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  intent?: string;
  action?: string;
}

export default function VoiceAssistantScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const recorderRef = useRef<VoiceRecorderHandle | null>(null);
  
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: "Hello! I'm your payment assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);

  // Add a message to the chat
  const addMessage = useCallback((text: string, isUser: boolean, intent?: string, action?: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
      intent,
      action,
    }]);
  }, []);

  // Process text through backend NLU and handle response
  const processText = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message
    addMessage(text, true);
    setIsProcessing(true);

    try {
      const response: ParseResponse = await parseText(text);
      
      // Add assistant response
      addMessage(
        response.replyText || "I understood your request.",
        false,
        response.intent,
        response.actionSuggested
      );

      // Speak the reply
      if (response.replyText) {
        Speech.speak(response.replyText, {
          language: 'en',
          pitch: 1.0,
          rate: 0.9,
        });
      }

      // Handle navigation based on action
      handleAction(response.actionSuggested, response.entities);

    } catch (error) {
      console.error("Error processing text:", error);
      const errorMsg = "Sorry, I couldn't process your request. Please try again.";
      addMessage(errorMsg, false);
      Speech.speak(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  }, [addMessage]);

  // Handle actions based on intent
  const handleAction = (action: string, entities?: Record<string, any>) => {
    switch (action) {
      case 'open_contact':
        // Navigate to send money with contact pre-filled
        Alert.alert(
          'Open Contact',
          'Would you like to send money to this contact?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Send Money', 
              onPress: () => navigation.navigate('SendMoney', { contact: entities?.contact })
            }
          ]
        );
        break;

      case 'prefill_and_navigate_upi':
        // Navigate to UPI payment with amount pre-filled
        const amount = entities?.amount;
        const recipient = entities?.recipient;
        navigation.navigate('SendMoney', { 
          amount: amount,
          recipient: recipient,
          paymentMethod: 'UPI'
        });
        break;

      case 'help_support_page':
        // Navigate to help/settings
        navigation.navigate('Settings');
        break;

      case 'ask_pin_for_balance':
        // Navigate to balance screen
        navigation.navigate('Balance');
        break;

      case 'show_history':
        // Navigate to transaction history
        navigation.navigate('TransactionHistory');
        break;

      case 'scan_qr':
        // Navigate to QR scanner
        navigation.navigate('QRScanner');
        break;

      case 'check_fraud':
        // Navigate to fraud scanner
        navigation.navigate('FraudScan');
        break;

      default:
        // No specific action needed
        console.log('No action to perform for:', action);
        break;
    }
  };

  // Handle send button press
  const handleSend = useCallback(() => {
    if (inputText.trim()) {
      processText(inputText.trim());
      setInputText("");
    }
  }, [inputText, processText]);

  // Handle transcribed text from voice recorder
  const handleTranscribed = useCallback((text: string) => {
    if (text.trim()) {
      processText(text.trim());
    } else {
      Alert.alert("Couldn't hear you", "Please try speaking again.");
    }
    setIsProcessing(false);
  }, [processText]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundRoot || colors.background || '#F5F1E8' }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Voice Assistant</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary || '#888' }]}>
            Speak or type your request
          </Text>
        </View>

        {/* Connection Test */}
        <TestConnection />

        {/* Messages List */}
        <ScrollView 
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.isUser 
                  ? [styles.userBubble, { backgroundColor: colors.primary }]
                  : [styles.assistantBubble, { backgroundColor: colors.card, borderColor: colors.border }]
              ]}
            >
              <Text 
                style={[
                  styles.messageText,
                  { color: message.isUser ? '#fff' : colors.text }
                ]}
              >
                {message.text}
              </Text>
              {message.intent && (
                <Text style={[styles.intentTag, { color: message.isUser ? '#ddd' : colors.textSecondary }]}>
                  Intent: {message.intent}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Voice Recorder */}
        <VoiceRecorder
          ref={recorderRef}
          onTranscribed={handleTranscribed}
          useAssistantEndpoint={true}
          primaryColor={colors.primary}
        />

        {/* Text Input */}
        <AssistantInput
          text={inputText}
          setText={setInputText}
          onSend={handleSend}
          placeholder="Type a message..."
          disabled={isProcessing}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  intentTag: {
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
