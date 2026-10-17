import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ErrorBox, Field, HardShadow, s } from "../components/ui";
import { useAuth } from "../AuthContext";
import { getErrorMessage } from "../api";
import { colors } from "../theme";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!email.trim() || !senha) {
      setErrorMsg("Preencha email e senha.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), senha); // a navegação para "Main" ocorre ao mudar o token
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }} keyboardShouldPersistTaps="handled">
          <HardShadow offset={9} radius={24}>
            <View style={[s.card, { borderRadius: 24, padding: 24 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.lime }} />
                <Text style={{ fontSize: 12, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" }}>
                  Bem-vindo de volta
                </Text>
              </View>
              <Text style={{ fontSize: 42, fontWeight: "800", letterSpacing: -2.2, lineHeight: 42 }}>
                Entre na{"\n"}sua conta.
              </Text>
              <Text style={{ color: colors.muted, marginTop: 14, marginBottom: 24, lineHeight: 20 }}>
                Acesse sua organização e continue organizando seus rodízios.
              </Text>

              <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="meuemail@example.com" autoComplete="email" />
              <Field label="Senha" value={senha} onChangeText={setSenha} secureTextEntry placeholder="********" autoComplete="password" />
              <ErrorBox message={errorMsg} />
              <Button title={loading ? "Entrando..." : "Entrar →"} onPress={handleSubmit} loading={loading} />
              <Pressable onPress={() => navigation.replace("Register")} style={{ marginTop: 20 }}>
                <Text style={{ textAlign: "center", fontWeight: "700", textDecorationLine: "underline" }}>
                  Não tem uma conta? Cadastre-se
                </Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate("Home")} style={{ marginTop: 14 }}>
                <Text style={{ textAlign: "center", color: colors.muted, fontSize: 13 }}>← Voltar ao início</Text>
              </Pressable>
            </View>
          </HardShadow>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
