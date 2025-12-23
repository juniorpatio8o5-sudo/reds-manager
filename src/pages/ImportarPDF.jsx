import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, Save, Edit2, ArrowRight } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import './ImportarPDF.css';

// Configuração do Worker do PDF.js (Necessário para ler o PDF no navegador)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const ImportarPDF = () => {
  // Estados para controlar o fluxo
  const [step, setStep] = useState('upload'); // 'upload' | 'preview' | 'sending' | 'success'
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);

  // URL do Google Apps Script (Sua V6)
  const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzYGd07FGY7jApsBRCZaz1AwQs_r6l7yqMVu8l1AykhB4_pL8OTRN2GQN3hECLQ8oYI/exec';

  // --- LÓGICA DE EXTRAÇÃO (LOCAL) ---
  const extractTextFromPDF = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      // Lê as primeiras 2 páginas (geralmente onde estão os dados principais)
      const maxPages = Math.min(pdf.numPages, 2);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (err) {
      console.error("Erro ao ler PDF:", err);
      throw new Error("Não foi possível ler o texto deste PDF. Ele pode ser uma imagem escaneada?");
    }
  };

  const parseREDSText = (text) => {
    // Tenta encontrar padrões comuns em REDS da PMMG
    // Nota: Regex pode precisar de ajustes dependendo do layout exato do seu PDF
    
    // Procura padrão 202X-XXXXXXXX-XXX
    const redsMatch = text.match(/(\d{4}-\d{9}-\d{3})/);
    // Procura datas (dd/mm/aaaa)
    const dataMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
    // Procura hora (HH:MM)
    const horaMatch = text.match(/(\d{2}:\d{2})/);
    // Tenta achar natureza (ex: B01121)
    const naturezaMatch = text.match(/([A-Z]\d{5})/);

    return {
      numeroBO: 'AUTO-' + Math.floor(Math.random() * 1000), // BO as vezes é difícil de achar, gerando placeholder
      numeroREDS: redsMatch ? redsMatch[0] : '',
      dataFato: dataMatch ? dataMatch[0].split('/').reverse().join('-') : new Date().toISOString().split('T')[0],
      horaFato: horaMatch ? horaMatch[0] : '12:00',
      natureza: naturezaMatch ? naturezaMatch[0] + ' - OCORRENCIA' : 'OUTROS',
      tentadoConsumado: text.includes('TENTADO') ? 'TENTADO' : 'CONSUMADO',
      logradouro: 'Extraído do PDF (Editar)', // Logradouros são difíceis de isolar sem âncoras fixas
      bairro: 'Centro',
      municipio: 'Belo Horizonte',
      uf: 'MG',
      historico: 'Importação automática via sistema web.',
      envolvidos: [] // Extração de envolvidos é complexa, deixamos vazio para preencher manual ou futura IA
    };
  };

  const handleProcessFile = async () => {
    if (!file) return;
    setError(null);
    setStep('processing');

    try {
      const text = await extractTextFromPDF(file);
      const data = parseREDSText(text);
      
      setPreviewData(data);
      setStep('preview'); // Vai para a tela de conferência
    } catch (err) {
      setError(err.message);
      setStep('upload');
    }
  };

  // --- LÓGICA DE ENVIO (MÉTODO SEGURO v6) ---
  const handleFinalSend = async () => {
    setStep('sending');
    try {
      // Usa URLSearchParams para evitar CORS (Preflight)
      const formData = new URLSearchParams();
      formData.append('action', 'create');
      formData.append('data', JSON.stringify(previewData));

      const response = await fetch(SHEETS_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      
      const json = await response.json();
      if (json.status === 'error') throw new Error(json.message);

      setStep('success');
    } catch (err) {
      setError("Erro ao salvar: " + err.message);
      setStep('preview'); // Volta para o preview para tentar de novo
    }
  };

  // Funções para editar os dados no formulário de preview
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPreviewData(prev => ({ ...prev, [name]: value }));
  };

  // --- RENDERIZAÇÃO ---
  return (
    <div className="importar-pdf">
      <div className="page-header">
        <h1>Processador de REDS</h1>
        <p>Extração Local &gt; Conferência &gt; Envio</p>
      </div>

      {/* ETAPA 1: UPLOAD */}
      {step === 'upload' || step === 'processing' ? (
        <div className="upload-area">
          <div className="upload-box">
            <Upload size={48} className="upload-icon" />
            <h3>Carregar PDF do REDS</h3>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={(e) => setFile(e.target.files[0])} 
              id="pdf-input" 
              className="file-input" 
            />
            <label htmlFor="pdf-input" className="upload-button">
              {file ? file.name : "Escolher Arquivo"}
            </label>
            
            {file && (
              <button 
                onClick={handleProcessFile} 
                disabled={step === 'processing'}
                className="btn-primary"
                style={{marginTop: '20px', width: '100%'}}
              >
                {step === 'processing' ? <Loader className="spinning" /> : <ArrowRight />}
                {step === 'processing' ? ' Lendo PDF...' : ' Ler Dados e Conferir'}
              </button>
            )}
          </div>
          {error && <div className="alert alert-error">{error}</div>}
        </div>
      ) : null}

      {/* ETAPA 2: PREVIEW E EDIÇÃO */}
      {step === 'preview' || step === 'sending' ? (
        <div className="preview-area animate-fade-in">
          <div className="preview-header">
            <h2><Edit2 size={20}/> Conferência de Dados</h2>
            <p>Verifique se os dados extraídos estão corretos antes de salvar.</p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Número REDS</label>
              <input name="numeroREDS" value={previewData.numeroREDS} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Natureza</label>
              <input name="natureza" value={previewData.natureza} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Data Fato</label>
              <input type="date" name="dataFato" value={previewData.dataFato} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Hora</label>
              <input type="time" name="horaFato" value={previewData.horaFato} onChange={handleInputChange} />
            </div>
            <div className="form-group full-width">
              <label>Endereço / Logradouro</label>
              <input name="logradouro" value={previewData.logradouro} onChange={handleInputChange} />
            </div>
             <div className="form-group full-width">
              <label>Histórico Resumido</label>
              <textarea name="historico" value={previewData.historico} onChange={handleInputChange} rows={3} />
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="action-buttons">
            <button className="btn-secondary" onClick={() => setStep('upload')}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleFinalSend} disabled={step === 'sending'}>
              {step === 'sending' ? <Loader className="spinning"/> : <Save />}
              {step === 'sending' ? ' Salvando...' : ' Confirmar e Enviar para Planilha'}
            </button>
          </div>
        </div>
      ) : null}

      {/* ETAPA 3: SUCESSO */}
      {step === 'success' && (
        <div className="result-success animate-fade-in">
          <CheckCircle size={64} color="#10B981" />
          <h2>Registro Salvo com Sucesso!</h2>
          <p>Os dados foram conferidos e enviados para a estatística.</p>
          <button onClick={() => {setFile(null); setStep('upload');}} className="btn-secondary">
            Processar Outro
          </button>
        </div>
      )}
    </div>
  );
};

export default ImportarPDF;