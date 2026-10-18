export function obterIniciais(nome = "") {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function formatarData(data) {
  if (!data) return "Data não informada";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "Data inválida";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export const formatarPeriodo = (inicio, fim) => `${formatarData(inicio)} → ${formatarData(fim)}`;

export function nomeDoMembroAtribuicao(atribuicao) {
  return (
    atribuicao?.membro?.usuario?.nome ||
    atribuicao?.membro?.usuario?.email ||
    "Sem membro"
  );
}

export function nomeDaFuncaoAtribuicao(atribuicao) {
  return atribuicao?.funcao?.nome || "Sem função";
}

// ISO -> "DD/MM/AAAA" (para preencher o campo de data ao editar).
export function paraInputData(data) {
  if (!data) return "";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// Máscara DD/MM/AAAA enquanto digita.
export function mascaraData(texto) {
  const n = texto.replace(/\D/g, "").slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
}

// "25/12/2026" -> Date (meio-dia local, evita virar o dia por fuso) ou null.
export function parseData(texto) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto || "");
  if (!m) return null;
  const [, d, mo, y] = m.map(Number);
  const date = new Date(y, mo - 1, d, 12, 0, 0);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}
