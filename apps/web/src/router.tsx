import { createBrowserRouter } from 'react-router'

import { RequireAuth } from '@/auth/require-auth'
import { AppLayout } from '@/routes/app-layout'
import { AttendancePage } from '@/routes/app/attendance'
import { CalendarPage } from '@/routes/app/calendar'
import { DashboardPage } from '@/routes/app/dashboard'
import { FinancePage } from '@/routes/app/finance'
import { GalleryPage } from '@/routes/app/gallery'
import { MembersPage } from '@/routes/app/members'
import { OrganizationChartPage } from '@/routes/app/organization-chart'
import { SettingsPage } from '@/routes/app/settings'
import { IntegrationsPage } from '@/routes/app/settings/integrations'
import { ReferencesPage } from '@/routes/app/settings/references'
import { TeamPage } from '@/routes/app/settings/team'
import { ChurchSelectPage } from '@/routes/church-select'
import { HomePage } from '@/routes/home'
import { LoginPage } from '@/routes/login'
import { OnboardingPage } from '@/routes/onboarding'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/onboarding', element: <OnboardingPage /> },
  { path: '/church-select', element: <ChurchSelectPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/app',
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'members', element: <MembersPage /> },
          { path: 'organization-chart', element: <OrganizationChartPage /> },
          { path: 'attendance', element: <AttendancePage /> },
          { path: 'finance', element: <FinancePage /> },
          { path: 'calendar', element: <CalendarPage /> },
          { path: 'gallery', element: <GalleryPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'settings/references', element: <ReferencesPage /> },
          { path: 'settings/team', element: <TeamPage /> },
          { path: 'settings/integrations', element: <IntegrationsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <HomePage /> },
])
