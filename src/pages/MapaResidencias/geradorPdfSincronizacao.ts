/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ImpactoSincronizacao, ResumoSincronizacao } from './servicoSincronizacao';

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
  } catch (e) {
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
      ['Total Lido (I-PEN)', resumo.totalLido],
      ['Novos (Inclusões)', resumo.totalNovos],
      ['Movidos (Realocações)', resumo.totalRealocados],
      ['Reativados', resumo.totalReativados],
      ['Saídas (Inativados)', resumo.totalInativados],
      ['Sem Alteração', resumo.totalSemMudanca],
      ['Conflitos de Registro', resumo.totalConflitos],
      ['Residências Ausentes Criadas', resumo.totalResidenciasAusentes]
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'center' } },
    margin: { left: 14 }
  });

  cursorY = (doc as any).lastAutoTable.finalY + 15;

  const verificarQuebra = (alturaNecessaria: number) => {
    if (cursorY + alturaNecessaria > 280) {
      doc.addPage();
      cursorY = 20;
    }
  };

  // Helper para agrupar e ordenar locais
  const buildCurrentLocationStr = (reg: any) => `${reg.pavilhao}/${reg.galeria} / ${reg.piso} / ${reg.numeroResidencia}`;

  // 4. Novos Detentos
  if (impacto.novos.length > 0) {
    verificarQuebra(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Novos Internos Alocados (${impacto.novos.length})`, 14, cursorY);
    
    // Ordenar novos por local
    const novosSort = [...impacto.novos].sort((a,b) => buildCurrentLocationStr(a).localeCompare(buildCurrentLocationStr(b)));
    const tableData = novosSort.map(n => [
      n.prontuario,
      n.nomeCompleto,
      buildCurrentLocationStr(n),
      n.situacaoIpen
    ]);

    autoTable(doc, {
      startY: cursorY + 4,
      head: [['Prontuário', 'Nome Completo', 'Nova Localização (Pav/Gal/Piso/Num)', 'Situação I-PEN']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [39, 174, 96], textColor: 255 },
      styles: { fontSize: 8 }
    });
    cursorY = (doc as any).lastAutoTable.finalY + 10;
  }

  // 5. Movidos (Realocados)
  if (impacto.realocados.length > 0) {
    verificarQuebra(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Internos Movimentados (${impacto.realocados.length})`, 14, cursorY);
    
    // Obter o local anterior não está imediatamente fácil só pelo Residencia ID do impacto,
    // mas o relatório no futuro deve ter. Exibiremos ID caso não haja string. Vamos exibir Prontuário, Nome, Destino.
    const tableData = impacto.realocados.map(m => {
      const origemDesc = m.residenciaAnteriorDescricao || m.residenciaAnteriorId || 'Desconhecida';
      return [
        m.registro.prontuario,
        m.registro.nomeCompleto,
        origemDesc,
        buildCurrentLocationStr(m.registro)
      ];
    });

    autoTable(doc, {
      startY: cursorY + 4,
      head: [['Prontuário', 'Nome', 'Local Anterior', 'Novo Local (Aberto)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [243, 156, 18], textColor: 255 },
      styles: { fontSize: 8 }
    });
    cursorY = (doc as any).lastAutoTable.finalY + 10;
  }

  // 6. Reativados
  if (impacto.reativados.length > 0) {
    verificarQuebra(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Internos Reativados (${impacto.reativados.length})`, 14, cursorY);
    
    const tableData = impacto.reativados.map(r => [
      r.registro.prontuario,
      r.registro.nomeCompleto,
      buildCurrentLocationStr(r.registro),
      r.registro.situacaoIpen
    ]);

    autoTable(doc, {
      startY: cursorY + 4,
      head: [['Prontuário', 'Nome Completo', 'Local Atual', 'Situação I-PEN']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [142, 68, 173], textColor: 255 },
      styles: { fontSize: 8 }
    });
    cursorY = (doc as any).lastAutoTable.finalY + 10;
  }

  // 7. Saídas
  if (impacto.inativados.length > 0) {
    verificarQuebra(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Saídas Confirmadas - Inativados (${impacto.inativados.length})`, 14, cursorY);
    
    const tableDataInativados = impacto.inativados.map(i => [
      i.prontuario,
      i.nome,
      'Não mapeado localmente',
      formatDateBr(dataAtual)
    ]);

    autoTable(doc, {
      startY: cursorY + 4,
      head: [['Prontuário', 'Nome Completo', 'Último Local Conhecido', 'Data de Inativação']],
      body: tableDataInativados,
      theme: 'grid',
      headStyles: { fillColor: [192, 57, 43], textColor: 255 },
      styles: { fontSize: 8 }
    });
    cursorY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Paginação
  const pageCount = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount} - PRISMA-SP`, 105, 290, { align: 'center' });
  }

  return doc.output('blob');
}
