import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchJSON, deleteJSON } from '../api/client';
import type { DashboardResponse, OverallStatsResponse, TaskDashboardItem, Difficulty, ResultStatus } from '../types';
import styles from './DashboardPage.module.css';

const DIFFICULTIES: (Difficulty | 'all')[] = ['all', 'easy', 'medium', 'hard'];

const STATUS_LABELS: Record<ResultStatus, string> = {
  PASS: 'Pass',
  WRONG_ANSWER: 'Wrong Answer',
  RUNTIME_ERROR: 'Runtime Error',
  TIMEOUT: 'Timeout',
  SYNTAX_ERROR: 'Syntax Error',
};

function passRateClass(rate: number): string {
  if (rate >= 0.7) return styles.passGreen;
  if (rate >= 0.4) return styles.passYellow;
  return styles.passRed;
}

function difficultyClass(d: string): string {
  if (d === 'easy') return styles.badgeEasy;
  if (d === 'medium') return styles.badgeMedium;
  return styles.badgeHard;
}

function statusClass(s: ResultStatus): string {
  const map: Record<ResultStatus, string> = {
    PASS: styles.statusPass,
    WRONG_ANSWER: styles.statusWrongAnswer,
    RUNTIME_ERROR: styles.statusRuntimeError,
    TIMEOUT: styles.statusTimeout,
    SYNTAX_ERROR: styles.statusSyntaxError,
  };
  return map[s];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<OverallStatsResponse | null>(null);
  const [tasks, setTasks] = useState<TaskDashboardItem[]>([]);
  const [filter, setFilter] = useState<Difficulty | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJSON<OverallStatsResponse>('/api/dashboard/stats').then(setStats);
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = filter === 'all' ? '/api/dashboard/' : `/api/dashboard/?difficulty=${filter}`;
    fetchJSON<DashboardResponse>(url)
      .then((data) => setTasks(data.tasks))
      .finally(() => setLoading(false));
  }, [filter]);

  async function handleDelete(taskId: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await deleteJSON(`/api/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.task_id !== taskId));
    } catch {
      // silently fail
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Dashboard</h1>

      {stats && (
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.total_tasks}</div>
            <div className={styles.statLabel}>Total Tasks</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.total_submissions}</div>
            <div className={styles.statLabel}>Total Submissions</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statValue} ${passRateClass(stats.overall_pass_rate)}`}>
              {(stats.overall_pass_rate * 100).toFixed(0)}%
            </div>
            <div className={styles.statLabel}>Overall Pass Rate</div>
          </div>
        </div>
      )}

      <div className={styles.filterRow}>
        <label htmlFor="difficulty-filter">Filter by difficulty:</label>
        <select
          id="difficulty-filter"
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
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Difficulty</th>
              <th>Submissions</th>
              <th>Pass Rate</th>
              <th>Failure Modes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.task_id}
                className={styles.clickableRow}
                onClick={() => navigate(`/tasks/${task.task_id}`)}
              >
                <td>{task.title}</td>
                <td>
                  <span className={`${styles.badge} ${difficultyClass(task.difficulty)}`}>
                    {task.difficulty}
                  </span>
                </td>
                <td>{task.total_submissions}</td>
                <td>
                  <span className={passRateClass(task.pass_rate)}>
                    {(task.pass_rate * 100).toFixed(0)}%
                  </span>
                </td>
                <td className={styles.breakdownCell}>
                  {(Object.entries(task.failure_mode_breakdown) as [ResultStatus, number][])
                    .filter(([, count]) => count > 0)
                    .map(([status, count]) => (
                      <span key={status} className={`${styles.statusBadge} ${statusClass(status)}`}>
                        {STATUS_LABELS[status]}: {count}
                      </span>
                    ))}
                </td>
                <td>
                  <div className={styles.actionButtons}>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${task.task_id}?edit=true`); }}
                      className={styles.editBtn}
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleDelete(task.task_id, e)}
                      className={styles.deleteBtn}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
