import React, { useEffect, useState } from "react";
import { Button, Chips, ErrorBox, Field, Sheet } from "./ui";
import { CICLOS } from "../theme";
import { mascaraData, paraInputData, parseData } from "../utils";

/**
 * Formulário de rodízio (criar/editar): ciclo + período.
 * Os membros e funções são definidos depois, na tela de detalhe (linhas).
 */
export default function RodizioForm({ visible, titulo, rodizio, loading, error, onClose, onSubmit }) {
  const [ciclo, setCiclo] = useState("Mensal");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [erroLocal, setErroLocal] = useState("");
  useEffect(() => {
    if (visible) {
      setCiclo(rodizio?.ciclo || "Mensal");
      setInicio(paraInputData(rodizio?.dataInicio));
      setFim(paraInputData(rodizio?.dataFim));
      setErroLocal("");
    }
  }, [visible, rodizio]);

  const salvar = () => {
    if (!inicio) return setErroLocal("Informe a data de início.");
    if (!fim) return setErroLocal("Informe a data de término.");
    const dInicio = parseData(inicio);
    const dFim = parseData(fim);
    if (!dInicio || !dFim) return setErroLocal("Use datas válidas no formato DD/MM/AAAA.");
    if (dInicio >= dFim) return setErroLocal("A data de início deve ser anterior à data de término.");
    setErroLocal("");
    onSubmit({ ciclo, dataInicio: dInicio.toISOString(), dataFim: dFim.toISOString() });
  };

  return (
    <Sheet visible={visible} title={titulo} onClose={() => !loading && onClose()}>
      <Chips label="Ciclo" options={CICLOS} value={ciclo} onChange={setCiclo} />
      <Field label="Data de início" value={inicio} onChangeText={(x) => setInicio(mascaraData(x))} keyboardType="number-pad" placeholder="DD/MM/AAAA" />
      <Field label="Data de término" value={fim} onChangeText={(x) => setFim(mascaraData(x))} keyboardType="number-pad" placeholder="DD/MM/AAAA" />
      <ErrorBox message={erroLocal || error} />
      <Button title={rodizio ? "Salvar alterações" : "Criar rodízio"} onPress={salvar} loading={loading} />
    </Sheet>
  );
}
