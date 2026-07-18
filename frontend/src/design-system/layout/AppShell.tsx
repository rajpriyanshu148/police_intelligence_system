import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu, LogOut, Sun, Moon, Shield, FileText,
  LayoutDashboard, Search, Users, Download, UserCheck,
  Settings, User, Bell, Eye, Gavel, Cpu, MapPin,
  Database, Scale
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { HoverScale } from '@/design-system/motion/motion-primitives'
import styles from './AppShell.module.css'

interface AppShellProps {
  children: React.ReactNode
}

// Notification data
const mockNotifications = [
  { id: 'n1', type: 'case', text: 'New Case #CASE-2026-0812 assigned to you', time: '2 min ago', read: false, priority: 'high', category: 'Assignment', path: '/cases/1' },
  { id: 'n2', type: 'evidence', text: 'CCTV Spot clip processed successfully by AI', time: '18 min ago', read: false, priority: 'medium', category: 'AI Advice', path: '/evidence' },
  { id: 'n3', type: 'fir', text: 'FIR File #FIR-2026-08 approved by Supervisor', time: '1 hr ago', read: true, priority: 'medium', category: 'Review', path: '/firs' },
  { id: 'n4', type: 'court', text: 'First Court Appearance tomorrow at 10:30 AM', time: '2 hr ago', read: true, priority: 'high', category: 'Reminder', path: '/cases/1' }
]

