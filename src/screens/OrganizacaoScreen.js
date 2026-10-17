import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, getErrorMessage } from "../api";
import { useAuth } from "../AuthContext";
import { Avatar, Button, Card, Chips, ConfirmModal, Empty, ErrorBox, Field, Loading, Pill, Sheet } from "../components/ui";
import { CICLOS, PERFIS, colors } from "../theme";
import { formatarData, formatarPeriodo, mascaraData, nomeDoMembro, parseData } from "../utils";

const ABAS = [
  { key: "membros", label: "Membros", color: colors.coral },
  { key: "funcoes", label: "Funções", color: colors.lime },
  { key: "rodizios", label: "Rodízios", color: colors.blue },
];

/** Carrega uma lista da API com loading/erro. */
function useLista(path, enabled = true) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const carregar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(path);
      setData(res.data || []);
    } catch (e) {
      if (e.response?.status !== 401) setError(getErrorMessage(e, "Não foi possível carregar os dados."));
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    if (enabled) carregar();
  }, [carregar, enabled]);
  return { data, loading, error, setError, carregar };
}

function SectionHeader({ title, subtitle, actionLabel, onAction }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: "800", letterSpacing: -1.2 }}>{title}</Text>
      <Text style={{ color: colors.muted, marginTop: 4, marginBottom: 12 }}>{subtitle}</Text>
      <Button small title={actionLabel} onPress={onAction} />
    </View>
  );
}

/* ----------------------------- MEMBROS ----------------------------- */
function MembrosTab({ orgId, lista }) {
  const { data: membros, loading, error, setError, carregar } = lista;
  const [addAberto, setAddAberto] = useState(false);
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState("Membro");
  const [editando, setEditando] = useState(null);
  const [perfilEditado, setPerfilEditado] = useState("Membro");
  const [removendo, setRemovendo] = useState(null);
  const [busy, setBusy] = useState(false);

  const executar = async (fn, fallback, onOk) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      onOk();
      await carregar();
    } catch (e) {
      setError(getErrorMessage(e, fallback));
    } finally {
      setBusy(false);
    }
  };

  const adicionar = () => {
    if (!email.trim()) return setError("Digite o email do membro.");
    executar(() => api.post(`/organizacoes/${orgId}/membros`, { email: email.trim(), perfil }), "Não foi possível adicionar o membro.", () => setAddAberto(false));
  };
  const editar = () => {
    if (!editando?._id) return setError("Membro não encontrado.");
    executar(() => api.put(`/organizacoes/${orgId}/membros/${editando._id}`, { perfil: perfilEditado }), "Não foi possível editar o membro.", () => setEditando(null));
  };
  const remover = () => {
    if (!removendo?._id) return;
    executar(() => api.delete(`/organizacoes/${orgId}/membros/${removendo._id}`), "Não foi possível remover o membro.", () => setRemovendo(null));
  };

  const abrirAdd = () => { setEmail(""); setPerfil("Membro"); setError(""); setAddAberto(true); };

  return (
    <View>
      <SectionHeader title="Membros" subtitle="Pessoas que fazem parte desta organização." actionLabel="+ Adicionar membro" onAction={abrirAdd} />
      <ErrorBox message={error} />
      {loading ? (
        <Loading text="Carregando membros..." />
      ) : membros.length === 0 ? (
        <Empty title="Nenhum membro" text="Ainda não há membros cadastrados nesta organização." action={<Button title="+ Adicionar membro" onPress={abrirAdd} />} />
      ) : (
        <View style={{ gap: 12 }}>
          {membros.map((m, i) => {
            const nome = m.usuario?.nome || m.nome || "Sem nome";
            const mail = m.usuario?.email || m.email || "";
            return (
              <Card key={m._id}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Avatar nome={nome} color={[colors.coral, colors.blue, colors.lime, colors.yellow][i % 4]} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "800", fontSize: 15 }} numberOfLines={1}>{nome}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={1}>{mail}</Text>
                  </View>
                  <Pill bg={m.perfil === "Administrador" ? colors.yellow : m.perfil === "Moderador" ? colors.blue : colors.lime}>{m.perfil || "Membro"}</Pill>
                </View>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
                  <Button small variant="light" title="Editar perfil" style={{ flex: 1 }} onPress={() => { setEditando(m); setPerfilEditado(m.perfil || "Membro"); setError(""); }} />
                  <Button small variant="danger" title="Remover" style={{ flex: 1 }} onPress={() => { setRemovendo(m); setError(""); }} />
                </View>
              </Card>
            );
          })}
        </View>
      )}

      <Sheet visible={addAberto} title="Adicionar membro" onClose={() => !busy && setAddAberto(false)}>
        <Field label="Email do membro" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="pessoa@email.com" />
        <Chips label="Perfil" options={PERFIS} value={perfil} onChange={setPerfil} />
        <ErrorBox message={error} />
        <Button title="Adicionar" onPress={adicionar} loading={busy} />
      </Sheet>

      <Sheet visible={!!editando} title="Editar perfil" onClose={() => !busy && setEditando(null)}>
        <Text style={{ marginBottom: 16, color: colors.muted }}>{editando?.usuario?.nome || editando?.nome}</Text>
        <Chips label="Perfil" options={PERFIS} value={perfilEditado} onChange={setPerfilEditado} />
        <ErrorBox message={error} />
        <Button title="Salvar" onPress={editar} loading={busy} />
      </Sheet>

      <ConfirmModal
        visible={!!removendo}
        title="Remover membro?"
        text={`${removendo?.usuario?.nome || removendo?.nome || "Este membro"} será removido da organização.`}
        confirmLabel="Remover"
        loading={busy}
        onConfirm={remover}
        onCancel={() => !busy && setRemovendo(null)}
      />
    </View>
  );
}

