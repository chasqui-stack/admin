import { createBrowserRouter, Navigate } from "react-router-dom"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import {
  ConversationDetailPage,
  ConversationsPage,
  DashboardPage,
  FaqPage,
  LeadsPage,
  LoginPage,
  PromptPage,
  ToolsPage,
  AgentsPage,
  SettingsPage,
  UsersPage,
} from "@/pages"

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/conversations" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "agents", element: <AgentsPage /> },
      { path: "prompt", element: <PromptPage /> },
      { path: "faq", element: <FaqPage /> },
      { path: "tools", element: <ToolsPage /> },
      { path: "conversations", element: <ConversationsPage /> },
      { path: "conversations/:contactId", element: <ConversationDetailPage /> },
      { path: "leads", element: <LeadsPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "users", element: <UsersPage /> },
    ],
  },
])
