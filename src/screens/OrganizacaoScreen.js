import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, getErrorMessage } from "../api";
import { useAuth } from "../AuthContext";
import { Avatar, Button, Card, Chips, ConfirmModal, Empty, ErrorBox, Field, Loading, Pill, Sheet } from "../components/ui";
import { PERFIS, colors } from "../theme";
import RodizioForm from "../components/RodizioForm";
import { formatarPeriodo, nomeDaFuncaoAtribuicao, nomeDoMembroAtribuicao } from "../utils";

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
      {actionLabel && onAction && <Button small title={actionLabel} onPress={onAction} />}
    </View>
  );
}

/* ----------------------------- MEMBROS ----------------------------- */
function MembrosTab({ orgId, lista, podeGerenciar }) {
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
      <SectionHeader
        title="Membros"
        subtitle="Pessoas que fazem parte desta organização."
        actionLabel={podeGerenciar ? "+ Adicionar membro" : null}
        onAction={podeGerenciar ? abrirAdd : null}
      />
      <ErrorBox message={error} />
      {loading ? (
        <Loading text="Carregando membros..." />
      ) : membros.length === 0 ? (
        <Empty
          title="Nenhum membro"
          text="Ainda não há membros cadastrados nesta organização."
          action={podeGerenciar ? <Button title="+ Adicionar membro" onPress={abrirAdd} /> : null}
        />
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
                {podeGerenciar && (
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
                    <Button small variant="light" title="Editar perfil" style={{ flex: 1 }} onPress={() => { setEditando(m); setPerfilEditado(m.perfil || "Membro"); setError(""); }} />
                    <Button small variant="danger" title="Remover" style={{ flex: 1 }} onPress={() => { setRemovendo(m); setError(""); }} />
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}

      <Sheet visible={podeGerenciar && addAberto} title="Adicionar membro" onClose={() => !busy && setAddAberto(false)}>
        <Field label="Email do membro" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="pessoa@email.com" />
        <Chips label="Perfil" options={PERFIS} value={perfil} onChange={setPerfil} />
        <ErrorBox message={error} />
        <Button title="Adicionar" onPress={adicionar} loading={busy} />
      </Sheet>

      <Sheet visible={podeGerenciar && !!editando} title="Editar perfil" onClose={() => !busy && setEditando(null)}>
        <Text style={{ marginBottom: 16, color: colors.ink }}>{editando?.usuario?.nome || editando?.nome}</Text>
        <Chips label="Perfil" options={PERFIS} value={perfilEditado} onChange={setPerfilEditado} />
        <ErrorBox message={error} />
        <Button title="Salvar" onPress={editar} loading={busy} />
      </Sheet>

      <ConfirmModal
        visible={podeGerenciar && !!removendo}
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
function FuncoesTab({ orgId, lista, podeGerenciar }) {
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
      <SectionHeader
        title="Funções"
        subtitle="Responsabilidades que entram nos rodízios."
        actionLabel={podeGerenciar ? "+ Adicionar função" : null}
        onAction={podeGerenciar ? () => abrir("add") : null}
      />
      {!modo && <ErrorBox message={error} />}
      {loading ? (
        <Loading text="Carregando funções..." />
      ) : funcoes.length === 0 ? (
        <Empty
          title="Nenhuma função"
          text="Cadastre as funções que fazem parte da rotina da organização."
          action={podeGerenciar ? <Button title="+ Adicionar função" onPress={() => abrir("add")} /> : null}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {funcoes.map((f) => (
            <Card key={f._id}>
              <Text style={{ fontWeight: "800", fontSize: 17, letterSpacing: -0.4 }}>{f.nome}</Text>
              <Text style={{ color: colors.muted, marginTop: 4, lineHeight: 20 }}>{f.descricao || "Nenhuma descrição informada."}</Text>
              {podeGerenciar && (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
                  <Button small variant="light" title="Editar" style={{ flex: 1 }} onPress={() => abrir("edit", f)} />
                  <Button small variant="danger" title="Excluir" style={{ flex: 1 }} onPress={() => { setExcluir(f); setError(""); }} />
                </View>
              )}
            </Card>
          ))}
        </View>
      )}

      <Sheet visible={podeGerenciar && !!modo} title={modo === "edit" ? "Editar função" : "Adicionar função"} onClose={() => !busy && setModo(null)}>
        <Field label="Nome" value={nome} onChangeText={setNome} autoCapitalize="sentences" placeholder="Ex.: Atendimento" />
        <Field label="Descrição (opcional)" value={descricao} onChangeText={setDescricao} autoCapitalize="sentences" multiline placeholder="O que essa função faz?" />
        <ErrorBox message={error} />
        <Button title={modo === "edit" ? "Salvar alterações" : "Cadastrar função"} onPress={salvar} loading={busy} />
      </Sheet>

      <ConfirmModal visible={podeGerenciar && !!excluir} title="Excluir função?" text={`A função "${excluir?.nome}" será removida.`} loading={busy} onConfirm={confirmarExclusao} onCancel={() => !busy && setExcluir(null)} />
    </View>
  );
}

/* ----------------------------- RODÍZIOS ----------------------------- */
function RodiziosTab({ orgId, navigation, podeGerenciar }) {
  const { usuario } = useAuth();
  const rodizios = useLista(`/organizacoes/${orgId}/rodizios`);
  const minha = useLista(`/organizacoes/${orgId}/rodizios/minha`);
  const [formAberto, setFormAberto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formErro, setFormErro] = useState("");

  // Recarrega ao voltar da tela de detalhe (linhas/rotação podem ter mudado).
  const { carregar: recarregarRodizios } = rodizios;
  const { carregar: recarregarMinha } = minha;
  useEffect(
    () =>
      navigation.addListener("focus", () => {
        recarregarRodizios();
        recarregarMinha();
      }),
    [navigation, recarregarRodizios, recarregarMinha]
  );

  const abrirDetalhe = (id) => navigation.navigate("Rodizio", { orgId, rodizioId: id, podeGerenciar });

  const criar = async (dados) => {
    setBusy(true);
    setFormErro("");
    try {
      const res = await api.post(`/organizacoes/${orgId}/rodizios`, dados);
      setFormAberto(false);
      const novo = res.data?.rodizio;
      await Promise.all([recarregarRodizios(), recarregarMinha()]);
      // O rodízio nasce sem linhas: leva direto para adicionar membros e funções.
      if (novo?._id) abrirDetalhe(novo._id);
    } catch (e) {
      setFormErro(getErrorMessage(e, "Não foi possível criar o rodízio."));
    } finally {
      setBusy(false);
    }
  };

  // Linhas (membro → função) do usuário logado em cada rodízio ativo.
  const minhasLinhas = (r) => (r.atribuicoes || []).filter((a) => a.membro?.usuario?._id && a.membro.usuario._id === usuario?._id);

  return (
    <View>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", letterSpacing: -1.2 }}>Rodízios</Text>
        <Text style={{ color: colors.muted, marginTop: 4, marginBottom: 12 }}>Rotacionando membros por funções.</Text>
        {podeGerenciar && <Button small title="+ Novo rodízio" onPress={() => { setFormErro(""); setFormAberto(true); }} />}
      </View>

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
            {minha.data.map((r) => {
              const linhas = minhasLinhas(r);
              return (
                <Pressable key={r._id} onPress={() => abrirDetalhe(r._id)}>
                  <Card>
                    <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: colors.muted }}>Função atual</Text>
                    {linhas.length === 0 ? (
                      <Text style={{ fontSize: 17, fontWeight: "700", marginTop: 2, color: colors.muted }}>Função não informada</Text>
                    ) : (
                      linhas.map((a) => (
                        <Text key={a._id} style={{ fontSize: 20, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 }}>
                          {nomeDaFuncaoAtribuicao(a)}
                        </Text>
                      ))
                    )}
                    <View style={{ marginTop: 8 }}><Pill>{r.ciclo || "Mensal"}</Pill></View>
                    <Text style={{ marginTop: 12, fontWeight: "600" }}>{formatarPeriodo(r.dataInicio, r.dataFim)}</Text>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </Card>

      <ErrorBox message={rodizios.error} />
      {rodizios.loading ? (
        <Loading text="Carregando rodízios..." />
      ) : rodizios.data.length === 0 ? (
        <Empty
          title="Nenhum rodízio"
          text={podeGerenciar ? "Crie um rodízio e depois adicione as linhas de membro e função." : "Ainda não há rodízios nesta organização."}
          action={podeGerenciar ? <Button title="+ Novo rodízio" onPress={() => { setFormErro(""); setFormAberto(true); }} /> : null}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {rodizios.data.map((r) => {
            const linhas = r.atribuicoes || [];
            return (
              <Pressable key={r._id} onPress={() => abrirDetalhe(r._id)}>
                <Card>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Pill bg={colors.blue}>{r.ciclo || "Mensal"}</Pill>
                    <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>
                      {linhas.length} {linhas.length === 1 ? "linha" : "linhas"}
                    </Text>
                  </View>
                  <Text style={{ marginTop: 10, fontSize: 15, fontWeight: "800" }}>{formatarPeriodo(r.dataInicio, r.dataFim)}</Text>
                  {linhas.length === 0 ? (
                    <Text style={{ color: colors.muted, marginTop: 8, fontSize: 13 }}>Nenhum membro ou função ainda.</Text>
                  ) : (
                    <View style={{ marginTop: 10, gap: 4 }}>
                      {linhas.slice(0, 3).map((a) => (
                        <Text key={a._id} style={{ fontSize: 13 }} numberOfLines={1}>
                          <Text style={{ fontWeight: "700" }}>{nomeDoMembroAtribuicao(a)}</Text>
                          <Text style={{ color: colors.muted }}> → {nomeDaFuncaoAtribuicao(a)}</Text>
                        </Text>
                      ))}
                      {linhas.length > 3 && <Text style={{ color: colors.muted, fontSize: 12 }}>+ {linhas.length - 3} mais</Text>}
                    </View>
                  )}
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}

      <RodizioForm visible={formAberto} titulo="Novo rodízio" loading={busy} error={formErro} onClose={() => setFormAberto(false)} onSubmit={criar} />
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

  // Só Administrador/Moderador criam, editam e rotacionam rodízios (regra do backend).
  const meuMembro = membros.data.find((m) => m.usuario?._id && m.usuario._id === usuario?._id);
  const podeGerenciar = ["Administrador", "Moderador"].includes(meuMembro?.perfil);

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

            {aba === "membros" && <MembrosTab orgId={id} lista={membros} podeGerenciar={podeGerenciar} />}
            {aba === "funcoes" && <FuncoesTab orgId={id} lista={funcoes} podeGerenciar={podeGerenciar} />}
            {aba === "rodizios" && <RodiziosTab orgId={id} navigation={navigation} podeGerenciar={podeGerenciar} />}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
