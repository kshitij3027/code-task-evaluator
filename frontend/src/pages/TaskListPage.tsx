import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchJSON, deleteJSON } from '../api/client';
import type { TaskResponse, Difficulty } from '../types';
import styles from './TaskListPage.module.css';

const DIFFICULTIES: (Difficulty | 'all')[] = ['all', 'easy', 'medium', 'hard'];

function difficultyClass(d: string): string {
  if (d === 'easy') return styles.badgeEasy;
  if (d === 'medium') return styles.badgeMedium;
  return styles.badgeHard;
}

export default function TaskListPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [filter, setFilter] = useState<Difficulty | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const url = filter === 'all' ? '/api/tasks/' : `/api/tasks/?difficulty=${filter}`;
    fetchJSON<{ tasks: TaskResponse[] }>(url)
      .then((data) => setTasks(data.tasks))
      .finally(() => setLoading(false));
  }, [filter]);

  async function handleDelete(taskId: string) {
    try {
      await deleteJSON(`/api/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setDeleteConfirmId(null);
    } catch {
      setDeleteConfirmId(null);
    }
  }

  return (
    <div>
      <div className={styles.header}>
        <h1>Tasks</h1>
        <Link to="/tasks/new" className={styles.createBtn}>Create Task</Link>
      </div>

      <div className={styles.filterRow}>
        <label htmlFor="task-filter">Filter:</label>
        <select
          id="task-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as Difficulty | 'all')}
          className={styles.filterSelect}
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>{d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className={styles.cardGrid}>
          {tasks.map((task) => (
            <div key={task.id} className={styles.card}>
              <Link to={`/tasks/${task.id}`} className={styles.cardLink}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{task.title}</h3>
                  <span className={`${styles.badge} ${difficultyClass(task.difficulty)}`}>
                    {task.difficulty}
                  </span>
                </div>
                <p className={styles.cardDesc}>
                  {task.description.length > 120
                    ? task.description.slice(0, 120) + '...'
                    : task.description}
                </p>
              </Link>
              <div className={styles.cardActions}>
                <button
                  onClick={() => navigate(`/tasks/${task.id}?edit=true`)}
                  className={styles.editBtn}
                >
                  Edit
                </button>
                {deleteConfirmId === task.id ? (
                  <>
                    <button onClick={() => handleDelete(task.id)} className={styles.confirmDeleteBtn}>
                      Confirm
                    </button>
                    <button onClick={() => setDeleteConfirmId(null)} className={styles.cancelBtn}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setDeleteConfirmId(task.id)} className={styles.deleteBtn}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
