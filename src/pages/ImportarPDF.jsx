import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import './ImportarPDF.css';

// NOTA: Para extração REAL de PDF no navegador, recomenda-se instalar: npm install pdfjs-dist
// Importaríamos assim: import * as pdfjsLib from 'pdfjs-dist';
// pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const ImportarPDF = () => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else {
      setError('Por favor, selecione um arquivo PDF válido');
      setFile(null);
    }
  };

  const extractDataFromPDF = async (pdfFile) => {
    // === MOCK DE EXTRAÇÃO MANTIDO (PARA VALIDAR O FLUXO DE ENVIO PRIMEIRO) ===
    // Se desejar a implementação real com pdfjs-dist, posso fornecer em um arquivo separado.
    
    return new Promise((resolve) => {
      console.log("Iniciando extração simulada...");
      setTimeout(() => {
        resolve({
          numeroBO: 'MOCK-' + Math.floor(Math.random() * 10000), // Randomizado para testar inserções
          numeroREDS: '2025-050125657-001',
          dataFato: new Date().toISOString().split('T')[0],
          horaFato: '11:57',
          natureza: 'B01121 - HOMICIDIO',
          tentadoConsumado: 'CONSUMADO',
          logradouro: 'RODOVIA ANEL RODOVIARIO / RUA JOAQUIM GOUVEA',
          bairro: 'VILA SAO PAULO',
          municipio: 'BELO HORIZONTE',
          uf: 'MG',
          historico: 'Dados extraídos via Web App Batalhão.',
          envolvidos: [
            {
              nome: 'LUAN ALEX ALVES DE SOUSA',
              tipo: 'VITIMA',
              cpf: '09093835610',
              dataNascimento: '1990-08-29'
            }
          ]
        });
      }, 2000);
    });
  };

  const sendToGoogleSheets = async (data) => {
    // URL do seu Script implantado
    const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzYGd07FGY7jApsBRCZaz1AwQs_r6l7yqMVu8l1AykhB4_pL8OTRN2GQN3hECLQ8oYI/exec';
    
    // Payload envelopado conforme seu backend espera
    const payload = {
      action: 'create',
      data: data
    };

    try {
      // === CORREÇÃO CRÍTICA AQUI ===
      // 1. Usamos POST.
      // 2. Body deve ser string.
      // 3. NÃO definir 'Content-Type': 'application/json'. Deixe o navegador enviar como text/plain
      //    para evitar o Preflight (OPTIONS request) que o Google Apps Script bloqueia.
      
      const response = await fetch(SHEETS_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
        // mode: 'cors' é o default, não precisa especificar, mas garante que queremos ler a resposta.
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const jsonResponse = await response.json();

      if (jsonResponse.status === 'error') {
        throw new Error(jsonResponse.message);
      }

      return jsonResponse;
    } catch (error) {
      console.error("Erro no envio:", error);
      throw new Error('Falha na comunicação com a planilha: ' + error.message);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Selecione um arquivo PDF primeiro');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Passo 1: Extrair dados do PDF
      const extractedData = await extractDataFromPDF(file);
      
      // Passo 2: Enviar para Google Sheets
      const response = await sendToGoogleSheets(extractedData);
      
      setResult({
        success: true,
        message: response.message || 'Dados enviados com sucesso!',
        data: extractedData,
        dbId: response.data?.id // ID retornado pelo GAS
      });
    } catch (err) {
      setError(err.message || 'Erro ao processar o PDF');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="importar-pdf">
      <div className="page-header">
        <h1>📄 Importar REDS via PDF</h1>
        <p>Faça upload do PDF do Boletim de Ocorrência e os dados serão extraídos automaticamente</p>
      </div>

      {/* Área de Upload */}
      <div className="upload-area">
        <div className="upload-box">
          <Upload size={48} className="upload-icon" />
          <h3>Arraste o PDF aqui ou clique para selecionar</h3>
          <p>Formato aceito: PDF (até 10MB)</p>
          
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="file-input"
            id="pdf-input"
          />
          <label htmlFor="pdf-input" className="upload-button">
            Selecionar PDF
          </label>
        </div>

        {/* Arquivo Selecionado */}
        {file && (
          <div className="file-selected">
            <FileText size={24} />
            <div className="file-info">
              <h4>{file.name}</h4>
              <p>{(file.size / 1024).toFixed(2)} KB</p>
            </div>
            <button 
              onClick={handleUpload}
              disabled={processing}
              className="btn-primary"
            >
              {processing ? (
                <>
                  <Loader className="spinning" size={18} />
                  Processando...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Processar e Enviar
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Processamento */}
      {processing && (
        <div className="processing-status">
          <Loader className="spinning" size={32} />
          <h3>Processando transação...</h3>
          <div className="processing-steps">
            <div className="step active">
              <div className="step-number">1</div>
              <span>Lendo PDF (Mock)</span>
            </div>
            <div className="step active">
              <div className="step-number">2</div>
              <span>Conectando ao Sheets</span>
            </div>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Resultado */}
      {result && result.success && (
        <div className="result-success">
          <div className="success-header">
            <CheckCircle size={48} />
            <h2>✅ Sucesso!</h2>
            <p>{result.message}</p>
            {result.dbId && <small>ID do Registro: {result.dbId}</small>}
          </div>

          <div className="extracted-data">
            <h3>Dados Registrados:</h3>
            <div className="data-grid">
              <div className="data-item">
                <strong>Número BO:</strong>
                <span>{result.data.numeroBO}</span>
              </div>
              <div className="data-item">
                <strong>Natureza:</strong>
                <span>{result.data.natureza}</span>
              </div>
              <div className="data-item">
                <strong>Local:</strong>
                <span>{result.data.logradouro}</span>
              </div>
            </div>

            <div className="envolvidos-section">
              <h4>Envolvidos:</h4>
              {result.data.envolvidos.map((envolvido, index) => (
                <div key={index} className="envolvido-item">
                  <strong>{envolvido.nome}</strong>
                  <span className="badge">{envolvido.tipo}</span>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => {
              setFile(null);
              setResult(null);
            }}
            className="btn-secondary"
          >
            Processar Outro PDF
          </button>
        </div>
      )}

      {/* Instruções */}
      <div className="instructions">
        <h3>📋 Status do Sistema:</h3>
        <ul>
          <li><strong>API Backend:</strong> Google Apps Script (Conectado)</li>
          <li><strong>Modo de Envio:</strong> Simple Request (Sem Preflight)</li>
        </ul>
      </div>
    </div>
  );
};

export default ImportarPDF;