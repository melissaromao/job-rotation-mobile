import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ErrorBox, Field, HardShadow, s } from "../components/ui";
import { useAuth } from "../AuthContext";
import { getErrorMessage } from "../api";
import { colors } from "../theme";

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!nome.trim() || !email.trim() || !senha) {
      setErrorMsg("Preencha nome, email e senha.");
      return;
    }
    setLoading(true);
    try {
      await register(nome.trim(), email.trim(), senha);
      navigation.replace("Login"); // igual ao web: após cadastrar, vai para o login
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
            <View style={[s.card, { backgroundColor: colors.white, borderRadius: 24, padding: 24 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.coral }} />
                <Text style={{ fontSize: 12, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", color: colors.ink }}>
                  Comece agora
                </Text>
              </View>
              <Text style={{ fontSize: 42, fontWeight: "800", letterSpacing: -2.2, lineHeight: 42, color: colors.ink }}>
                Crie sua{"\n"}conta.
              </Text>
              <Text style={{ color: colors.ink, marginTop: 14, marginBottom: 24, lineHeight: 20 }}>
                Cadastre-se para criar sua organização e montar seus rodízios.
              </Text>

              <Field label="Nome" value={nome} onChangeText={setNome} autoCapitalize="words" placeholder="Seu nome completo" />
              <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="seu@email.com" autoComplete="email" />
              <Field label="Senha" value={senha} onChangeText={setSenha} secureTextEntry placeholder="********" />
              <ErrorBox message={errorMsg} />
              <Button title={loading ? "Cadastrando..." : "Criar minha conta →"} onPress={handleSubmit} loading={loading} />
              <Pressable onPress={() => navigation.replace("Login")} style={{ marginTop: 20 }}>
                <Text style={{ textAlign: "center", color: colors.ink }}>
                  Já tem uma conta? <Text style={{ fontWeight: "800", color: colors.ink, textDecorationLine: "underline" }}>Entrar</Text>
                </Text>
              </Pressable>
            </View>
          </HardShadow>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
