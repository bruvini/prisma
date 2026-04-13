/* eslint-disable @typescript-eslint/no-explicit-any */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ImpactoSincronizacao, ResumoSincronizacao, RegistroExtraido } from './servicoSincronizacao';
import { TipoResidenciaLabel } from './tipos';

function formatDateBr(dateAny: any): string {
  if (!dateAny) return 'N/A';
  try {
    let dateObj = dateAny;
    if (dateAny.toDate) {
      dateObj = dateAny.toDate();
    } else if (typeof dateAny === 'string' || typeof dateAny === 'number') {
      dateObj = new Date(dateAny);
    }
    
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return 'Data Inválida';

    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    const h = String(dateObj.getHours()).padStart(2, '0');
    const min = String(dateObj.getMinutes()).padStart(2, '0');
    const sec = String(dateObj.getSeconds()).padStart(2, '0');
    
    return `${d}/${m}/${y} ${h}:${min}:${sec}`;
  } catch (_e) {
    return 'Data Inválida';
  }
}

export function gerarRelatorioPdfSincronizacao(
  impacto: ImpactoSincronizacao,
  resumo: ResumoSincronizacao,
  dataAtual: any,
  dataAnterior: any | null,
  nomeUsuario: string = 'Sistema Prisma'
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  let cursorY = 20;

  const verificarQuebra = (alturaNecessaria: number) => {
    if (cursorY + alturaNecessaria > 270) {
      doc.addPage();
      cursorY = 20;
      return true;
    }
    return false;
  };

  // 1. Cabeçalho Institucional
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório Operacional de Sincronização', 105, cursorY, { align: 'center' });
  
  cursorY += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema PRISMA-SP | Relatório I-PEN (1.8)', 105, cursorY, { align: 'center' });

  // 2. Período de Comparação e Meta
  cursorY += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Metadados da Sincronização:', 14, cursorY);
  
  cursorY += 6;
  doc.setFont('helvetica', 'normal');
  const txtAnterior = dataAnterior ? formatDateBr(dataAnterior) : 'Primeira sincronização registrada';
  const txtAtual = formatDateBr(dataAtual);
  
  doc.text(`Sincronização Anterior: ${txtAnterior}`, 14, cursorY);
  cursorY += 5;
  doc.text(`Sincronização Atual: ${txtAtual}`, 14, cursorY);
  cursorY += 5;
  doc.text(`Executado por: ${nomeUsuario}`, 14, cursorY);

  // 3. Resumo Executivo
  cursorY += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo Executivo', 14, cursorY);

  cursorY += 4;
  autoTable(doc, {
    startY: cursorY,
    head: [['Métrica', 'Quantidade']],
    body: [
      ['Total Lido (I-PEN 1.8)', resumo.totalLido],
      ['Novos (Inclusões)', resumo.totalNovos],
      ['Movidos (Realocações)', resumo.totalRealocados],
      ['Reativados', resumo.totalReativados],
      ['Saídas (Inativados)', resumo.totalInativados],
      ['Sem Alteração no Mapa', resumo.totalSemMudanca],
      ['Conflitos (Não Processados)', resumo.totalConflitos],
      ['Unidades Provisórias Criadas', resumo.totalResidenciasAusentes]
    ],
    theme: 'grid',
    headStyles: { fillColor: [44, 62, 80], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'center', cellWidth: 30 } },
    margin: { left: 14 }
  });

  cursorY = (doc as any).lastAutoTable.finalY + 15;

  const renderizarSeccaoAgrupada = (titulo: string, itens: RegistroExtraido[], color: [number, number, number]) => {
    verificarQuebra(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(titulo, 14, cursorY);
    doc.setTextColor(0, 0, 0);
    cursorY += 8;

    if (itens.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.text('Nenhuma movimentação identificada nesta categoria.', 14, cursorY);
      cursorY += 15;
      return;
    }

    // Agrupamento: Pavilhão -> Galeria -> Tipo -> Residencia
    const hierarquia: any = {};
    itens.forEach(reg => {
      const p = reg.pavilhao;
      const g = reg.galeria;
      const t = TipoResidenciaLabel[reg.tipoResidencia] || reg.tipoResidencia;
      const r = reg.numeroResidencia;

      if (!hierarquia[p]) hierarquia[p] = {};
      if (!hierarquia[p][g]) hierarquia[p][g] = {};
      if (!hierarquia[p][g][t]) hierarquia[p][g][t] = {};
      if (!hierarquia[p][g][t][r]) hierarquia[p][g][t][r] = [];
      hierarquia[p][g][t][r].push(reg);
    });

    Object.keys(hierarquia).sort().forEach(pav => {
      verificarQuebra(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Pavilhão: ${pav}`, 14, cursorY);
      cursorY += 6;

      Object.keys(hierarquia[pav]).sort().forEach(gal => {
        verificarQuebra(12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`Galeria: ${gal}`, 18, cursorY);
        cursorY += 5;

        Object.keys(hierarquia[pav][gal]).sort().forEach(tipo => {
          Object.keys(hierarquia[pav][gal][tipo]).sort().forEach(res => {
            const internos = hierarquia[pav][gal][tipo][res];
            verificarQuebra(12 + (internos.length * 5));
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(`${tipo} - Unidade: ${res}`, 22, cursorY);
            cursorY += 4;

            const tableData = internos.map((int: any) => [
              int.prontuario,
              int.nomeCompleto,
              int.situacaoIpen
            ]);

            autoTable(doc, {
              startY: cursorY,
              head: [['Prontuário', 'Nome Completo', 'Situação I-PEN']],
              body: tableData,
              theme: 'plain',
              styles: { fontSize: 8, cellPadding: 1 },
              headStyles: { fontStyle: 'bold', textColor: 100 },
              margin: { left: 26 },
              tableWidth: 170
            });

            cursorY = (doc as any).lastAutoTable.finalY + 4;
          });
        });
      });
      cursorY += 2;
    });
    cursorY += 5;
  };

  // 4. Novos Detentos
  renderizarSeccaoAgrupada('Novos Internos Alocados', impacto.novos, [39, 174, 96]);

  // 5. Reativados
  const itensReativados = impacto.reativados.map(r => r.registro);
  renderizarSeccaoAgrupada('Internos Reativados', itensReativados, [142, 68, 173]);

  // 6. Movidos (Realocados)
  verificarQuebra(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(243, 156, 18);
  doc.text('Internos Movimentados (Realocações)', 14, cursorY);
  doc.setTextColor(0, 0, 0);
  cursorY += 8;

  if (impacto.realocados.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Nenhuma movimentação identificada nesta categoria.', 14, cursorY);
    cursorY += 15;
  } else {
    const tableDataMovidos = impacto.realocados.map(m => {
      const de = m.residenciaAnteriorDescricao || 'Local anterior não identificado';
      const para = `${m.registro.pavilhao}/${m.registro.galeria}/${m.registro.piso} - ${m.registro.numeroResidencia}`;
      return [
        m.registro.prontuario,
        m.registro.nomeCompleto,
        de,
        `→ ${para}`
      ];
    });

    autoTable(doc, {
      startY: cursorY,
      head: [['Prontuário', 'Nome Completo', 'De (Origem)', 'Para (Destino)']],
      body: tableDataMovidos,
      theme: 'grid',
      headStyles: { fillColor: [243, 156, 18], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: { 
        2: { cellWidth: 55 },
        3: { cellWidth: 55, fontStyle: 'bold' } 
      }
    });
    cursorY = (doc as any).lastAutoTable.finalY + 15;
  }

  // 7. Saídas
  verificarQuebra(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(192, 57, 43);
  doc.text('Saídas Confirmadas (Inativados)', 14, cursorY);
  doc.setTextColor(0, 0, 0);
  cursorY += 8;

  if (impacto.inativados.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Nenhuma movimentação identificada nesta categoria.', 14, cursorY);
    cursorY += 15;
  } else {
    const tableDataSaidas = impacto.inativados.map(i => [
      i.prontuario,
      i.nome,
      i.ultimaResidenciaDescricao || 'Local não registrado',
      formatDateBr(dataAtual)
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [['Prontuário', 'Nome Completo', 'Último Local em Atividade', 'Data de Inativação']],
      body: tableDataSaidas,
      theme: 'grid',
      headStyles: { fillColor: [192, 57, 43], textColor: 255 },
      styles: { fontSize: 8 }
    });
    cursorY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Rodapé e Paginação
  const lastPageNum = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : (doc.internal as any).pages.length - 1;
  for (let i = 1; i <= lastPageNum; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Documento gerado pelo Sistema PRISMA-SP (Gestão de Residências) em ${formatDateBr(new Date())}`, 14, 285);
    doc.text(`Página ${i} de ${lastPageNum}`, 196, 285, { align: 'right' });
  }

  return doc.output('blob');
}
