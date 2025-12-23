import React from 'react';
import { FileText, Activity, Users, TrendingUp } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Sistema de Gerenciamento de REDS - PMMG 19ª CIA TM</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(26, 77, 46, 0.2)'}}>
            <FileText size={24} style={{color: '#2d7a4a'}} />
          </div>
          <div className="stat-content">
            <h3>Total de REDS</h3>
            <div className="stat-value">0</div>
            <p>Registros no sistema</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(59, 130, 246, 0.2)'}}>
            <Activity size={24} style={{color: '#3b82f6'}} />
          </div>
          <div className="stat-content">
            <h3>Este Mês</h3>
            <div className="stat-value">0</div>
            <p>Novos registros</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(239, 68, 68, 0.2)'}}>
            <TrendingUp size={24} style={{color: '#ef4444'}} />
          </div>
          <div className="stat-content">
            <h3>Ocorrências</h3>
            <div className="stat-value">0</div>
            <p>Em análise</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(245, 158, 11, 0.2)'}}>
            <Users size={24} style={{color: '#f59e0b'}} />
          </div>
          <div className="stat-content">
            <h3>Envolvidos</h3>
            <div className="stat-value">0</div>
            <p>Total registrado</p>
          </div>
        </div>
      </div>

      <div className="welcome-message">
        <h2>🚔 Bem-vindo ao REDS Manager!</h2>
        <p>Sistema funcionando corretamente. Comece criando seus primeiros registros.</p>
      </div>
    </div>
  );
};

export default Dashboard;