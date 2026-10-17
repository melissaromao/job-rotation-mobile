import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, getErrorMessage } from "../api";
import { useAuth } from "../AuthContext";
import { Avatar, Button, Card, ConfirmModal, Empty, ErrorBox, Field, Loading, Logo, Sheet, SuccessToast } from "../components/ui";
import { colors } from "../theme";

const CORES = [colors.coral, colors.lime, colors.blue, colors.yellow];

export default function MainScreen({ navigation }) {
  const { usuario, carregarUsuario, logout } = useAuth();
  const [organizacoes, setOrganizacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [paraEditar, setParaEditar] = useState(null);
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [modalErro, setModalErro] = useState("");

  const [menuId, setMenuId] = useState(null);
  const [paraExcluir, setParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [saindo, setSaindo] = useState(false);

  const carregar = useCallback(async () => {
    setErrorMsg("");
    try {
      const res = await api.get("/organizacoes/me");
      setOrganizacoes(res.data || []);
      await carregarUsuario();
    } catch (e) {
      if (e.response?.status !== 401) setErrorMsg(getErrorMessage(e, "Não foi possível carregar seus dados."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [carregarUsuario]);

  useEffect(() => {
    carregar();
    // recarrega ao voltar de uma organização
    return navigation.addListener("focus", () => carregar());
  }, [carregar, navigation]);

  const avisar = (msg) => {
    setSucesso(msg);
    setTimeout(() => setSucesso(""), 3000);
  };

  const abrirCriar = () => {
    setParaEditar(null);
    setNome("");
    setModalErro("");
    setModalAberto(true);
  };

  const abrirEditar = (org) => {
    setMenuId(null);
    setParaEditar(org);
    setNome(org.nome || "");
    setModalErro("");
    setModalAberto(true);
  };

  const fecharModal = () => {
    if (salvando) return;
    setModalAberto(false);
  };

  const salvar = async () => {
    if (!nome.trim()) {
      setModalErro("Digite o nome da organização.");
      return;
    }
    setSalvando(true);
    setModalErro("");
    try {
      if (paraEditar) {
        const res = await api.put(`/organizacoes/${paraEditar._id}`, { nome: nome.trim() });
        const novoNome = res.data?.organizacao?.nome || nome.trim();
        setOrganizacoes((atuais) => atuais.map((o) => (o._id === paraEditar._id ? { ...o, nome: novoNome } : o)));
        setModalAberto(false);
        avisar("Organização atualizada com sucesso!");
      } else {
        const res = await api.post("/organizacoes/criar", { nome: nome.trim() });
        setModalAberto(false);
        const nova = res.data?.organizacao;
        if (nova?._id) navigation.navigate("Organizacao", { id: nova._id, nome: nova.nome });
        else await carregar();
      }
    } catch (e) {
      setModalErro(getErrorMessage(e, paraEditar ? "Não foi possível editar a organização." : "Não foi possível criar a organização."));
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!paraExcluir?._id) return;
    setExcluindo(true);
    try {
      await api.delete(`/organizacoes/${paraExcluir._id}`);
      setOrganizacoes((atuais) => atuais.filter((o) => o._id !== paraExcluir._id));
      setParaExcluir(null);
      avisar("Organização excluída com sucesso!");
    } catch (e) {
      setParaExcluir(null);
      setErrorMsg(getErrorMessage(e, "Não foi possível excluir a organização."));
    } finally {
      setExcluindo(false);
    }
  };

  const sair = async () => {
    if (saindo) return;
    setSaindo(true);
    await logout();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 2, borderColor: colors.ink }}>
        <Logo />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Avatar nome={usuario?.nome} color={colors.yellow} size={36} />
          <Button small title={saindo ? "..." : "Sair"} variant="light" onPress={sair} disabled={saindo} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} />}
      >
        <Text style={{ fontSize: 12, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", color: colors.muted }}>
          Olá, {usuario?.nome?.split(" ")[0] || "bem-vindo"}
        </Text>
        <Text style={{ fontSize: 36, fontWeight: "800", letterSpacing: -1.8, marginTop: 6, lineHeight: 38 }}>
          Minhas organizações
        </Text>
        <Text style={{ color: colors.muted, marginTop: 8, marginBottom: 18, lineHeight: 20 }}>
          Crie e gerencie os espaços onde seus rodízios acontecem.
        </Text>
        <Button title="+ Nova organização" onPress={abrirCriar} style={{ marginBottom: 20 }} />

        <SuccessToast message={sucesso} />
        <ErrorBox message={errorMsg} />

        {loading ? (
          <Loading text="Carregando organizações..." />
        ) : organizacoes.length === 0 ? (
          <Empty title="Nenhuma organização" text="Você ainda não participa de nenhuma organização. Crie a primeira para começar." action={<Button title="+ Criar organização" onPress={abrirCriar} />} />
        ) : (
          <View style={{ gap: 14 }}>
            {organizacoes.map((org, i) => (
              <Card key={org._id} style={{ padding: 0, overflow: "visible" }}>
                <Pressable onPress={() => { setMenuId(null); navigation.navigate("Organizacao", { id: org._id, nome: org.nome }); }} style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <View style={{ width: 46, height: 46, borderRadius: 12, borderWidth: 2, backgroundColor: CORES[i % CORES.length], alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontWeight: "800", fontSize: 18 }}>{(org.nome || "?").charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: "800", letterSpacing: -0.5 }} numberOfLines={1}>{org.nome}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>Toque para abrir</Text>
                  </View>
                  <Pressable hitSlop={12} onPress={() => setMenuId(menuId === org._id ? null : org._id)} accessibilityLabel={`Opções de ${org.nome}`}>
                    <Text style={{ fontSize: 24, fontWeight: "800" }}>⋯</Text>
                  </Pressable>
                </Pressable>
                {menuId === org._id && (
                  <View style={{ flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 2, backgroundColor: colors.paper, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
                    <Button small title="Visualizar" variant="light" style={{ flex: 1 }} onPress={() => { setMenuId(null); navigation.navigate("Organizacao", { id: org._id, nome: org.nome }); }} />
                    <Button small title="Editar" variant="light" style={{ flex: 1 }} onPress={() => abrirEditar(org)} />
                    <Button small title="Excluir" variant="danger" style={{ flex: 1 }} onPress={() => { setMenuId(null); setParaExcluir(org); }} />
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <Sheet visible={modalAberto} title={paraEditar ? "Editar organização" : "Nova organização"} onClose={fecharModal}>
        <Field label="Nome da organização" value={nome} onChangeText={setNome} autoCapitalize="words" placeholder="Ex.: Equipe de comunicação" autoFocus />
        <ErrorBox message={modalErro} />
        <Button title={paraEditar ? "Salvar alterações" : "Criar organização"} onPress={salvar} loading={salvando} />
      </Sheet>

      <ConfirmModal
        visible={!!paraExcluir}
        title="Excluir organização?"
        text={`A organização "${paraExcluir?.nome}" será removida. Essa ação não pode ser desfeita.`}
        loading={excluindo}
        onConfirm={confirmarExclusao}
        onCancel={() => !excluindo && setParaExcluir(null)}
      />
    </SafeAreaView>
  );
}
