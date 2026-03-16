import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import TaskListPage from './pages/TaskListPage';
import TaskCreatePage from './pages/TaskCreatePage';
import TaskDetailPage from './pages/TaskDetailPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'tasks', element: <TaskListPage /> },
      { path: 'tasks/new', element: <TaskCreatePage /> },
      { path: 'tasks/:taskId', element: <TaskDetailPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
