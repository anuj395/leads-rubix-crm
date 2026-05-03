import AnalyticsPage from '@/features/superAdmin/pages/Analytics'
import OrganizationPage from '@/features/superAdmin/pages/Organization'
import UserListPage from '@/features/superAdmin/users/pages/UserList'
import RolesAndPermissionsPage from '@/features/superAdmin/users/pages/RolesAndPermissions'

import ContactsListPage from '@/features/superAdmin/leads/pages/ContactsList'
import TasksListPage from '@/features/superAdmin/leads/pages/TasksList'
import CallLogsListPage from '@/features/superAdmin/leads/pages/CallLogsList'
import BookingsListPage from '@/features/superAdmin/leads/pages/BookingsList'
import SortedListPage from '@/features/superAdmin/leads/pages/SortedList'

import SidebarConfigPage from '@/features/superAdmin/config/pages/SidebarConfig'
import ScreensPage from '@/features/superAdmin/config/pages/Screens'
import ScreenFieldsPage from '@/features/superAdmin/config/pages/ScreenFields'
import ScreenPermissionsPage from '@/features/superAdmin/config/pages/ScreenPermissions'
import ProjectsListPage from '@/features/superAdmin/config/pages/ProjectsList'
import ApiListPage from '@/features/superAdmin/config/pages/ApiList'
import BookingFormPage from '@/features/superAdmin/config/pages/BookingForm'
import ResourcesPage from '@/features/superAdmin/config/pages/Resources'
import WhatsappApiPage from '@/features/superAdmin/config/pages/WhatsappApi'
import IndustriesPage from '@/features/superAdmin/config/pages/Industries'
import MenusPage from '@/features/superAdmin/config/pages/Menus'
import PermissionsMatrixPage from '@/features/superAdmin/config/pages/PermissionsMatrix'

import NewsListPage from '@/features/superAdmin/support/pages/NewsList'
import FaqListPage from '@/features/superAdmin/support/pages/FaqList'

import LicensesPage from '@/features/superAdmin/setting/pages/Licenses'
import CouponsPage from '@/features/superAdmin/setting/pages/Coupons'
import UpdatePasswordPage from '@/features/superAdmin/setting/pages/UpdatePassword'

export const routeComponentMap: Record<string, any> = {
  "/analytics": AnalyticsPage,
  "/organization": OrganizationPage,
  "/users": UserListPage,
  "/users/roles": RolesAndPermissionsPage,

  "/leads/contacts": ContactsListPage,
  "/leads/tasks": TasksListPage,
  "/leads/call-logs": CallLogsListPage,
  "/leads/bookings": BookingsListPage,
  "/leads/sorted": SortedListPage,

  "/configuration/sidebar": SidebarConfigPage,
  "/configuration/screens": ScreensPage,
  "/configuration/screen-fields": ScreenFieldsPage,
  "/configuration/screen-permissions": ScreenPermissionsPage,
  "/configuration/projects": ProjectsListPage,
  "/configuration/api": ApiListPage,
  "/configuration/booking-form": BookingFormPage,
  "/configuration/resources": ResourcesPage,
  "/configuration/whatsapp": WhatsappApiPage,
  "/configuration/industries": IndustriesPage,
  "/configuration/menus": MenusPage,
  "/configuration/permissions": PermissionsMatrixPage,

  "/support/news": NewsListPage,
  "/support/faq": FaqListPage,

  "/account/licenses": LicensesPage,
  "/account/coupons": CouponsPage,
  "/account/update-password": UpdatePasswordPage,
}
