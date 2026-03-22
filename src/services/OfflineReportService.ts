// src/services/OfflineReportService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const OFFLINE_REPORTS_KEY = '@offline_reports';
const API_URL = 'http://192.168.1.84:4000/api';

export interface OfflineReport {
  id: string;
  tipo: string;
  descripcion: string;
  lat: number;
  lng: number;
  createdAt: string;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

class OfflineReportService {
  
  async saveOfflineReport(reporte: { tipo: string; descripcion: string; lat: number; lng: number }): Promise<string> {
    try {
      const pendingReports = await this.getPendingReports();
      
      const newReport: OfflineReport = {
        ...reporte,
        id: `offline_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      
      pendingReports.push(newReport);
      await AsyncStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(pendingReports));
      
      console.log('💾 Reporte guardado offline:', newReport.id);
      return newReport.id;
    } catch (error) {
      console.error('Error guardando reporte offline:', error);
      throw error;
    }
  }
  
  async getPendingReports(): Promise<OfflineReport[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_REPORTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error obteniendo reportes offline:', error);
      return [];
    }
  }
  
  async syncPendingReports(token: string): Promise<{ synced: number; failed: number }> {
    const pendingReports = await this.getPendingReports();
    const pendingToSync = pendingReports.filter(r => r.status === 'pending');
    
    if (pendingToSync.length === 0) {
      console.log('📭 No hay reportes pendientes');
      return { synced: 0, failed: 0 };
    }
    
    console.log(`🔄 Sincronizando ${pendingToSync.length} reportes...`);
    
    let synced = 0;
    let failed = 0;
    
    for (const report of pendingToSync) {
      try {
        await this.updateReportStatus(report.id, 'syncing');
        
        await axios.post(`${API_URL}/reportes`, {
          tipo: report.tipo,
          descripcion: report.descripcion,
          lat: report.lat,
          lng: report.lng
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        await this.updateReportStatus(report.id, 'completed');
        synced++;
        console.log(`✅ Reporte ${report.id} sincronizado`);
        
      } catch (error) {
        console.error(`❌ Error en reporte ${report.id}:`, error);
        await this.updateReportStatus(report.id, 'failed');
        failed++;
      }
    }
    
    await this.cleanCompletedReports();
    console.log(`📊 Sincronización: ${synced} OK, ${failed} fallidos`);
    
    return { synced, failed };
  }
  
  async updateReportStatus(id: string, status: OfflineReport['status']): Promise<void> {
    const reports = await this.getPendingReports();
    const index = reports.findIndex(r => r.id === id);
    
    if (index !== -1) {
      reports[index].status = status;
      await AsyncStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(reports));
    }
  }
  
  async cleanCompletedReports(): Promise<void> {
    const reports = await this.getPendingReports();
    const activeReports = reports.filter(r => r.status !== 'completed');
    await AsyncStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(activeReports));
  }
  
  async getPendingCount(): Promise<number> {
    const reports = await this.getPendingReports();
    return reports.filter(r => r.status === 'pending').length;
  }
}

export const offlineReportService = new OfflineReportService();