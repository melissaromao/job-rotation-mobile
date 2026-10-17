import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Logo } from "../components/ui";
import { colors } from "../theme";

const PASSOS = [
  ["1", "Crie sua organização", "Cadastre seu grupo e defina o espaço onde os rodízios vão acontecer.", colors.coral],
  ["2", "Adicione pessoas", "Inclua os membros da equipe e as funções que fazem parte da rotina.", colors.yellow],
  ["3", "Monte o rodízio", "Defina a sequência de funções e organize quem assume cada responsabilidade.", colors.lime],
  ["4", "Cada um é avisado", "Quando chegar a hora da troca, o membro recebe o aviso da nova rotação.", colors.blue],
];

const PARA_QUEM = [
  ["Pequenas empresas", "Evite que uma única pessoa concentre uma função e ajude o time a conhecer outras atividades.", colors.coral],
  ["Times e departamentos", "Crie uma rotina clara para alternar responsabilidades dentro de uma equipe.", colors.lime],
  ["ONGs e projetos sociais", "Organize voluntários e distribua tarefas sem depender de mensagens espalhadas.", colors.blue],
  ["Projetos acadêmicos", "Distribua papéis entre integrantes e facilite a participação ao longo do projeto.", colors.yellow],
];

const VALOR = [
  ["Distribua responsabilidades", "Deixe claro quem participa de cada função e quando acontece a troca."],
  ["Compartilhe conhecimento", "O rodízio cria oportunidades para diferentes pessoas conhecerem diferentes funções."],
  ["Evite depender de uma pessoa", "Uma rotina de revezamento ajuda a tornar o funcionamento do grupo mais distribuído."],
  ["Tudo em um só lugar", "Organização, funções, pessoas e rodízios reunidos em uma única ferramenta."],
];

function Section({ kicker, title, children, bg }) {
  return (
    <View style={{ backgroundColor: bg, paddingVertical: 40, paddingHorizontal: 20 }}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.h2}>{title}</Text>
      <View style={{ marginTop: 22, gap: 14 }}>{children}</View>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <View style={styles.header}>
        <Logo />
        <Button small title="Entrar" variant="light" onPress={() => navigation.navigate("Login")} />
      </View>

      <ScrollView>
        <View style={{ padding: 20, paddingTop: 30 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.coral }} />
            <Text style={{ fontWeight: "700", fontSize: 13 }}>Rodízio de funções, sem planilhas</Text>
          </View>
          <Text style={styles.hero}>
            Faça o trabalho <Text style={styles.highlight}>circular.</Text>
          </Text>
          <Text style={styles.lead}>
            O Job Rotation ajuda sua organização a criar rodízios de funções, distribuir responsabilidades e avisar
            cada pessoa quando chega a sua vez.
          </Text>
          <View style={{ marginTop: 26, gap: 12 }}>
            <Button title="Criar minha organização →" onPress={() => navigation.navigate("Register")} />
            <Button title="Já tenho conta" variant="light" onPress={() => navigation.navigate("Login")} />
          </View>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 14 }}>
            Para equipes, projetos, ONGs, comunidades e organizações de todos os tamanhos.
          </Text>
        </View>

        <View style={styles.strip}>
          <Text style={styles.stripText}>Organize ✦ Compartilhe responsabilidades ✦ Crie rodízios ✦ Avise sua equipe</Text>
        </View>

        <Section kicker="Para quem é" title="Se existe uma equipe, existe um jeito de revezar." bg={colors.paper}>
          {PARA_QUEM.map(([t, d, c]) => (
            <Card key={t}>
              <View style={{ width: 34, height: 34, borderRadius: 10, borderWidth: 2, backgroundColor: c, marginBottom: 12 }} />
              <Text style={styles.cardTitle}>{t}</Text>
              <Text style={styles.cardText}>{d}</Text>
            </Card>
          ))}
        </Section>

        <Section kicker="Como funciona" title="Quatro passos. Uma rotina mais organizada." bg={colors.white}>
          {PASSOS.map(([n, t, d, c]) => (
            <Card key={n} style={{ flexDirection: "row", gap: 14 }}>
              <View style={[styles.step, { backgroundColor: c }]}>
                <Text style={{ fontWeight: "800" }}>{n}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{t}</Text>
                <Text style={styles.cardText}>{d}</Text>
              </View>
            </Card>
          ))}
        </Section>

        <Section kicker="Por que usar" title="Menos improviso. Mais participação." bg={colors.paper}>
          {VALOR.map(([t, d]) => (
            <Card key={t}>
              <Text style={styles.cardTitle}>{t}</Text>
              <Text style={styles.cardText}>{d}</Text>
            </Card>
          ))}
        </Section>

        <View style={{ padding: 20, paddingVertical: 44, backgroundColor: colors.yellow, borderTopWidth: 2 }}>
          <Text style={styles.h2}>Pronto para começar?</Text>
          <Text style={[styles.lead, { color: colors.ink, marginTop: 10 }]}>
            Crie sua organização, adicione sua equipe e monte seu primeiro rodízio.
          </Text>
          <Button title="Começar →" onPress={() => navigation.navigate("Register")} style={{ marginTop: 20 }} />
        </View>
        <View style={{ padding: 20, alignItems: "center", gap: 8 }}>
          <Logo size={16} />
          <Text style={{ color: colors.muted, fontSize: 12 }}>Organize. Reveze. Participe.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 2, borderColor: colors.ink },
  hero: { fontSize: 52, fontWeight: "800", letterSpacing: -2.6, lineHeight: 54, color: colors.ink },
  highlight: { backgroundColor: colors.yellow },
  lead: { fontSize: 17, color: "#4e4e4a", marginTop: 20, lineHeight: 25 },
  strip: { borderTopWidth: 2, borderBottomWidth: 2, backgroundColor: colors.yellow, paddingVertical: 14, paddingHorizontal: 20, marginTop: 30 },
  stripText: { fontWeight: "800", fontSize: 14, textAlign: "center" },
  kicker: { fontSize: 12, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 12 },
  h2: { fontSize: 34, fontWeight: "800", letterSpacing: -1.6, lineHeight: 36, color: colors.ink },
  cardTitle: { fontSize: 17, fontWeight: "800", letterSpacing: -0.4, marginBottom: 4, color: colors.ink },
  cardText: { color: colors.muted, lineHeight: 20, fontSize: 14 },
  step: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: "center", justifyContent: "center" },
});
