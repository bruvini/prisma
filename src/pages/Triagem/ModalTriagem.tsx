/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import type {
  ItemFilaTriagem,
  EstadoFormTriagem,
  Triagem,
  DadoConsulta,
  DadoPressaoArterial,
  DadoAntropometria,
  DadoIST,
  RegistroUsoSubstancia,
} from './tipos';
import {
  ESTADO_FORM_VAZIO,
  PerfilCuidadoLabel,
  OrigemDadoLabel,
  TipoRegistroHba1cLabel,
  StatusBoaPratica,
  StatusTestagemIST,
  StatusTestagemISTLabel,
  ResultadoISTLabel,
  TipoRegistroISTLabel,
  OrigemDado,
  EstadoAssistencialTB,
  EstadoAssistencialTBLabel,
  SituacaoMoradiaLabel,
  GrupoMinoritario,
  GrupoMinoritarioLabel,
  SubstanciaPsicoativa,
  SubstanciaPsicoativaLabel,
  FrequenciaUso,
} from './tipos';

interface ModalTriagemProps {
  item: ItemFilaTriagem | null;
  triagemAnterior: Triagem | null;
  carregandoAnterior: boolean;
  aoFechar: () => void;
  aoSalvar: (estado: EstadoFormTriagem, triagemAnteriorId: string | null) => Promise<void>;
  salvando: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mascaraData(valor: string): string {
  const nums = valor.replace(/\D/g, '').slice(0, 8);
  if (nums.length <= 2) return nums;
  if (nums.length <= 4) return `${nums.slice(0, 2)}/${nums.slice(2)}`;
  return `${nums.slice(0, 2)}/${nums.slice(2, 4)}/${nums.slice(4)}`;
}

const BadgeStatus: React.FC<{ status?: string; label: string }> = ({ status, label }) => {
  if (!status) return null;
  const ok = status === StatusBoaPratica.OK;
  return (
    <span className={`tr-bp-badge ${ok ? 'tr-bp-badge--ok' : 'tr-bp-badge--pendente'}`}>
      {ok
        ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      }
      {label}
    </span>
  );
};

const BadgeOrigem: React.FC<{ origem: string }> = ({ origem }) => {
  if (origem === OrigemDado.NAO_INFORMADO) return null;
  const labels: Record<string, string> = {
    RETROATIVO:    'Retroativo',
    TRIAGEM_ATUAL: 'Informado agora',
    REAPROVEITADO: 'Passagem anterior',
  };
  return (
    <span className="tr-origem-badge">{labels[origem] ?? origem}</span>
  );
};

const InputData: React.FC<{ id: string; value: string; onChange: (v: string) => void; placeholder?: string; }> = ({ id, value, onChange, placeholder = 'DD/MM/AAAA' }) => (
  <input
    id={id} className="tr-modal-input" type="text" inputMode="numeric"
    value={value} onChange={e => onChange(mascaraData(e.target.value))}
    placeholder={placeholder} maxLength={10}
  />
);

const SelectOrigem: React.FC<{ id: string; value: string; onChange: (v: string) => void; }> = ({ id, value, onChange }) => (
  <select id={id} className="tr-modal-select tr-select-origem" value={value} onChange={e => onChange(e.target.value)}>
    {Object.entries(OrigemDadoLabel).map(([k, v]) => (
      <option key={k} value={k}>{v}</option>
    ))}
  </select>
);

const TextareaObs: React.FC<{ id: string; value: string; onChange: (v: string) => void; }> = ({ id, value, onChange }) => (
  <textarea
    id={id} className="tr-modal-textarea" rows={2} maxLength={300}
    placeholder="Observação curta (opcional)..."
    value={value} onChange={e => onChange(e.target.value)}
  />
);

// ---------------------------------------------------------------------------
// Componentes de Seção
// ---------------------------------------------------------------------------

const SecaoP1: React.FC<{ isRetorno: boolean }> = ({ isRetorno }) => (
  <div className="tr-secao-p1">
    <div className="tr-secao-p1-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
    <div className="tr-secao-p1-texto">
      <strong>P1 — Mais Acesso à Atenção Primária Prisional</strong>
      <span>{isRetorno ? ' Esta triagem será validada e registrada como atendimento (retorno de egresso).' : ' Ao salvar, a triagem valerá como atendimento individual automático da eAPP.'}</span>
    </div>
  </div>
);

const SecaoIdentificacao: React.FC<{ valor: EstadoFormTriagem['identificacao']; onChange: (v: EstadoFormTriagem['identificacao']) => void; }> = ({ valor, onChange }) => {
  const toggleMinoritario = (g: GrupoMinoritario) => {
    const atual = valor.gruposMinoritarios || [];
    if (atual.includes(g)) {
      onChange({ ...valor, gruposMinoritarios: atual.filter(x => x !== g) });
    } else {
      onChange({ ...valor, gruposMinoritarios: [...atual, g] });
    }
  };

  return (
    <div className="tr-modal-secao">
      <div className="tr-modal-secao-header">
        <h3 className="tr-modal-secao-titulo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Identificação Social e Complementar</h3>
        <p className="tr-modal-secao-desc">Evita duplicação de cadastros, orienta o perfil de cuidado e rastreia vulnerabilidades sociais.</p>
      </div>
      <div className="tr-modal-grid-4">
        <div className="tr-modal-campo"><label className="tr-modal-label" htmlFor="tr-ident-nascimento">Data de nascimento</label><InputData id="tr-ident-nascimento" value={valor.dataNascimento ?? ''} onChange={v => onChange({ ...valor, dataNascimento: v })} /></div>
        <div className="tr-modal-campo"><label className="tr-modal-label" htmlFor="tr-ident-olostech">Prontuário Olostech</label><input id="tr-ident-olostech" className="tr-modal-input" type="text" placeholder="Nº..." value={valor.prontuarioOlostech ?? ''} onChange={e => onChange({ ...valor, prontuarioOlostech: e.target.value })} /></div>
        <div className="tr-modal-campo"><label className="tr-modal-label" htmlFor="tr-ident-ipen">Nº detento I-PEN</label><input id="tr-ident-ipen" className="tr-modal-input" type="text" placeholder="Nº..." value={valor.numeroDetentoIpen ?? ''} onChange={e => onChange({ ...valor, numeroDetentoIpen: e.target.value })} /></div>
        <div className="tr-modal-campo"><label className="tr-modal-label" htmlFor="tr-ident-perfil">Identidade de gênero / Cuidado</label><select id="tr-ident-perfil" className="tr-modal-select" value={valor.perfilCuidado ?? ''} onChange={e => onChange({ ...valor, perfilCuidado: e.target.value as any || undefined })}><option value="">Não informado</option>{Object.entries(PerfilCuidadoLabel).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select></div>
        <div className="tr-modal-campo"><label className="tr-modal-label" htmlFor="tr-ident-moradia">Situação de Moradia</label><select id="tr-ident-moradia" className="tr-modal-select" value={valor.situacaoMoradia ?? ''} onChange={e => onChange({ ...valor, situacaoMoradia: e.target.value as any || undefined })}><option value="">Não informado</option>{Object.entries(SituacaoMoradiaLabel).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select></div>
      </div>
      
      <div className="tr-modal-campo" style={{ marginTop: '16px' }}>
        <label className="tr-modal-label">Autoidentificação de Grupos Minoritários (Opcional)</label>
        <div className="tr-sintomas-grid" style={{ marginTop: '8px' }}>
          {Object.entries(GrupoMinoritarioLabel).map(([k, v]) => {
            const mg = k as GrupoMinoritario;
            const isAtivo = (valor.gruposMinoritarios || []).includes(mg);
            return (
              <button 
                key={k}
                type="button" 
                className={`tr-sintoma-chip ${isAtivo ? 'tr-sintoma-chip--ativo' : ''}`}
                onClick={() => toggleMinoritario(mg)}
                data-lgbtqia={mg === GrupoMinoritario.LGBTQIA ? 'true' : undefined}
              >
                {isAtivo ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : <span className="tr-sintoma-circle" />}
                {v}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Seção Substâncias Psicoativas
// ---------------------------------------------------------------------------

const SecaoSubstanciasPsicoativas: React.FC<{ valor: EstadoFormTriagem['substancias']; onChange: (v: EstadoFormTriagem['substancias']) => void; }> = ({ valor, onChange }) => {
  const toggleSubstancia = (sub: SubstanciaPsicoativa) => {
    const existe = valor.registros.find(r => r.substancia === sub);
    if (existe) {
      onChange({ registros: valor.registros.filter(r => r.substancia !== sub) });
    } else {
      onChange({ registros: [...valor.registros, { id: crypto.randomUUID(), substancia: sub }] });
    }
  };

  const updateSubstancia = (id: string, partial: Partial<RegistroUsoSubstancia>) => {
    onChange({ registros: valor.registros.map(r => r.id === id ? { ...r, ...partial } : r) });
  };

  return (
    <div className="tr-modal-secao">
      <div className="tr-modal-secao-header">
        <h3 className="tr-modal-secao-titulo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><line x1="5.52" y1="16" x2="18.48" y2="16"/></svg>
          Uso de Substâncias Psicoativas
        </h3>
        <p className="tr-modal-secao-desc">Indique o uso atual ou recente de substâncias (incluindo lícitas) para melhor rastreio e atenção assistencial na unidade prisional.</p>
      </div>

      <div className="tr-substancias-lista">
        {Object.entries(SubstanciaPsicoativaLabel).map(([k, v]) => {
          const sub = k as SubstanciaPsicoativa;
          const reg = valor.registros.find(r => r.substancia === sub);
          const isAtivo = !!reg;
          
          return (
            <div key={k} className={`tr-substancia-item ${isAtivo ? 'tr-substancia-item--ativo' : ''}`}>
              <label className="tr-substancia-header">
                <input 
                  type="checkbox" 
                  checked={isAtivo} 
                  onChange={() => toggleSubstancia(sub)} 
                  className="tr-substancia-checkbox"
                />
                <span className="tr-substancia-nome">{v}</span>
              </label>

              {isAtivo && reg && (
                <div className="tr-substancia-detalhes">
                  {sub === SubstanciaPsicoativa.OUTROS && (
                    <div className="tr-modal-campo">
                      <label className="tr-modal-label">Especificar</label>
                      <input className="tr-modal-input" type="text" value={reg.substanciaOutro ?? ''} onChange={e => updateSubstancia(reg.id, { substanciaOutro: e.target.value })} placeholder="Qual substância?" />
                    </div>
                  )}
                  <div className="tr-modal-campo">
                    <label className="tr-modal-label">Tempo de Uso</label>
                    <input className="tr-modal-input" type="text" value={reg.tempoUso ?? ''} onChange={e => updateSubstancia(reg.id, { tempoUso: e.target.value })} placeholder="Ex: 5 anos, meses..." />
                  </div>
                  <div className="tr-modal-campo">
                    <label className="tr-modal-label">Frequência</label>
                    <select className="tr-modal-select" value={reg.frequencia ?? ''} onChange={e => updateSubstancia(reg.id, { frequencia: e.target.value as any || undefined })}>
                      <option value="">Não informado</option>
                      <option value={FrequenciaUso.DIARIO}>Diário</option>
                      <option value={FrequenciaUso.SEMANAL}>Semanal</option>
                      <option value={FrequenciaUso.OCASIONAL}>Ocasional</option>
                      <option value={FrequenciaUso.OUTRO}>Outro</option>
                    </select>
                  </div>
                  <div className="tr-modal-campo">
                    <label className="tr-modal-label">Último Uso</label>
                    <InputData id={`sub-${reg.id}-data`} value={reg.dataUltimoUso ?? ''} onChange={val => updateSubstancia(reg.id, { dataUltimoUso: val })} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Seção P4 — Rastreio de IST
// ---------------------------------------------------------------------------

const BlocoIST: React.FC<{ label: string; valor: DadoIST; onChange: (v: DadoIST) => void; }> = ({ label, valor, onChange }) => {
  const isRealizado = valor.statusTestagem === StatusTestagemIST.REALIZADO;
  const isNaoRealizado = valor.statusTestagem === StatusTestagemIST.NAO_REALIZADO;
  const pendente = valor.statusTestagem === StatusTestagemIST.PENDENTE;

  return (
    <div className={`tr-bp-bloco ${pendente ? 'tr-bloco-pendente' : ''}`}>
      <div className="tr-bp-bloco-header">
        <span className="tr-bp-bloco-label">{label}</span>
      </div>
      <div className="tr-bp-row tr-row-cols">
        <div className="tr-row-inner-grid" style={{ gridTemplateColumns: 'minmax(140px, 1fr) minmax(180px, 2fr)' }}>
          <div className="tr-modal-campo">
            <label className="tr-modal-label" htmlFor={`ist-${label}-status`}>Status do Rastreio</label>
            <select id={`ist-${label}-status`} className="tr-modal-select tr-ist-status" value={valor.statusTestagem} onChange={e => onChange({ ...valor, statusTestagem: e.target.value as any, motivoNaoRealizado: undefined, resultado: undefined, dataRegistroOuTeste: undefined, tipoRegistro: undefined })}>
              {Object.entries(StatusTestagemISTLabel).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
            </select>
          </div>
          {isRealizado && (
            <div className="tr-modal-campo">
              <label className="tr-modal-label" htmlFor={`ist-${label}-resultado`}>Resultado</label>
              <select id={`ist-${label}-resultado`} className="tr-modal-select" value={valor.resultado ?? ''} onChange={e => onChange({ ...valor, resultado: e.target.value as any || undefined })}>
                <option value="">Selecione...</option>
                {Object.entries(ResultadoISTLabel).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </div>
          )}
          {isNaoRealizado && (
            <div className="tr-modal-campo">
              <label className="tr-modal-label" htmlFor={`ist-${label}-motivo`}>Motivo (obrigatório)</label>
              <input id={`ist-${label}-motivo`} className="tr-modal-input" type="text" placeholder="Ex: Interno recusou..." value={valor.motivoNaoRealizado ?? ''} onChange={e => onChange({ ...valor, motivoNaoRealizado: e.target.value })} />
            </div>
          )}
        </div>
        
        {isRealizado && (
          <div className="tr-row-inner-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="tr-modal-campo">
              <label className="tr-modal-label" htmlFor={`ist-${label}-data`}>Data do Teste</label>
              <InputData id={`ist-${label}-data`} value={valor.dataRegistroOuTeste ?? ''} onChange={v => onChange({ ...valor, dataRegistroOuTeste: v })} />
            </div>
            <div className="tr-modal-campo">
              <label className="tr-modal-label" htmlFor={`ist-${label}-tipo`}>Tipo</label>
              <select id={`ist-${label}-tipo`} className="tr-modal-select" value={valor.tipoRegistro ?? ''} onChange={e => onChange({ ...valor, tipoRegistro: e.target.value as any || undefined })}>
                <option value="">Não informado</option>
                {Object.entries(TipoRegistroISTLabel).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </div>
            <div className="tr-modal-campo">
              <label className="tr-modal-label" htmlFor={`ist-${label}-origem`}>Origem</label>
              <SelectOrigem id={`ist-${label}-origem`} value={valor.origemDado} onChange={v => onChange({ ...valor, origemDado: v as any })} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SecaoP4: React.FC<{
  valor: EstadoFormTriagem['rastreioIST'];
  onChange: (v: EstadoFormTriagem['rastreioIST']) => void;
}> = ({ valor, onChange }) => (
  <div className="tr-modal-secao tr-secao-destaque-p4">
    <div className="tr-modal-secao-header">
      <h3 className="tr-modal-secao-titulo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Rastreio de IST — P4
      </h3>
      <p className="tr-modal-secao-desc">
        Identifique a testagem de sífilis, HIV, hepatite B e C nos últimos 12 meses. O registro bloqueia se estiver marcado como "Pendente".
      </p>
    </div>
    <div className="tr-modal-grid-2">
      <BlocoIST label="Sífilis" valor={valor.sifilis} onChange={v => onChange({ ...valor, sifilis: v })} />
      <BlocoIST label="HIV" valor={valor.hiv} onChange={v => onChange({ ...valor, hiv: v })} />
      <BlocoIST label="Hepatite B" valor={valor.hepatiteB} onChange={v => onChange({ ...valor, hepatiteB: v })} />
      <BlocoIST label="Hepatite C" valor={valor.hepatiteC} onChange={v => onChange({ ...valor, hepatiteC: v })} />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Seção P5 — Tuberculose
// ---------------------------------------------------------------------------

const SecaoP5: React.FC<{ valor: EstadoFormTriagem['tuberculose']; onChange: (v: EstadoFormTriagem['tuberculose']) => void }> = ({ valor, onChange }) => {
  const r = valor.rastreio;
  
  const handleRastreioChange = (field: keyof typeof r, val: any) => {
    onChange({ ...valor, rastreio: { ...r, [field]: val } });
  };
  
  let autoAdjustMsg = '';
  let displayState: EstadoAssistencialTB = EstadoAssistencialTB.SEM_SUSPEITA;
  
  if (r.relatoTbConfirmadaOuIndefinida === true) {
    displayState = EstadoAssistencialTB.RELATO_TB_CONFIRMADA_OU_INDEFINIDA;
    autoAdjustMsg = 'Relato ativo selecionado. A fila clínica de atenção crônica receberá prioridade.';
  } else if (r.rastreamentoTbPositivo === true) {
    displayState = EstadoAssistencialTB.SUSPEITA_CLINICA;
    autoAdjustMsg = 'Rastreamento positivo. Sinalizado alerta no painel epidemiológico para provisão de BAC/TRM.';
  }

  return (
    <div className="tr-modal-secao tr-secao-destaque-p5">
      <div className="tr-modal-secao-header">
        <h3 className="tr-modal-secao-titulo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 8v4l3 3"/></svg>
          Tuberculose — Cuidado e Gestão (P5)
        </h3>
        <p className="tr-modal-secao-desc">
          Rastreio direto admissional para a população prisional.
        </p>
      </div>

      <div className="tr-p5-container">
        
        {/* Bloco A - Questões Síntese / Rastreio */}
        <div className="tr-p5-bloco tr-p5-bloco-sintomas">
          
          <div className="tr-modal-campo" style={{ marginBottom: '16px' }}>
            <label className="tr-modal-label" style={{ color: 'var(--color-primary-dark)', fontSize: '12px' }}>
              O paciente apresenta tosse de qualquer duração ou qualquer um dos seguintes: perda de peso, sudorese noturna, febre ≥ 2 semanas, dor no peito ao respirar, escarro sanguinolento?
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button 
                type="button" 
                className={`tr-sintoma-chip ${r.rastreamentoTbPositivo === true ? 'tr-sintoma-chip--ativo' : ''}`}
                onClick={() => handleRastreioChange('rastreamentoTbPositivo', true)}
              >Sim</button>
              <button 
                type="button" 
                className={`tr-sintoma-chip ${r.rastreamentoTbPositivo === false ? 'tr-sintoma-chip--ativo' : ''}`}
                onClick={() => handleRastreioChange('rastreamentoTbPositivo', false)}
              >Não</button>
            </div>
          </div>

          <div className="tr-modal-campo" style={{ marginBottom: '16px' }}>
            <label className="tr-modal-label" style={{ color: 'var(--color-primary-dark)', fontSize: '12px' }}>
              Há relato de tuberculose confirmada, situação indefinida em acompanhamento ou tratamento interrompido recentemente?
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button 
                type="button" 
                className={`tr-sintoma-chip ${r.relatoTbConfirmadaOuIndefinida === true ? 'tr-sintoma-chip--ativo' : ''}`}
                onClick={() => handleRastreioChange('relatoTbConfirmadaOuIndefinida', true)}
              >Sim</button>
              <button 
                type="button" 
                className={`tr-sintoma-chip ${r.relatoTbConfirmadaOuIndefinida === false ? 'tr-sintoma-chip--ativo' : ''}`}
                onClick={() => handleRastreioChange('relatoTbConfirmadaOuIndefinida', false)}
              >Não</button>
            </div>
          </div>
          
          <div className="tr-modal-campo" style={{ marginTop: '12px' }}>
            <textarea className="tr-modal-textarea" rows={1} placeholder="Anotação complementar (opcional)..." value={r.observacoes ?? ''} onChange={e => handleRastreioChange('observacoes', e.target.value)} />
          </div>
        </div>

        {/* Bloco B - Situação Atual */}
        <div className="tr-p5-bloco tr-p5-bloco-status">
          <span className="tr-p5-subtitulo">Estado Assistencial Derivado</span>
          <p className="tr-modal-secao-desc" style={{ marginBottom: '8px' }}>
            Definido automaticamente pelo sistema com base nas respostas ao lado.
          </p>
          <div className="tr-p5-estado-derivado" style={{
            padding: '12px',
            background: 'var(--color-bg-light)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontWeight: 600,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            color: displayState === EstadoAssistencialTB.SEM_SUSPEITA ? 'var(--color-text-main)' : '#ef6c00'
          }}>
            <span>{EstadoAssistencialTBLabel[displayState]}</span>
            {autoAdjustMsg && (
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 400, marginTop: '4px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px', verticalAlign: 'middle'}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                {autoAdjustMsg}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};


// ---------------------------------------------------------------------------
// Seção P3 — Condições Crônicas
// ---------------------------------------------------------------------------

const SecaoCondicoesCronicas: React.FC<{ hasAtiva: boolean; dmAtiva: boolean; onToggleHas: () => void; onToggleDm: () => void; }> = ({ hasAtiva, dmAtiva, onToggleHas, onToggleDm }) => (
  <div className="tr-modal-secao">
    <div className="tr-modal-secao-header">
      <h3 className="tr-modal-secao-titulo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>Condições Crônicas Monitoradas — P3</h3>
      <p className="tr-modal-secao-desc">Indique as condições clínicas ativas para exibir os blocos de registro das boas práticas da atenção primária prisional.</p>
    </div>
    <div className="tr-condicoes-row">
      <button type="button" className={`tr-condicao-chip ${hasAtiva ? 'tr-condicao-chip--ativo' : ''}`} onClick={onToggleHas}>
        {hasAtiva && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span>Hipertensão (HAS)</span>
      </button>
      <button type="button" className={`tr-condicao-chip ${dmAtiva ? 'tr-condicao-chip--ativo' : ''}`} onClick={onToggleDm}>
        {dmAtiva && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg><span>Diabetes (DM)</span>
      </button>
    </div>
  </div>
);

const BlocoConsulta: React.FC<{ prefixId: string; valor: DadoConsulta; onChange: (v: DadoConsulta) => void; status?: string; }> = ({ prefixId, valor, onChange, status }) => (
  <div className="tr-bp-bloco">
    <div className="tr-bp-bloco-header"><span className="tr-bp-bloco-label">Última consulta clínica</span><BadgeStatus status={status} label={status === StatusBoaPratica.OK ? 'OK' : 'Pendente'} /></div>
    <div className="tr-bp-row"><div className="tr-modal-campo tr-campo-flex"><label className="tr-modal-label" htmlFor={`${prefixId}-consulta-data`}>Data</label><InputData id={`${prefixId}-consulta-data`} value={valor.data ?? ''} onChange={v => onChange({ ...valor, data: v })} /></div><div className="tr-modal-campo tr-campo-flex"><label className="tr-modal-label" htmlFor={`${prefixId}-consulta-origem`}>Origem</label><SelectOrigem id={`${prefixId}-consulta-origem`} value={valor.origem} onChange={v => onChange({ ...valor, origem: v as any })} /><div className="tr-bp-origem-badge-wrap"><BadgeOrigem origem={valor.origem} /></div></div></div>
  </div>
);

const SinaisVitaisCompartilhados: React.FC<{ pa: DadoPressaoArterial; antrop: DadoAntropometria; onChangePa: (v: DadoPressaoArterial) => void; onChangeAntrop: (v: DadoAntropometria) => void; statusPa?: string; statusAntrop?: string; }> = ({ pa, antrop, onChangePa, onChangeAntrop, statusPa, statusAntrop }) => (
  <div className="tr-modal-secao tr-secao-destaque">
    <div className="tr-modal-secao-header"><h3 className="tr-modal-secao-titulo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>Sinais Vitais e Antropometria — P3</h3><p className="tr-modal-secao-desc">Dados compartilhados.</p></div>
    <div className="tr-modal-grid-2">
      <div className="tr-bp-bloco tr-bloco-limpo">
        <div className="tr-bp-bloco-header"><span className="tr-bp-bloco-label">Pressão Arterial</span><BadgeStatus status={statusPa} label={statusPa === StatusBoaPratica.OK ? 'OK' : 'Pendente'} /></div>
        <div className="tr-bp-row tr-row-cols">
          <div className="tr-modal-campo"><label className="tr-modal-label">Data</label><InputData id="tr-pa-data" value={pa.data ?? ''} onChange={v => onChangePa({ ...pa, data: v })} /></div>
          <div className="tr-row-inner-grid">
            <div className="tr-modal-campo"><label className="tr-modal-label">PAS</label><input className="tr-modal-input" type="number" placeholder="mmHg" value={pa.pas ?? ''} onChange={e => onChangePa({ ...pa, pas: parseFloat(e.target.value) || undefined })} /></div>
            <div className="tr-modal-campo"><label className="tr-modal-label">PAD</label><input className="tr-modal-input" type="number" placeholder="mmHg" value={pa.pad ?? ''} onChange={e => onChangePa({ ...pa, pad: parseFloat(e.target.value) || undefined })} /></div>
          </div>
          <div className="tr-modal-campo"><label className="tr-modal-label">Origem</label><SelectOrigem id="tr-pa-origem" value={pa.origem} onChange={v => onChangePa({ ...pa, origem: v as any })} /></div>
        </div>
      </div>
      <div className="tr-bp-bloco tr-bloco-limpo">
        <div className="tr-bp-bloco-header"><span className="tr-bp-bloco-label">Peso e Altura</span><BadgeStatus status={statusAntrop} label={statusAntrop === StatusBoaPratica.OK ? 'OK' : 'Pendente'} /></div>
        <div className="tr-bp-row tr-row-cols">
          <div className="tr-modal-campo"><label className="tr-modal-label">Data</label><InputData id="tr-antrop-data" value={antrop.data ?? ''} onChange={v => onChangeAntrop({ ...antrop, data: v })} /></div>
          <div className="tr-row-inner-grid">
            <div className="tr-modal-campo"><label className="tr-modal-label">Peso (kg)</label><input className="tr-modal-input" type="number" step="0.1" value={antrop.peso ?? ''} onChange={e => onChangeAntrop({ ...antrop, peso: parseFloat(e.target.value) || undefined })} /></div>
            <div className="tr-modal-campo"><label className="tr-modal-label">Altura (cm)</label><input className="tr-modal-input" type="number" value={antrop.altura ?? ''} onChange={e => onChangeAntrop({ ...antrop, altura: parseFloat(e.target.value) || undefined })} /></div>
          </div>
          <div className="tr-modal-campo"><label className="tr-modal-label">Origem</label><SelectOrigem id="tr-antrop-origem" value={antrop.origem} onChange={v => onChangeAntrop({ ...antrop, origem: v as any })} /></div>
        </div>
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Validações
// ---------------------------------------------------------------------------

function validarBlocoIST(valor: DadoIST): boolean {
  if (valor.statusTestagem === StatusTestagemIST.PENDENTE) return false;
  if (valor.statusTestagem === StatusTestagemIST.NAO_REALIZADO && !valor.motivoNaoRealizado?.trim()) return false;
  if (valor.statusTestagem === StatusTestagemIST.REALIZADO) {
    if (!valor.dataRegistroOuTeste?.trim() || !valor.resultado) return false;
  }
  return true;
}

function P4PossuiPendencias(estado: EstadoFormTriagem['rastreioIST']): boolean {
  return !(
    validarBlocoIST(estado.sifilis) &&
    validarBlocoIST(estado.hiv) &&
    validarBlocoIST(estado.hepatiteB) &&
    validarBlocoIST(estado.hepatiteC)
  );
}

// ---------------------------------------------------------------------------
// Main Modal Component
// ---------------------------------------------------------------------------

export const ModalTriagem: React.FC<ModalTriagemProps> = ({ item, triagemAnterior, carregandoAnterior, aoFechar, aoSalvar, salvando }) => {
  const [estado, setEstado] = useState<EstadoFormTriagem>(ESTADO_FORM_VAZIO());
  const [reaproveitando, setReaproveitando] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);

  const [sinaisVitais, setSinaisVitais] = useState({
    pressaoArterial: { origem: OrigemDado.NAO_INFORMADO } as DadoPressaoArterial,
    antropometria:   { origem: OrigemDado.NAO_INFORMADO } as DadoAntropometria,
  });

  useEffect(() => {
    if (!item) return;
    setEstado(ESTADO_FORM_VAZIO());
    setSinaisVitais({
      pressaoArterial: { origem: OrigemDado.NAO_INFORMADO },
      antropometria:   { origem: OrigemDado.NAO_INFORMADO },
    });
    setReaproveitando(false);
    setTentouSalvar(false);
  }, [item?.internoId]);

  const reaproveitar = useCallback(() => {
    if (!triagemAnterior) return;
    setEstado({
      identificacao: { ...triagemAnterior.identificacao },
      hipertensao:   { ...triagemAnterior.hipertensao },
      diabetes:      { ...triagemAnterior.diabetes },
      rastreioIST:   { ...triagemAnterior.rastreioIST }, // P4 reaproveita
      tuberculose:   { ...triagemAnterior.tuberculose }, // P5 reaproveita
      substancias:   { registros: [...triagemAnterior.substancias.registros] },
      reaproveitouDadosAnteriores: true,
    });
    setSinaisVitais({
      pressaoArterial: triagemAnterior.hipertensao.ativa ? { ...triagemAnterior.hipertensao.pressaoArterial } : { ...triagemAnterior.diabetes.pressaoArterial },
      antropometria:   triagemAnterior.hipertensao.ativa ? { ...triagemAnterior.hipertensao.antropometria } : { ...triagemAnterior.diabetes.antropometria },
    });
    setReaproveitando(true);
  }, [triagemAnterior]);

  const bloqueioP4 = P4PossuiPendencias(estado.rastreioIST);

  const handleSalvar = useCallback(async () => {
    setTentouSalvar(true);
    if (bloqueioP4) return; // Barra se tiver pendência P4.

    const finalState = {
      ...estado,
      hipertensao: { ...estado.hipertensao, pressaoArterial: sinaisVitais.pressaoArterial, antropometria: sinaisVitais.antropometria },
      diabetes:    { ...estado.diabetes,    pressaoArterial: sinaisVitais.pressaoArterial, antropometria: sinaisVitais.antropometria },
    };
    await aoSalvar(finalState, triagemAnterior?.id ?? null);
  }, [estado, sinaisVitais, aoSalvar, triagemAnterior, bloqueioP4]);

  if (!item) return null;
  const exibeSinaisVitais = estado.hipertensao.ativa || estado.diabetes.ativa;

  return (
    <div className="tr-overlay" role="dialog" aria-modal="true" onMouseDown={e => { if (e.target === e.currentTarget && !salvando) aoFechar(); }}>
      <div className="tr-modal-container">
        <div className="tr-modal-header">
          <div className="tr-modal-header-info">
            <h2 className="tr-modal-title">Triagem Clínica</h2>
            <div className="tr-modal-header-meta">
              <span className="tr-modal-nome">{item.nomeCompleto}</span>
              <span className="tr-modal-loc"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{item.localizacaoAtual}</span>
              {item.reativado && <span className="tr-modal-badge-egresso">Retorno de Egresso</span>}
            </div>
          </div>
          <button type="button" className="tr-modal-close" onClick={aoFechar} disabled={salvando}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>

        <div className="tr-modal-body">
          {item.reativado && (
            <div className="tr-egresso-contexto">
              <div className="tr-egresso-contexto-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></div>
              <div className="tr-egresso-contexto-texto">
                <strong>Retorno de Egresso</strong> — Há triagem arquivada? {carregandoAnterior ? 'Buscando...' : (triagemAnterior ? 'Sim.' : 'Não.')}
              </div>
              {!carregandoAnterior && triagemAnterior && !reaproveitando && <button type="button" className="tr-btn-reaproveitar" onClick={reaproveitar}>Pré-preencher formulário base</button>}
            </div>
          )}

          <SecaoP1 isRetorno={item.reativado} />
          
          <SecaoIdentificacao valor={estado.identificacao} onChange={v => setEstado(prev => ({ ...prev, identificacao: v }))} />
          
          <SecaoSubstanciasPsicoativas valor={estado.substancias} onChange={v => setEstado(prev => ({ ...prev, substancias: v }))} />
          
          <SecaoP4 valor={estado.rastreioIST} onChange={v => setEstado(prev => ({ ...prev, rastreioIST: v }))} />

          {tentouSalvar && bloqueioP4 && (
            <div className="tr-erro-p4">
              A triagem não pode ser salva. Verifique o bloco P4: preencha as ISTs pendentes e informe todos os campos obrigatórios.
            </div>
          )}

          <SecaoP5 valor={estado.tuberculose} onChange={v => setEstado(prev => ({ ...prev, tuberculose: v }))} />

          <SecaoCondicoesCronicas hasAtiva={estado.hipertensao.ativa} dmAtiva={estado.diabetes.ativa} onToggleHas={() => setEstado(p => ({ ...p, hipertensao: { ...p.hipertensao, ativa: !p.hipertensao.ativa } }))} onToggleDm={() => setEstado(p => ({ ...p, diabetes: { ...p.diabetes, ativa: !p.diabetes.ativa } }))} />

          {exibeSinaisVitais && (
            <SinaisVitaisCompartilhados pa={sinaisVitais.pressaoArterial} antrop={sinaisVitais.antropometria} onChangePa={v => setSinaisVitais(s => ({ ...s, pressaoArterial: v }))} onChangeAntrop={v => setSinaisVitais(s => ({ ...s, antropometria: v }))} statusPa={sinaisVitais.pressaoArterial.data ? StatusBoaPratica.OK : StatusBoaPratica.PENDENTE} statusAntrop={sinaisVitais.antropometria.data ? StatusBoaPratica.OK : StatusBoaPratica.PENDENTE} />
          )}

          <div className={`tr-modulos-dinamicos ${estado.hipertensao.ativa && estado.diabetes.ativa ? 'tr-modulos-grid-2' : ''}`}>
            {estado.hipertensao.ativa && (
              <div className="tr-modulo tr-modulo-has">
                <div className="tr-modulo-header"><div className="tr-modulo-header-left"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><h4 className="tr-modulo-titulo">Linha Hipertensão</h4></div></div>
                <div className="tr-modulo-corpo">
                  <BlocoConsulta prefixId="tr-has" valor={estado.hipertensao.consulta} onChange={v => setEstado(p => ({ ...p, hipertensao: { ...p.hipertensao, consulta: v } }))} status={estado.hipertensao.consulta.data ? StatusBoaPratica.OK : StatusBoaPratica.PENDENTE} />
                  <div className="tr-modal-campo"><label className="tr-modal-label">Anotação Clínica Curta</label><TextareaObs id="tr-has-obs" value={estado.hipertensao.observacao ?? ''} onChange={v => setEstado(p => ({ ...p, hipertensao: { ...p.hipertensao, observacao: v } }))} /></div>
                </div>
              </div>
            )}
            {estado.diabetes.ativa && (
              <div className="tr-modulo tr-modulo-dm">
                <div className="tr-modulo-header"><div className="tr-modulo-header-left"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg><h4 className="tr-modulo-titulo">Linha Diabetes</h4></div></div>
                <div className="tr-modulo-corpo">
                  <BlocoConsulta prefixId="tr-dm" valor={estado.diabetes.consulta} onChange={v => setEstado(p => ({ ...p, diabetes: { ...p.diabetes, consulta: v } }))} status={estado.diabetes.consulta.data ? StatusBoaPratica.OK : StatusBoaPratica.PENDENTE} />
                  <div className="tr-bp-bloco tr-bp-hba1c">
                    <div className="tr-bp-bloco-header"><span className="tr-bp-bloco-label">HbA1c</span><BadgeStatus status={estado.diabetes.hemoglobinaGlicada.data ? StatusBoaPratica.OK : StatusBoaPratica.PENDENTE} label={(estado.diabetes.hemoglobinaGlicada.data ? StatusBoaPratica.OK : StatusBoaPratica.PENDENTE) === StatusBoaPratica.OK ? 'OK' : 'Pendente'} /></div>
                    <div className="tr-bp-row tr-row-cols">
                      <div className="tr-row-inner-grid" style={{ gridTemplateColumns: 'minmax(120px, 1fr) 100px' }}>
                        <div className="tr-modal-campo"><label className="tr-modal-label">Data</label><InputData id="tr-dm-hba1c-data" value={estado.diabetes.hemoglobinaGlicada.data ?? ''} onChange={v => setEstado(p => ({ ...p, diabetes: { ...p.diabetes, hemoglobinaGlicada: { ...p.diabetes.hemoglobinaGlicada, data: v } } }))} /></div>
                        <div className="tr-modal-campo"><label className="tr-modal-label">Valor (%)</label><input className="tr-modal-input" type="number" step="0.1" value={estado.diabetes.hemoglobinaGlicada.valor ?? ''} onChange={e => setEstado(p => ({ ...p, diabetes: { ...p.diabetes, hemoglobinaGlicada: { ...p.diabetes.hemoglobinaGlicada, valor: parseFloat(e.target.value) || undefined } } }))} /></div>
                      </div>
                      <div className="tr-row-inner-grid">
                        <div className="tr-modal-campo"><label className="tr-modal-label">Reg.</label><select className="tr-modal-select" value={estado.diabetes.hemoglobinaGlicada.tipoRegistro ?? ''} onChange={e => setEstado(p => ({ ...p, diabetes: { ...p.diabetes, hemoglobinaGlicada: { ...p.diabetes.hemoglobinaGlicada, tipoRegistro: e.target.value as any || undefined } } }))}><option value="">Tipo...</option>{Object.entries(TipoRegistroHba1cLabel).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select></div>
                        <div className="tr-modal-campo"><label className="tr-modal-label">Origem</label><SelectOrigem id="tr-dm-hba1c-origem" value={estado.diabetes.hemoglobinaGlicada.origem} onChange={v => setEstado(p => ({ ...p, diabetes: { ...p.diabetes, hemoglobinaGlicada: { ...p.diabetes.hemoglobinaGlicada, origem: v as any } } }))} /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="tr-modal-footer">
          <button type="button" className="tr-btn-ghost tr-btn-cancelar" onClick={aoFechar} disabled={salvando}>Cancelar (Esc)</button>
          <button type="button" className="tr-btn-primary tr-btn-salvar" onClick={handleSalvar} disabled={salvando || bloqueioP4}>
            {salvando ? <><span className="tr-spinner-sm" aria-hidden="true" />Registrando...</> : 'Concluir & Criar Atendimento P1'}
          </button>
        </div>
      </div>
    </div>
  );
};
