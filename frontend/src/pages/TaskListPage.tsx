import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJSON } from '../api/client';
import type { TaskResponse, Difficulty } from '../types';
import styles from './TaskListPage.module.css';

const DIFFICULTIES: (Difficulty | 'all')[] = ['all', 'easy', 'medium', 'hard'];

function difficultyClass(d: string): string {
  if (d === 'easy') return styles.badgeEasy;
  if (d === 'medium') return styles.badgeMedium;
  return styles.badgeHard;
}

export default function TaskListPage() {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [filter, setFilter] = useState<Difficulty | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = filter === 'all' ? '/api/tasks/' : `/api/tasks/?difficulty=${filter}`;
    fetchJSON<{ tasks: TaskResponse[] }>(url)
      .then((data) => setTasks(data.tasks))
      .finally(() => setLoading(false));
  }, [filter]);

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
            <Link key={task.id} to={`/tasks/${task.id}`} className={styles.card}>
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
          ))}
        </div>
      )}
    </div>
  );
}
