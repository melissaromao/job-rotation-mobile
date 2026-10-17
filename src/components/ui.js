import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../theme";
import { obterIniciais } from "../utils";

/** Bloco com a "sombra dura" do estilo neo-brutalista (funciona em iOS e Android). */
export function HardShadow({ children, offset = 5, style, radius = 14 }) {
  return (
    <View style={[{ paddingRight: offset, paddingBottom: offset }, style]}>
      <View
        style={{
          position: "absolute",
          left: offset,
          top: offset,
          right: 0,
          bottom: 0,
          backgroundColor: colors.ink,
          borderRadius: radius,
        }}
      />
      {children}
    </View>
  );
}

export function Card({ children, style, shadow = false, bg = colors.white }) {
  const inner = <View style={[s.card, { backgroundColor: bg }, style]}>{children}</View>;
  return shadow ? <HardShadow radius={16}>{inner}</HardShadow> : inner;
}

export function Button({ title, onPress, loading, disabled, variant = "dark", small, style }) {
  const dark = variant === "dark";
  const danger = variant === "danger";
  const bg = danger ? colors.coral : dark ? colors.ink : colors.white;
  const fg = dark ? colors.white : colors.ink;
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        { backgroundColor: bg, opacity: off ? 0.6 : 1, transform: [{ translateY: pressed ? 1 : 0 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[s.btnText, small && { fontSize: 13 }, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field({ label, error, multiline, ...props }) {
  return (
    <View style={{ marginBottom: 20 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="#aaaaaa"
        autoCapitalize="none"
        multiline={multiline}
        {...props}
        style={[s.input, multiline && { minHeight: 70, textAlignVertical: "top" }]}
      />
    </View>
  );
}

export function ErrorBox({ message, style }) {
  if (!message) return null;
  return (
    <View style={[s.errorBox, style]}>
      <Text style={s.errorText}>{message}</Text>
    </View>
  );
}

export function SuccessToast({ message }) {
  if (!message) return null;
  return (
    <View style={s.toast}>
      <Text style={{ fontWeight: "700", color: colors.ink }}>✓ {message}</Text>
    </View>
  );
}

/** Seleção de uma opção entre várias (substitui o <select> da web). */
export function Chips({ label, options, value, onChange }) {
  return (
    <View style={{ marginBottom: 20 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const v = typeof opt === "string" ? opt : opt.value;
          const t = typeof opt === "string" ? opt : opt.label;
          const active = v === value;
          return (
            <Pressable
              key={v}
              onPress={() => onChange(v)}
              style={[s.chip, active && { backgroundColor: colors.ink }]}
            >
              <Text style={[s.chipText, active && { color: colors.white }]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Avatar({ nome, color = colors.blue, size = 40 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        borderWidth: 2,
        borderColor: colors.ink,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontWeight: "800", fontSize: size * 0.34, color: colors.ink }}>{obterIniciais(nome)}</Text>
    </View>
  );
}

export function Pill({ children, bg = colors.lime }) {
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Text style={{ fontSize: 11, fontWeight: "800", color: colors.ink }}>{children}</Text>
    </View>
  );
}

export function Empty({ icon = "+", title, text, action }) {
  return (
    <Card bg={colors.paper} style={{ padding: 24 }}>
      <View style={s.emptyIcon}>
        <Text style={{ fontSize: 22, fontWeight: "800" }}>{icon}</Text>
      </View>
      <Text style={[s.h3, { marginTop: 16 }]}>{title}</Text>
      {text ? <Text style={{ color: colors.muted, marginTop: 6, lineHeight: 20 }}>{text}</Text> : null}
      {action ? <View style={{ marginTop: 18 }}>{action}</View> : null}
    </Card>
  );
}

/** Bottom sheet para formulários. */
export function Sheet({ visible, title, onClose, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable style={s.backdrop} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.sheetHead}>
            <Text style={s.h3}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={{ fontSize: 22, fontWeight: "700" }}>✕</Text>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ConfirmModal({ visible, title, text, confirmLabel = "Excluir", loading, onConfirm, onCancel }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.confirmWrap}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <HardShadow style={{ width: "100%", maxWidth: 380 }} radius={18}>
          <View style={[s.card, { padding: 22, borderRadius: 18 }]}>
            <Text style={s.h3}>{title}</Text>
            <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 20 }}>{text}</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <Button title="Cancelar" variant="light" onPress={onCancel} disabled={loading} style={{ flex: 1 }} />
              <Button title={confirmLabel} variant="danger" onPress={onConfirm} loading={loading} style={{ flex: 1 }} />
            </View>
          </View>
        </HardShadow>
      </View>
    </Modal>
  );
}

export function Logo({ size = 18 }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={s.logoBox}>
        <View style={[s.logoDot, { left: 4, top: 4, backgroundColor: colors.coral }]} />
        <View style={[s.logoDot, { right: 4, bottom: 4, backgroundColor: colors.lime }]} />
      </View>
      <Text style={{ fontSize: size, fontWeight: "800", letterSpacing: -0.8, color: colors.ink }}>Job Rotation</Text>
    </View>
  );
}

export function Loading({ text }) {
  return (
    <View style={{ padding: 32, alignItems: "center", gap: 10 }}>
      <ActivityIndicator color={colors.ink} />
      {text ? <Text style={{ color: colors.muted, fontWeight: "600" }}>{text}</Text> : null}
    </View>
  );
}

export const s = StyleSheet.create({
  card: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.ink, borderRadius: 16, padding: 16 },
  btn: {
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSmall: { minHeight: 40, paddingHorizontal: 14 },
  btnText: { fontWeight: "800", fontSize: 15 },
  label: { fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, color: colors.ink },
  input: { backgroundColor: colors.white, borderBottomWidth: 2, borderBottomColor: colors.line, paddingVertical: 10, fontSize: 16, color: colors.ink },
  errorBox: { borderWidth: 1.5, borderColor: colors.coral, backgroundColor: colors.errorBg, borderRadius: 10, padding: 12, marginBottom: 14 },
  errorText: { color: colors.errorText, fontWeight: "600", fontSize: 13, textAlign: "center" },
  toast: { backgroundColor: colors.lime, borderWidth: 2, borderColor: colors.ink, borderRadius: 12, padding: 12, marginBottom: 14 },
  chip: { borderWidth: 2, borderColor: colors.ink, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.white },
  chipText: { fontWeight: "700", fontSize: 13, color: colors.ink },
  pill: { alignSelf: "flex-start", borderWidth: 1.5, borderColor: colors.ink, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  emptyIcon: { width: 48, height: 48, borderRadius: 12, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.lime, alignItems: "center", justifyContent: "center" },
  h3: { fontSize: 20, fontWeight: "800", letterSpacing: -0.6, color: colors.ink },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { maxHeight: "88%", backgroundColor: colors.white, borderTopWidth: 2, borderColor: colors.ink, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 20 },
  confirmWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 24 },
  logoBox: { width: 30, height: 30, borderRadius: 8, borderWidth: 2, borderColor: colors.ink },
  logoDot: { position: "absolute", width: 7, height: 7, borderRadius: 4 },
});
