import React, { useState } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Line, AreaChart, Area
} from 'recharts'
import { 
  BarChart3, TrendingUp, ShieldAlert, Award, MapPin, 
  Map, Activity
} from 'lucide-react'
import { 
  PageTransition, Card, KPICard, Select, Skeleton, Badge 
} from '@/design-system'
import { useDashboardSummary } from '../dashboard/hooks/useDashboard'
import styles from './AnalyticsPage.module.css'

interface SectorInfo {
  name: string
  activeCases: number
  patrols: number
  density: string
  alertLevel: 'Critical' | 'Elevated' | 'Normal'
  coordinates: string
}

const sectorData: Record<string, SectorInfo> = {
  'sec18': { name: 'Sector 18 Precinct', activeCases: 42, patrols: 6, density: '88%', alertLevel: 'Critical', coordinates: '28.5629° N, 77.2090° E' },
  'cp': { name: 'Connaught Place', activeCases: 28, patrols: 8, density: '72%', alertLevel: 'Elevated', coordinates: '28.6304° N, 77.2177° E' },
  'hk': { name: 'Hauz Khas Sector', activeCases: 14, patrols: 4, density: '45%', alertLevel: 'Normal', coordinates: '28.5494° N, 77.2001° E' },
  'saket': { name: 'Saket Precinct', activeCases: 22, patrols: 5, density: '60%', alertLevel: 'Elevated', coordinates: '28.5244° N, 77.2066° E' },
  'vk': { name: 'Vasant Kunj division', activeCases: 9, patrols: 3, density: '28%', alertLevel: 'Normal', coordinates: '28.5398° N, 77.1435° E' }
}

