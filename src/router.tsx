import { createBrowserRouter } from "react-router-dom"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { LoginPage, DashboardPage } from "@/pages"

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
      {
        index: true,
        element: <DashboardPage />,
      },
      // Prompts, FAQ/RAG, Tools, Conversations land in later sprints.
    ],
  },
])
