import AnalyticsPage from '@/features/admin/pages/Analytics'
import UserListPage from '@/features/admin/pages/UserList'

import ContactsListPage from '@/features/admin/leads/pages/ContactsList'
import TasksListPage from '@/features/admin/leads/pages/TasksList'
import CallLogsListPage from '@/features/admin/leads/pages/CallLogsList'
import BookingsListPage from '@/features/admin/leads/pages/BookingsList'

import ProjectsListPage from '@/features/admin/config/pages/ProjectsList'
import ApiListPage from '@/features/admin/config/pages/ApiList'
import BookingFormPage from '@/features/admin/config/pages/BookingForm'
import ResourcesPage from '@/features/admin/config/pages/Resources'
import WhatsappApiPage from '@/features/admin/config/pages/WhatsappApi'

import NewsListPage from '@/features/admin/support/pages/NewsList'
import FaqListPage from '@/features/admin/support/pages/FaqList'


import UpdatePasswordPage from '@/features/admin/setting/pages/UpdatePassword'
import AddContactPage from '@/features/admin/leads/pages/AddContact'

export const routeComponentMap: Record<string, any> = {
  "/analytics": AnalyticsPage,
  "/users": UserListPage,

  "/leads/contacts": ContactsListPage,
  "/leads/contacts/new": AddContactPage,

  "/leads/tasks": TasksListPage,
  "/leads/call-logs": CallLogsListPage,
  "/leads/bookings": BookingsListPage,

  "/configuration/projects": ProjectsListPage,
  "/configuration/api": ApiListPage,
  "/configuration/booking-form": BookingFormPage,
  "/configuration/resources": ResourcesPage,
  "/configuration/whatsapp": WhatsappApiPage,

  "/support/news": NewsListPage,
  "/support/faq": FaqListPage,

  "/account/update-password": UpdatePasswordPage,
}