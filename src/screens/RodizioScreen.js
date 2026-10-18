import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, getErrorMessage } from "../api";
import { Button, Card, Chips, ConfirmModal, Empty, ErrorBox, Loading, Pill, Sheet, SuccessToast } from "../components/ui";
import RodizioForm from "../components/RodizioForm";
import { colors } from "../theme";
import { formatarPeriodo, nomeDaFuncaoAtribuicao, nomeDoMembroAtribuicao } from "../utils";

const SEM = "";

export default function RodizioScreen({ route, navigation }) {
  const { orgId, rodizioId, podeGerenciar } = route.params;
  const base = `/organizacoes/${orgId}/rodizios/${rodizioId}`;

  const [rodizio, setRodizio] = useState(null);
  const [membros, setMembros] = useState([]);
  const [funcoes, setFuncoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busy, setBusy] = useState(false);

  // linha em edição: { id | null (nova), membro, funcao }
  const [linha, setLinha] = useState(null);
  const [linhaErro, setLinhaErro] = useState("");
  const [linhaRemover, setLinhaRemover] = useState(null);
  const [editarAberto, setEditarAberto] = useState(false);
  const [formErro, setFormErro] = useState("");
  const [confirmaRotacao, setConfirmaRotacao] = useState(false);
  const [confirmaExcluir, setConfirmaExcluir] = useState(false);

  const carregar = useCallback(async () => {
    setError("");
    try {
      const res = await api.get(base);
      setRodizio(res.data);
    } catch (e) {
      if (e.response?.status !== 401) setError(getErrorMessage(e, "Não foi possível carregar o rodízio."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [base]);

  const carregarOpcoes = useCallback(async () => {
    try {
      const [m, f] = await Promise.all([api.get(`/organizacoes/${orgId}/membros`), api.get(`/organizacoes/${orgId}/funcoes`)]);
      setMembros(m.data || []);
      setFuncoes(f.data || []);
    } catch (e) {
      if (e.response?.status !== 401) setError(getErrorMessage(e, "Não foi possível carregar membros e funções."));
    }
  }, [orgId]);

  useEffect(() => {
    carregar();
    if (podeGerenciar) carregarOpcoes();
  }, [carregar, carregarOpcoes, podeGerenciar]);

  const avisar = (msg) => {
    setSucesso(msg);
    setTimeout(() => setSucesso(""), 3000);
  };

  // Executa uma chamada que devolve { rodizio } e atualiza a tela com ele.
  const executar = async (fn, fallback, { onOk, onError, sucessoMsg } = {}) => {
    setBusy(true);
    try {
      const res = await fn();
      if (res?.data?.rodizio) setRodizio(res.data.rodizio);
      onOk && onOk(res);
      if (sucessoMsg) avisar(sucessoMsg);
    } catch (e) {
      const msg = getErrorMessage(e, fallback);
      if (onError) onError(msg);
      else setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const atribuicoes = rodizio?.atribuicoes || [];

  const abrirNovaLinha = () => {
    setLinhaErro("");
    setLinha({ id: null, membro: SEM, funcao: SEM });
  };

  const abrirEditarLinha = (a) => {
    setLinhaErro("");
    setLinha({ id: a._id, membro: a.membro?._id || SEM, funcao: a.funcao?._id || SEM });
  };

  const salvarLinha = () => {
    if (!linha.membro && !linha.funcao) {
      setLinhaErro("Escolha ao menos um membro ou uma função.");
      return;
    }
    const body = { membroId: linha.membro || null, funcaoId: linha.funcao || null };
    executar(
      () => (linha.id ? api.patch(`${base}/atribuicoes/${linha.id}`, body) : api.post(`${base}/atribuicoes`, body)),
      "Não foi possível salvar a linha.",
      { onOk: () => setLinha(null), onError: setLinhaErro }
    );
  };

  const removerLinha = () =>
    executar(() => api.delete(`${base}/atribuicoes/${linhaRemover._id}`), "Não foi possível remover a linha.", {
      onOk: () => setLinhaRemover(null),
      onError: (m) => { setLinhaRemover(null); setError(m); },
    });

  const rotacionar = () =>
    executar(() => api.post(`${base}/rotacionar`, {}), "Não foi possível rotacionar o rodízio.", {
      onOk: () => setConfirmaRotacao(false),
      onError: (m) => { setConfirmaRotacao(false); setError(m); },
      sucessoMsg: "Rodízio rotacionado com sucesso!",
    });

  const salvarRodizio = (dados) => {
    setFormErro("");
    executar(() => api.patch(base, dados), "Não foi possível atualizar o rodízio.", {
      onOk: () => setEditarAberto(false),
      onError: setFormErro,
      sucessoMsg: "Rodízio atualizado com sucesso!",
    });
  };

  const excluirRodizio = () =>
    executar(() => api.delete(base), "Não foi possível excluir o rodízio.", {
      onOk: () => { setConfirmaExcluir(false); navigation.goBack(); },
      onError: (m) => { setConfirmaExcluir(false); setError(m); },
    });

  const optMembros = [{ value: SEM, label: "Sem membro" }, ...membros.map((m) => ({ value: m._id, label: m.usuario?.nome || m.usuario?.email || "Membro" }))];
  const optFuncoes = [{ value: SEM, label: "Sem função" }, ...funcoes.map((f) => ({ value: f._id, label: f.nome }))];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 2, borderColor: colors.ink }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ borderWidth: 2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ fontWeight: "800" }}>← Voltar</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} />}
      >
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue }} />
            <Text style={{ fontSize: 12, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", color: colors.ink }}>
              Detalhes do rodízio
            </Text>
          </View>
          <Text style={{ fontSize: 40, fontWeight: "800", letterSpacing: -2, lineHeight: 42 }}>
            Rotação{"\n"}agendada.
          </Text>
        </View>

        <SuccessToast message={sucesso} />
        <ErrorBox message={error} style={{ marginTop: 14 }} />

        {loading ? (
          <Loading text="Carregando rodízio..." />
        ) : !rodizio ? null : (
          <>
            <Card bg={colors.paper} style={{ marginBottom: 22 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: colors.muted }}>
                  Ciclo
                </Text>
                <Pill bg={colors.blue}>{rodizio.ciclo || "Mensal"}</Pill>
              </View>
              <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: colors.muted, marginTop: 18 }}>
                Período
              </Text>
              <Text style={{ marginTop: 5, fontWeight: "800", fontSize: 18, letterSpacing: -0.4 }}>
                {formatarPeriodo(rodizio.dataInicio, rodizio.dataFim)}
              </Text>
              {podeGerenciar && (
                <Button
                  small
                  variant="light"
                  title="Editar ciclo e período"
                  onPress={() => { setFormErro(""); setEditarAberto(true); }}
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>

            <View style={{ overflow: "hidden", borderWidth: 2, borderColor: colors.ink, borderRadius: 16 }}>
              <View style={{ backgroundColor: colors.paper, padding: 16, borderBottomWidth: 2, borderColor: colors.ink }}>
                <Text style={{ fontSize: 22, fontWeight: "800", letterSpacing: -0.8 }}>
                  Pessoas e funções
                </Text>
                <Text style={{ color: colors.muted, marginTop: 5, lineHeight: 20 }}>
                  Adicione linhas e escolha os valores. Membros e funções podem se repetir.
                </Text>
                {podeGerenciar && (
                  <View style={{ gap: 9, marginTop: 15 }}>
                    <Button small title="+ Adicionar linha" onPress={abrirNovaLinha} />
                    <Button
                      small
                      variant="light"
                      title="↻ Rotacionar"
                      onPress={() => setConfirmaRotacao(true)}
                      disabled={atribuicoes.length < 2}
                    />
                  </View>
                )}
                {podeGerenciar && atribuicoes.length < 2 && (
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 10 }}>
                    Adicione pelo menos duas linhas para poder rotacionar.
                  </Text>
                )}
              </View>

              <View style={{ flexDirection: "row", backgroundColor: colors.white }}>
                <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: colors.muted }}>
                    Função
                  </Text>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: colors.muted }}>
                    Membro
                  </Text>
                </View>
              </View>

              {atribuicoes.length === 0 ? (
                <View style={{ backgroundColor: colors.white, padding: 18 }}>
                  <Text style={{ color: colors.muted, lineHeight: 20 }}>
                    {podeGerenciar
                      ? "Ainda não há linhas. Adicione uma para começar a montar o rodízio."
                      : "Este rodízio ainda não tem membros ou funções definidos."}
                  </Text>
                </View>
              ) : (
                atribuicoes.map((a) => (
                  <View
                    key={a._id}
                    style={{
                      backgroundColor: colors.white,
                    }}
                  >
                    <View style={{ flexDirection: "row", minHeight: 54 }}>
                      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 12, paddingVertical: 14 }}>
                        <Text style={{ fontWeight: "800", fontSize: 14 }} numberOfLines={3}>
                          {nomeDaFuncaoAtribuicao(a)}
                        </Text>
                      </View>
                      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 12, paddingVertical: 14 }}>
                        <Text style={{ fontWeight: "700", fontSize: 14 }} numberOfLines={3}>
                          {nomeDoMembroAtribuicao(a)}
                        </Text>
                      </View>
                    </View>
                    {podeGerenciar && (
                      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 16, paddingHorizontal: 12, paddingBottom: 12 }}>
                        <Pressable onPress={() => abrirEditarLinha(a)} hitSlop={8}>
                          <Text style={{ fontSize: 12, fontWeight: "800", textDecorationLine: "underline" }}>Editar</Text>
                        </Pressable>
                        <Pressable onPress={() => setLinhaRemover(a)} hitSlop={8}>
                          <Text style={{ fontSize: 12, fontWeight: "800", color: colors.errorText, textDecorationLine: "underline" }}>Remover</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>

            {podeGerenciar && (
              <Button variant="danger" title="Excluir rodízio" onPress={() => setConfirmaExcluir(true)} style={{ marginTop: 30 }} />
            )}
          </>
        )}
      </ScrollView>

      <Sheet visible={!!linha} title={linha?.id ? "Editar linha" : "Adicionar linha"} onClose={() => !busy && setLinha(null)}>
        {linha && (
          <>
            <Chips label="Membro" options={optMembros} value={linha.membro} onChange={(v) => setLinha({ ...linha, membro: v })} />
            <Chips label="Função" options={optFuncoes} value={linha.funcao} onChange={(v) => setLinha({ ...linha, funcao: v })} />
            <ErrorBox message={linhaErro} />
            <Button title={linha.id ? "Salvar linha" : "Adicionar linha"} onPress={salvarLinha} loading={busy} />
          </>
        )}
      </Sheet>

      <RodizioForm visible={editarAberto} titulo="Editar rodízio" rodizio={rodizio} loading={busy} error={formErro} onClose={() => setEditarAberto(false)} onSubmit={salvarRodizio} />

      <ConfirmModal
        visible={!!linhaRemover}
        title="Remover linha?"
        text={`${linhaRemover ? nomeDoMembroAtribuicao(linhaRemover) : ""} → ${linhaRemover ? nomeDaFuncaoAtribuicao(linhaRemover) : ""} será removida do rodízio.`}
        confirmLabel="Remover"
        loading={busy}
        onConfirm={removerLinha}
        onCancel={() => !busy && setLinhaRemover(null)}
      />
      <ConfirmModal
        visible={confirmaRotacao}
        title="Rotacionar membros?"
        text="Cada membro passará para a função da linha seguinte (o último volta para a primeira)."
        confirmLabel="Rotacionar"
        loading={busy}
        onConfirm={rotacionar}
        onCancel={() => !busy && setConfirmaRotacao(false)}
      />
      <ConfirmModal
        visible={confirmaExcluir}
        title="Excluir rodízio?"
        text="O rodízio e todas as suas linhas serão removidos. Essa ação não pode ser desfeita."
        loading={busy}
        onConfirm={excluirRodizio}
        onCancel={() => !busy && setConfirmaExcluir(false)}
      />
    </SafeAreaView>
  );
}
