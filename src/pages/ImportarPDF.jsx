import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import './ImportarPDF.css';

const ImportarPDF = () => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // URL do seu Script confirmada
  const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzYGd07FGY7jApsBRCZaz1AwQs_r6l7yqMVu8l1AykhB4_pL8OTRN2GQN3hECLQ8oYI/exec';

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
    // Simulação mantida para teste de conexão
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          numeroBO: 'MOCK-' + Math.floor(Math.random() * 10000),
          numeroREDS: '2025-050125657-001',
          dataFato: new Date().toISOString().split('T')[0],
          horaFato: '12:00',
          natureza: 'B01121 - HOMICIDIO',
          tentadoConsumado: 'CONSUMADO',
          logradouro: 'AVENIDA AMAZONAS',
          bairro: 'CENTRO',
          municipio: 'BELO HORIZONTE',
          uf: 'MG',
          historico: 'Dados inseridos via App Web v3.',
          envolvidos: [
            {
              nome: 'ENVOLVIDO TESTE',
              tipo: 'AUTOR',
              cpf: '12345678900',
              dataNascimento: '1995-01-01'
            }
          ]
        });
      }, 1500);
    });
  };

  const sendToGoogleSheets = async (data) => {
    const payload = {
      action: 'create',
      data: data
    };

    try {
      // === CORREÇÃO DEFINITIVA DE CORS ===
      // O fetch padrão envia headers que o Google não aceita.
      // Usando o Content-Type text/plain, o navegador faz um "Simple Request"
      // e pula a verificação de segurança (Preflight) que estava dando erro.
      
      const response = await fetch(SHEETS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', 
        },
        body: JSON.stringify(payload)
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
      console.error("Erro detalhado:", error);
      throw new Error(
        'Falha na conexão. Se o erro persistir, verifique se a URL do script mudou.'
      );
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
      const extractedData = await extractDataFromPDF(file);
      const response = await sendToGoogleSheets(extractedData);
      
      setResult({
        success: true,
        message: 'Conexão estabelecida! REDS registrado com sucesso na planilha.',
        data: extractedData,
        dbId: response.data?.id
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="importar-pdf">
      <div className="page-header">
        <h1>📄 Importar REDS via PDF</h1>
        <p>Status: Conectado ao Google Sheets</p>
      </div>

      <div className="upload-area">
        <div className="upload-box">
          <Upload size={48} className="upload-icon" />
          <h3>Selecione o PDF</h3>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="file-input"
            id="pdf-input"
          />
          <label htmlFor="pdf-input" className="upload-button">
            Selecionar Arquivo
          </label>
        </div>

        {file && (
          <div className="file-selected">
            <FileText size={24} />
            <div className="file-info">
              <h4>{file.name}</h4>
            </div>
            <button 
              onClick={handleUpload}
              disabled={processing}
              className="btn-primary"
            >
              {processing ? <Loader className="spinning" /> : <Upload size={18} />}
              {processing ? ' Enviando...' : ' Enviar Agora'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {result && result.success && (
        <div className="result-success">
          <div className="success-header">
            <CheckCircle size={48} />
            <h2>✅ Sucesso Total!</h2>
            <p>{result.message}</p>
          </div>
          <button onClick={() => {setFile(null); setResult(null);}} className="btn-secondary">
            Novo Envio
          </button>
        </div>
      )}
    </div>
  );
};

export default ImportarPDF;