export const AnalyticsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState('monthly')
  const { data: superData, isLoading } = useDashboardSummary()

  // Map settings
  const [activeOverlay, setActiveOverlay] = useState<'heatmap' | 'stations' | 'pins'>('heatmap')
  const [selectedSector, setSelectedSector] = useState<SectorInfo | null>(sectorData['sec18'])

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Skeleton width="200px" height="32px" />
        </div>
        <div className={styles.kpiRow}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} height="100px" />
          ))}
        </div>
        <div className={styles.chartsGrid}>
          <Skeleton height="350px" />
          <Skeleton height="350px" />
        </div>
      </div>
    )
  }

  const activeCount = superData?.total_active_cases || 0

  // Mock crime forecasting dataset (seasonal forecasts)
  const crimeForecastData = [
    { name: 'Week 1', actual: 32, forecast: 30, upper: 35, lower: 25 },
    { name: 'Week 2', actual: 38, forecast: 34, upper: 40, lower: 28 },
    { name: 'Week 3', actual: 29, forecast: 36, upper: 42, lower: 30 },
    { name: 'Week 4', actual: 42, forecast: 38, upper: 44, lower: 32 },
    { name: 'Week 5', forecast: 40, upper: 48, lower: 34 },
    { name: 'Week 6', forecast: 45, upper: 52, lower: 38 },
    { name: 'Week 7', forecast: 42, upper: 50, lower: 35 },
    { name: 'Week 8', forecast: 48, upper: 56, lower: 40 }
  ]

  // Reported incidents by category bar chart
  const crimeBarData = [
    { category: 'Theft', count: 24 },
    { category: 'Cybercrime', count: 18 },
    { category: 'Traffic', count: 32 },
    { category: 'Domestic', count: 12 },
    { category: 'Other', count: 15 },
  ]

  // Officer workload dataset
  const workloadData = (superData?.investigators_workload || []).map((wk: any) => ({
    name: wk.username,
    active: wk.active_cases,
    resolved: wk.resolved_cases,
  }))

  const handleSectorClick = (key: string) => {
    setSelectedSector(sectorData[key] || null)
  }

  return (
    <PageTransition className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Crime GIS & Intelligence Analytics</h1>
        </div>
        <div style={{ minWidth: '180px' }}>
          <Select
            id="analyticsTime"
            options={[
              { value: 'weekly', label: 'Last 7 Days' },
              { value: 'monthly', label: 'Last 30 Days' },
              { value: 'yearly', label: 'Last 365 Days' },
            ]}
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiRow}>
        <KPICard
          label="Active Crimes"
          value={activeCount}
          icon={<ShieldAlert size={24} color="var(--primary)" />}
          subtext="Assigned in-progress cases"
        />
        <KPICard
          label="Pending Case Reviews"
          value={superData?.total_pending_complaints || 0}
          icon={<BarChart3 size={24} color="var(--warning)" />}
          subtext="Unprocessed intake complaints"
        />
        <KPICard
          label="Crime Clearance Rate"
          value="74.2%"
          icon={<Award size={24} color="var(--success)" />}
          subtext="Resolved vs total logged"
        />
        <KPICard
          label="Active Duty Patrols"
          value="26 Patrols"
          icon={<TrendingUp size={24} color="var(--accent)" />}
          subtext="Coordinated district patrols"
        />
      </div>

      {/* GIS map & Forecaster split row */}
      <div className={styles.gisContainer}>
        
        {/* Interactive SVG GIS Map Panel */}
        <div className={styles.mapPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Map size={16} color="var(--primary)" /> Coordinated District GIS Plotter
            </span>
            <div className={styles.mapFilters}>
              <button 
                className={`${styles.mapToggleBtn} ${activeOverlay === 'heatmap' ? styles.mapToggleBtnActive : ''}`}
                onClick={() => setActiveOverlay('heatmap')}
              >
                Heatmap Grid
              </button>
              <button 
                className={`${styles.mapToggleBtn} ${activeOverlay === 'stations' ? styles.mapToggleBtnActive : ''}`}
                onClick={() => setActiveOverlay('stations')}
              >
                Precinct Units
              </button>
              <button 
                className={`${styles.mapToggleBtn} ${activeOverlay === 'pins' ? styles.mapToggleBtnActive : ''}`}
                onClick={() => setActiveOverlay('pins')}
              >
                Incident Pins
              </button>
            </div>
          </div>

          <svg className={styles.mapSvg} viewBox="0 0 500 350">
            {/* South Delhi District Sectors outline */}
            {/* Sector 18 (North-West) - Critical */}
            <path 
              d="M 50,50 L 220,50 L 180,180 L 50,140 Z" 
              fill={activeOverlay === 'heatmap' ? '#ef4444' : '#1e293b'} 
              fillOpacity={activeOverlay === 'heatmap' ? '0.45' : '0.8'}
              stroke="#475569" 
              strokeWidth="1.5"
              className={styles.mapSector}
              onClick={() => handleSectorClick('sec18')}
            />
            {/* Connaught Place (North-East) - Elevated */}
            <path 
              d="M 220,50 L 450,70 L 410,180 L 180,180 Z" 
              fill={activeOverlay === 'heatmap' ? '#f59e0b' : '#1e293b'} 
              fillOpacity={activeOverlay === 'heatmap' ? '0.45' : '0.8'}
              stroke="#475569" 
              strokeWidth="1.5"
              className={styles.mapSector}
              onClick={() => handleSectorClick('cp')}
            />
            {/* Hauz Khas (Center) - Normal */}
            <path 
              d="M 180,180 L 410,180 L 320,300 L 130,280 Z" 
              fill={activeOverlay === 'heatmap' ? '#10b981' : '#1e293b'} 
              fillOpacity={activeOverlay === 'heatmap' ? '0.35' : '0.8'}
              stroke="#475569" 
              strokeWidth="1.5"
              className={styles.mapSector}
              onClick={() => handleSectorClick('hk')}
            />
            {/* Saket (South-East) - Elevated */}
            <path 
              d="M 410,180 L 480,220 L 430,320 L 320,300 Z" 
              fill={activeOverlay === 'heatmap' ? '#f59e0b' : '#1e293b'} 
              fillOpacity={activeOverlay === 'heatmap' ? '0.4' : '0.8'}
              stroke="#475569" 
              strokeWidth="1.5"
              className={styles.mapSector}
              onClick={() => handleSectorClick('saket')}
            />
            {/* Vasant Kunj (South-West) - Normal */}
            <path 
              d="M 50,140 L 180,180 L 130,280 L 40,260 Z" 
              fill={activeOverlay === 'heatmap' ? '#10b981' : '#1e293b'} 
              fillOpacity={activeOverlay === 'heatmap' ? '0.3' : '0.8'}
              stroke="#475569" 
              strokeWidth="1.5"
              className={styles.mapSector}
              onClick={() => handleSectorClick('vk')}
            />

            {/* Police Station locators */}
            {activeOverlay === 'stations' && (
              <g className={styles.pinsGroup} fill="var(--primary)">
                {/* Station coordinates */}
                <circle cx="120" cy="90" r="6" />
                <circle cx="300" cy="110" r="6" />
                <circle cx="260" cy="220" r="6" />
                <circle cx="390" cy="250" r="6" />
                <circle cx="100" cy="200" r="6" />
              </g>
            )}

            {/* Incident hot points */}
            {activeOverlay === 'pins' && (
              <g className={styles.pinsGroup} fill="#ef4444">
                <circle cx="90" cy="80" r="5" />
                <circle cx="140" cy="110" r="5" />
                <circle cx="320" cy="130" r="5" />
                <circle cx="380" cy="100" r="5" />
                <circle cx="210" cy="210" r="5" />
                <circle cx="280" cy="260" r="5" />
              </g>
            )}

            {/* Labels on SVG */}
            <text x="120" y="100" fill="#cbd5e1" fontSize="9" fontWeight="bold" pointerEvents="none">SEC_18</text>
            <text x="320" y="120" fill="#cbd5e1" fontSize="9" fontWeight="bold" pointerEvents="none">CP_DIST</text>
            <text x="240" y="230" fill="#cbd5e1" fontSize="9" fontWeight="bold" pointerEvents="none">HAUZ_KHAS</text>
            <text x="400" y="240" fill="#cbd5e1" fontSize="9" fontWeight="bold" pointerEvents="none">SAKET</text>
            <text x="90" y="220" fill="#cbd5e1" fontSize="9" fontWeight="bold" pointerEvents="none">V_KUNJ</text>
          </svg>

          {/* Hover Details overlay */}
          {selectedSector && (
            <div style={{ marginTop: 12, padding: 10, background: 'var(--muted)', borderRadius: 6, fontSize: 11, border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <strong>{selectedSector.name} Summary</strong>
                <Badge status={selectedSector.alertLevel === 'Critical' ? 'danger' : 'warning'}>
                  {selectedSector.alertLevel} Alert
                </Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 10 }}>
                <div>Active Crimes: {selectedSector.activeCases} | Patrols: {selectedSector.patrols}</div>
                <div>Density: {selectedSector.density} | Coordinates: {selectedSector.coordinates}</div>
              </div>
            </div>
          )}
        </div>

        {/* Predictive AI Forecasting panel */}
        <div className={styles.forecastPanel}>
          <Card title="AI Crime Trend Forecast (Next 30 Days)">
            <div style={{ height: '240px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={crimeForecastData}>
                  <defs>
                    <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', fontSize: 11 }} />
                  <Area type="monotone" dataKey="upper" stroke="none" fill="rgba(37,99,235,0.1)" name="Confidence Max Range" />
                  <Line type="monotone" dataKey="actual" stroke="var(--success)" strokeWidth={2} name="Actual Incidents" />
                  <Line type="monotone" dataKey="forecast" stroke="var(--primary)" strokeWidth={2} strokeDasharray="4 4" name="Predicted Forecast" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 8, display: 'flex', gap: 6 }}>
              <Activity size={12} color="var(--primary)" />
              <span>AI model estimates theft/cyber cases to experience a temporary 14% elevation in week 6 before stabilising.</span>
            </div>
          </Card>

          {/* Operational Bottlenecks list */}
          <Card title="Operational Bottlenecks & Resolution Speed">
            <div className={styles.hotspotsList}>
              <div className={styles.hotspotItem}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <MapPin size={16} color="var(--danger)" />
                  <span className={styles.hotspotName}>Sector 18 Cyber Phishing</span>
                </div>
                <span>Avg Resolution: <strong>14.2 Days</strong></span>
              </div>
              <div className={styles.hotspotItem}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <MapPin size={16} color="var(--warning)" />
                  <span className={styles.hotspotName}>Connaught Place Robbery Squad</span>
                </div>
                <span>Avg Resolution: <strong>9.8 Days</strong></span>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* Recharts Workload grids */}
      <div className={styles.chartsGrid}>
        
        {/* Incident types */}
        <Card title="Reported Incidents by Crime Category">
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={crimeBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="category" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Officer cases */}
        <Card title="Assigned Case Workloads by Force Officer">
          <div style={{ height: '240px', width: '100%' }}>
            {workloadData.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}>
                No active force workloads logged in this station.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }} />
                  <Bar dataKey="active" fill="var(--primary)" name="Active Cases" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" fill="var(--success)" name="Resolved Cases" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

      </div>
    </PageTransition>
  )
}
export default AnalyticsPage
