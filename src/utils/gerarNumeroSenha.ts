// @ts-nocheck

export function gerarNumeroSenha(tipo) {
  const now = moment();
  const yy = now.format('YY');
  const mm = now.format('MM');
  const dd = now.format('DD');
  const sequencia = gerarSequenciaDiaria(tipo); // Função a ser implementada
  return `${yy}${mm}${dd}-${tipo}${sequencia}`;
}

let sequencias = {
  SP: 1,
  SG: 1,
  SE: 1
};

export function gerarSequenciaDiaria(tipo) {
  let seq = sequencias[tipo];
  sequencias[tipo] ++;
  return seq.toString().padStart(3, '0');
}

export function resetarSequenciasDiarias() {
  sequencias = {
      SP: 1,
      SG: 1,
      SE: 1
  };
}