const navSections = [
  {
    label: 'Operations',
    items: [
      { label: 'Command Center', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SUPERVISOR', 'INVESTIGATOR'] },
      { label: 'Investigation Workspace', path: '/cases', icon: Shield, roles: ['ADMIN', 'SUPERVISOR', 'INVESTIGATOR'] },
      { label: 'Complaint Intake', path: '/complaints', icon: FileText, roles: ['ADMIN', 'SUPERVISOR', 'INVESTIGATOR'] },
      { label: 'Court & Prosecution', path: '/court', icon: Scale, roles: ['ADMIN', 'SUPERVISOR', 'INVESTIGATOR'] },
    ]
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'FIR Workspace', path: '/firs', icon: Gavel, roles: ['ADMIN', 'SUPERVISOR', 'INVESTIGATOR'] },
      { label: 'Digital Evidence Hub', path: '/evidence', icon: Database, roles: ['ADMIN', 'SUPERVISOR', 'INVESTIGATOR'] },
      { label: 'Document Center', path: '/documents', icon: FileText, roles: ['ADMIN', 'SUPERVISOR', 'INVESTIGATOR'] },
      { label: 'Citizen Registry', path: '/citizens', icon: Users, roles: ['ADMIN', 'SUPERVISOR', 'INVESTIGATOR'] },
      { label: 'Enterprise Search', path: '/search', icon: Search, roles: ['ADMIN', 'SUPERVISOR', 'INVESTIGATOR'] },
    ]
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Crime Intelligence', path: '/analytics', icon: MapPin, roles: ['ADMIN', 'SUPERVISOR', 'INVESTIGATOR'] },
      { label: 'Officer Profiles', path: '/officers', icon: UserCheck, roles: ['ADMIN', 'SUPERVISOR'] },
      { label: 'Reports & Exports', path: '/reports', icon: Download, roles: ['ADMIN', 'SUPERVISOR'] },
    ]
  },
  {
    label: 'System',
    items: [
      { label: 'Administration', path: '/admin', icon: Settings, roles: ['ADMIN'] },
      { label: 'Audit & Compliance', path: '/telemetry', icon: Eye, roles: ['ADMIN'] },
      { label: 'System Health', path: '/telemetry', icon: Cpu, roles: ['ADMIN'] },
    ]
  }
]

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { setTheme, resolvedTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  // Filter section items by role
  const getVisibleSections = () => {
    return navSections.map(section => ({
      ...section,
      items: section.items.filter(item =>
        user && item.roles.includes(user.role)
      )
    })).filter(section => section.items.length > 0)
  }

  const visibleSections = getVisibleSections()

  return (
    <div className={styles.container}>
      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
        {/* Brand header */}
        <div className={styles.sidebarHeader} onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <div className={styles.sidebarLogoIcon}>
            <Shield size={18} color="#ffffff" />
          </div>
          {!collapsed && (
            <div>
              <div className={styles.sidebarBrandName}>AIPAS</div>
              <div className={styles.sidebarBrandSub}>Police Intelligence</div>
            </div>
          )}
        </div>

        {/* Sectioned navigation */}
        <nav className={styles.sidebarNav}>
          {visibleSections.map(section => (
            <div key={section.label} className={styles.navSection}>
              {!collapsed && (
                <div className={styles.navSectionLabel}>{section.label}</div>
              )}
              {section.items.map(item => {
                const Icon = item.icon
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                return (
                  <Link
                    to={item.path}
                    key={`${section.label}-${item.label}`}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className={styles.navIcon} />
                    {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                    {!collapsed && isActive && <div className={styles.navActiveDot} />}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <Link
            to="/profile"
            className={`${styles.navItem} ${location.pathname.startsWith('/profile') ? styles.navItemActive : ''}`}
            title={collapsed ? 'My Profile' : undefined}
          >
            <User size={18} className={styles.navIcon} />
            {!collapsed && <span className={styles.navLabel}>My Profile</span>}
          </Link>
          <HoverScale onClick={handleLogout} className={styles.navItem}>
            <LogOut size={18} className={styles.navIcon} />
            {!collapsed && <span className={styles.navLabel}>Log Out</span>}
          </HoverScale>
        </div>
      </aside>

      {/* ── Main Content area ── */}
      <div className={styles.mainContent}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.iconBtn} onClick={() => setCollapsed(!collapsed)} aria-label="Toggle Navigation">
              <Menu size={20} />
            </button>
            <div className={styles.profileCard} onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
              <div className={styles.avatar}>
                {user?.username?.substring(0, 2).toUpperCase()}
              </div>
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>{user?.username}</span>
                <span className={styles.profileRole}>
                  <span className={styles.rolePip} />
                  {user?.role}
                  {user?.badge_number ? ` · ${user.badge_number}` : ''}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.headerRight}>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                className={styles.iconBtn}
                onClick={() => setShowNotifs(prev => !prev)}
                aria-label="Notifications"
                style={{ position: 'relative' }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className={styles.notifBadge}>{unreadCount}</span>
                )}
              </button>

              {showNotifs && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>
                    <span style={{ fontWeight: 'bold', fontSize: 13 }}>Operational Alerts</span>
                    <button 
                      onClick={markAllRead} 
                      className={styles.notifMarkRead}
                    >
                      Clear Badge
                    </button>
                  </div>
                  <div className={styles.notifList}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: 'var(--muted-foreground)' }}>
                        No active alerts logged.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`${styles.notifItem} ${!n.read ? styles.notifItemUnread : ''}`}
                          style={{ position: 'relative', cursor: 'pointer' }}
                          onClick={() => {
                            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))
                            setShowNotifs(false)
                            navigate(n.path)
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', paddingRight: 16 }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span style={{ 
                                width: 6, 
                                height: 6, 
                                borderRadius: '50%', 
                                backgroundColor: !n.read ? 'var(--primary)' : 'transparent' 
                              }} />
                              <span style={{ 
                                fontSize: 9, 
                                textTransform: 'uppercase', 
                                fontWeight: 'bold',
                                color: n.priority === 'high' ? '#ef4444' : '#f59e0b'
                              }}>
                                [{n.category}]
                              </span>
                            </div>
                            <span style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>{n.time}</span>
                          </div>
                          
                          <div className={styles.notifText} style={{ marginTop: 4 }}>{n.text}</div>
                          
                          <button 
                            style={{ 
                              position: 'absolute', 
                              top: 8, 
                              right: 8, 
                              border: 'none', 
                              background: 'none', 
                              color: 'var(--muted-foreground)', 
                              cursor: 'pointer',
                              padding: 2,
                              fontSize: 10
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setNotifications(prev => prev.filter(item => item.id !== n.id))
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button className={styles.iconBtn} onClick={toggleTheme} aria-label="Toggle Theme">
              {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Page inner content */}
        <main className={styles.pageContainer}>
          {children}
        </main>
      </div>
    </div>
  )
}