/* ----------------------------- FUNÇÕES ----------------------------- */
function FuncoesTab({ orgId, lista }) {
  const { data: funcoes, loading, error, setError, carregar } = lista;
  const [modo, setModo] = useState(null); // "add" | "edit"
  const [selecionada, setSelecionada] = useState(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [excluir, setExcluir] = useState(null);
  const [busy, setBusy] = useState(false);

  const abrir = (m, f = null) => {
    setModo(m);
    setSelecionada(f);
    setNome(f?.nome || "");
    setDescricao(f?.descricao || "");
    setError("");
  };

  const salvar = async () => {
    if (!nome.trim()) return setError("O nome da função é obrigatório.");
    if (modo === "edit" && !selecionada?._id) return setError("Função não encontrada.");
    setBusy(true);
    setError("");
    try {
      const body = { nome: nome.trim(), descricao: descricao.trim() || undefined };
      if (modo === "edit") await api.put(`/organizacoes/${orgId}/funcoes/${selecionada._id}`, body);
      else await api.post(`/organizacoes/${orgId}/funcoes`, body);
      setModo(null);
      await carregar();
    } catch (e) {
      setError(getErrorMessage(e, modo === "edit" ? "Não foi possível editar a função." : "Não foi possível cadastrar a função."));
    } finally {
      setBusy(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!excluir?._id) return;
    setBusy(true);
    setError("");
    try {
      await api.delete(`/organizacoes/${orgId}/funcoes/${excluir._id}`);
      setExcluir(null);
      await carregar();
    } catch (e) {
      setExcluir(null);
      setError(getErrorMessage(e, "Não foi possível excluir a função."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <SectionHeader title="Funções" subtitle="Responsabilidades que entram nos rodízios." actionLabel="+ Adicionar função" onAction={() => abrir("add")} />
      {!modo && <ErrorBox message={error} />}
      {loading ? (
        <Loading text="Carregando funções..." />
      ) : funcoes.length === 0 ? (
        <Empty title="Nenhuma função" text="Cadastre as funções que fazem parte da rotina da organização." action={<Button title="+ Adicionar função" onPress={() => abrir("add")} />} />
      ) : (
        <View style={{ gap: 12 }}>
          {funcoes.map((f) => (
            <Card key={f._id}>
              <Text style={{ fontWeight: "800", fontSize: 17, letterSpacing: -0.4 }}>{f.nome}</Text>
              <Text style={{ color: colors.muted, marginTop: 4, lineHeight: 20 }}>{f.descricao || "Nenhuma descrição informada."}</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
                <Button small variant="light" title="Editar" style={{ flex: 1 }} onPress={() => abrir("edit", f)} />
                <Button small variant="danger" title="Excluir" style={{ flex: 1 }} onPress={() => { setExcluir(f); setError(""); }} />
              </View>
            </Card>
          ))}
        </View>
      )}

      <Sheet visible={!!modo} title={modo === "edit" ? "Editar função" : "Adicionar função"} onClose={() => !busy && setModo(null)}>
        <Field label="Nome" value={nome} onChangeText={setNome} autoCapitalize="sentences" placeholder="Ex.: Atendimento" />
        <Field label="Descrição (opcional)" value={descricao} onChangeText={setDescricao} autoCapitalize="sentences" multiline placeholder="O que essa função faz?" />
        <ErrorBox message={error} />
        <Button title={modo === "edit" ? "Salvar alterações" : "Cadastrar função"} onPress={salvar} loading={busy} />
      </Sheet>

      <ConfirmModal visible={!!excluir} title="Excluir função?" text={`A função "${excluir?.nome}" será removida.`} loading={busy} onConfirm={confirmarExclusao} onCancel={() => !busy && setExcluir(null)} />
    </View>
  );
}

/* ----------------------------- RODÍZIOS ----------------------------- */
function RodiziosTab({ orgId, membros, funcoes, ativa }) {
  const rodizios = useLista(`/organizacoes/${orgId}/rodizios`, ativa);
  const minha = useLista(`/organizacoes/${orgId}/rodizios/minha`, ativa);
  const [detalhe, setDetalhe] = useState(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [membro, setMembro] = useState("");
  const [funcao, setFuncao] = useState("");
  const [ciclo, setCiclo] = useState("Mensal");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [busy, setBusy] = useState(false);

  const abrirDetalhe = async (id) => {
    setLoadingDetalhe(true);
    rodizios.setError("");
    try {
      const res = await api.get(`/organizacoes/${orgId}/rodizios/${id}`);
      setDetalhe(res.data);
    } catch (e) {
      rodizios.setError(getErrorMessage(e, "Não foi possível carregar os detalhes do rodízio."));
    } finally {
      setLoadingDetalhe(false);
    }
  };

  const abrirAgendar = () => {
    setMembro(""); setFuncao(""); setCiclo("Mensal"); setInicio(""); setFim("");
    rodizios.setError("");
    setAberto(true);
  };

  const agendar = async () => {
    const err = (m) => rodizios.setError(m);
    if (!membro) return err("Selecione o membro.");
    if (!funcao) return err("Selecione a função.");
    const dInicio = parseData(inicio);
    const dFim = parseData(fim);
    if (!inicio) return err("Informe a data de início.");
    if (!fim) return err("Informe a data de término.");
    if (!dInicio || !dFim) return err("Use datas válidas no formato DD/MM/AAAA.");
    if (dInicio >= dFim) return err("A data de início deve ser anterior à data de término.");
    setBusy(true);
    err("");
    try {
      await api.post(`/organizacoes/${orgId}/rodizios`, {
        membro, funcao, ciclo,
        dataInicio: dInicio.toISOString(),
        dataFim: dFim.toISOString(),
      });
      setAberto(false);
      await Promise.all([rodizios.carregar(), minha.carregar()]);
    } catch (e) {
      err(e.response?.status === 409 ? "O membro já possui uma rotação neste período." : getErrorMessage(e, "Não foi possível agendar o rodízio."));
    } finally {
      setBusy(false);
    }
  };

  const optMembros = membros.map((m) => ({ value: m._id, label: m.usuario?.nome || m.nome || m.usuario?.email || "Membro" }));
  const optFuncoes = funcoes.map((f) => ({ value: f._id, label: f.nome }));

  return (
    <View>
      <SectionHeader title="Rodízios" subtitle="Quem assume cada função, e quando." actionLabel="+ Agendar rodízio" onAction={abrirAgendar} />

      <Card bg={colors.paper} style={{ marginBottom: 22 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.lime }} />
          <Text style={{ fontSize: 18, fontWeight: "800", letterSpacing: -0.5 }}>Minha rotação atual</Text>
        </View>
        {minha.loading ? (
          <Text style={{ color: colors.muted, fontWeight: "600" }}>Consultando sua rotação...</Text>
        ) : minha.error ? (
          <Text style={{ color: colors.errorText }}>{minha.error}</Text>
        ) : minha.data.length === 0 ? (
          <Text style={{ color: colors.muted, lineHeight: 20 }}>Você não possui uma rotação ativa neste momento.</Text>
        ) : (
          <View style={{ gap: 12 }}>
            {minha.data.map((r) => (
              <Card key={r._id}>
                <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: colors.muted }}>Função atual</Text>
                <Text style={{ fontSize: 20, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 }}>{r.funcao?.nome || "Função não informada"}</Text>
                <View style={{ marginTop: 8 }}><Pill>{r.ciclo || "Mensal"}</Pill></View>
                <Text style={{ marginTop: 12, fontWeight: "600" }}>{formatarPeriodo(r.dataInicio, r.dataFim)}</Text>
              </Card>
            ))}
          </View>
        )}
      </Card>

      <ErrorBox message={!aberto ? rodizios.error : ""} />
      {rodizios.loading ? (
        <Loading text="Carregando rodízios..." />
      ) : rodizios.data.length === 0 ? (
        <Empty title="Nenhum rodízio" text="Agende o primeiro rodízio escolhendo um membro, uma função e o período." action={<Button title="+ Agendar rodízio" onPress={abrirAgendar} />} />
      ) : (
        <View style={{ gap: 12 }}>
          {rodizios.data.map((r) => (
            <Pressable key={r._id} onPress={() => abrirDetalhe(r._id)}>
              <Card>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Avatar nome={nomeDoMembro(r)} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "800", fontSize: 15 }} numberOfLines={1}>{nomeDoMembro(r)}</Text>
                    <Text style={{ color: colors.muted, fontSize: 13 }} numberOfLines={1}>{r.funcao?.nome || "Função não informada"}</Text>
                  </View>
                  <Pill bg={colors.blue}>{r.ciclo || "Mensal"}</Pill>
                </View>
                <Text style={{ marginTop: 12, fontSize: 13, fontWeight: "600" }}>{formatarPeriodo(r.dataInicio, r.dataFim)}</Text>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
      {loadingDetalhe && <Loading />}

      <Sheet visible={!!detalhe} title="Detalhes do rodízio" onClose={() => setDetalhe(null)}>
        {detalhe && (
          <View style={{ gap: 14 }}>
            <Row label="Membro" value={nomeDoMembro(detalhe)} />
            <Row label="Função" value={detalhe.funcao?.nome || "Função não informada"} />
            <Row label="Ciclo" value={detalhe.ciclo || "Mensal"} />
            <Row label="Início" value={formatarData(detalhe.dataInicio)} />
            <Row label="Término" value={formatarData(detalhe.dataFim)} />
          </View>
        )}
      </Sheet>

      <Sheet visible={aberto} title="Agendar rodízio" onClose={() => !busy && setAberto(false)}>
        {optMembros.length === 0 || optFuncoes.length === 0 ? (
          <Text style={{ color: colors.muted, lineHeight: 20, marginBottom: 16 }}>
            Para agendar um rodízio, cadastre antes pelo menos um membro e uma função.
          </Text>
        ) : (
          <>
            <Chips label="Membro" options={optMembros} value={membro} onChange={setMembro} />
            <Chips label="Função" options={optFuncoes} value={funcao} onChange={setFuncao} />
            <Chips label="Ciclo" options={CICLOS} value={ciclo} onChange={setCiclo} />
            <Field label="Data de início" value={inicio} onChangeText={(t) => setInicio(mascaraData(t))} keyboardType="number-pad" placeholder="DD/MM/AAAA" />
            <Field label="Data de término" value={fim} onChangeText={(t) => setFim(mascaraData(t))} keyboardType="number-pad" placeholder="DD/MM/AAAA" />
          </>
        )}
        <ErrorBox message={rodizios.error} />
        {optMembros.length > 0 && optFuncoes.length > 0 && <Button title="Agendar rodízio" onPress={agendar} loading={busy} />}
      </Sheet>
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: colors.muted }}>{label}</Text>
      <Text style={{ fontSize: 17, fontWeight: "700", marginTop: 2 }}>{value}</Text>
    </View>
  );
}

/* ----------------------------- TELA ----------------------------- */
export default function OrganizacaoScreen({ route, navigation }) {
  const { id, nome: nomeInicial } = route.params;
  const { usuario, carregarUsuario } = useAuth();
  const [organizacao, setOrganizacao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [aba, setAba] = useState("membros");
  const [refreshing, setRefreshing] = useState(false);

  const membros = useLista(`/organizacoes/${id}/membros`);
  const funcoes = useLista(`/organizacoes/${id}/funcoes`);

  const carregarOrg = useCallback(async () => {
    setErrorMsg("");
    try {
      const res = await api.get(`/organizacoes/${id}`);
      setOrganizacao(res.data);
    } catch (e) {
      if (e.response?.status !== 401) setErrorMsg(getErrorMessage(e, "Não foi possível carregar a organização."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    carregarOrg();
    if (!usuario) carregarUsuario().catch(() => {});
  }, [carregarOrg]);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([carregarOrg(), membros.carregar(), funcoes.carregar()]);
    setRefreshing(false);
  };

  const titulo = organizacao?.nome || nomeInicial || "Organização";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 2, borderColor: colors.ink }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ borderWidth: 2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ fontWeight: "800" }}>← Voltar</Text>
        </Pressable>
        <Text style={{ flex: 1, textAlign: "right", fontWeight: "700", color: colors.muted }} numberOfLines={1}>
          {usuario?.nome || ""}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <Text style={{ fontSize: 12, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", color: colors.muted }}>Organização</Text>
        <Text style={{ fontSize: 36, fontWeight: "800", letterSpacing: -1.8, lineHeight: 38, marginTop: 6, marginBottom: 16 }}>{titulo}</Text>
        <ErrorBox message={errorMsg} />

        {loading ? (
          <Loading text="Carregando organização..." />
        ) : (
          <>
            <View style={{ flexDirection: "row", borderBottomWidth: 2, borderColor: colors.ink, marginBottom: 24 }}>
              {ABAS.map((a) => (
                <Pressable key={a.key} onPress={() => setAba(a.key)} style={{ flex: 1, alignItems: "center", paddingVertical: 14, borderBottomWidth: 4, borderBottomColor: aba === a.key ? a.color : "transparent", marginBottom: -2 }}>
                  <Text style={{ fontWeight: "800", color: aba === a.key ? colors.ink : colors.muted }}>{a.label}</Text>
                </Pressable>
              ))}
            </View>

            {aba === "membros" && <MembrosTab orgId={id} lista={membros} />}
            {aba === "funcoes" && <FuncoesTab orgId={id} lista={funcoes} />}
            {aba === "rodizios" && <RodiziosTab orgId={id} membros={membros.data} funcoes={funcoes.data} ativa />}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
