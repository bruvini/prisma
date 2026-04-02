
const TipoResidencia = {
    CELA_ESPECIAL: 'CELA_ESPECIAL',
    ALOJAMENTO_INTERNO: 'ALOJAMENTO_INTERNO',
    TRIAGEM_PNE: 'TRIAGEM_PNE',
    PRISAO_CIVIL: 'PRISAO_CIVIL',
    SEGURO: 'SEGURO',
    TRIAGEM: 'TRIAGEM',
    CELA: 'CELA',
    ADAPTACAO: 'ADAPTACAO',
    LGBT: 'LGBT'
};

const Ala = {
    MASCULINA: 'MASCULINA',
    FEMININA: 'FEMININA',
    NAO_INFORMADA: 'NAO_INFORMADA'
};

function separarNomeSituacao(texto) {
  const padroesSituacao = [
    'RECOLHIDO(A)',
    'RECOLHIDO -',
    'RECOLHIDO',
    'SAÍDA PARA ESTUDO',
    'TRABALHO INTERNO',
    'TRABALHO EXTERNO',
    'EXAME EXTERNO',
    'INTERNAÇÃO HOSPITALAR',
    'RECEBENDO VISITAÇÃO'
  ];

  let indexMinimo = texto.length;

  for (const padrao of padroesSituacao) {
    const idx = texto.toUpperCase().indexOf(padrao);
    if (idx !== -1 && idx < indexMinimo) {
      indexMinimo = idx;
    }
  }

  if (indexMinimo === texto.length) {
    return { nome: texto.trim(), situacao: 'SITUAÇÃO NÃO IDENTIFICADA' };
  }

  const nome = texto.substring(0, indexMinimo).trim();
  const situacao = texto.substring(indexMinimo).trim();

  return { nome, situacao };
}

console.log('Teste 1:', separarNomeSituacao("ADILSON JOSE CATARINA DE OLIVEIRA RECOLHIDO(A)"));
console.log('Teste 2:', separarNomeSituacao("MARCIO DE OLIVEIRA RECOLHIDO - RECEBENDO VISITAÇÃO"));
