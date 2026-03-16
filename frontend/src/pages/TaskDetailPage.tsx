import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchJSON, postJSON } from '../api/client';
import CodeEditor from '../components/CodeEditor';
import ResultsDisplay from '../components/ResultsDisplay';
import type { TaskResponse, SubmissionResponse } from '../types';
import styles from './TaskDetailPage.module.css';

function difficultyClass(d: string): string {
  if (d === 'easy') return styles.badgeEasy;
  if (d === 'medium') return styles.badgeMedium;
  return styles.badgeHard;
}

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<TaskResponse | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [code, setCode] = useState('');
  const [latestResult, setLatestResult] = useState<SubmissionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!taskId) return;
    fetchJSON<TaskResponse>(`/api/tasks/${taskId}`).then(setTask).catch(() => setError('Task not found'));
    fetchJSON<{ submissions: SubmissionResponse[] }>(`/api/tasks/${taskId}/submissions`)
      .then((data) => setSubmissions(data.submissions))
      .catch(() => {});
  }, [taskId]);

  async function handleSubmit() {
    if (!taskId || !code.trim()) return;
    setIsSubmitting(true);
    setError('');
    setLatestResult(null);
    try {
      const { data } = await postJSON<SubmissionResponse>(
        `/api/tasks/${taskId}/submissions`,
        { code },
      );
      setLatestResult(data);
      setSubmissions((prev) => [data, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (error && !task) return <p className={styles.errorText}>{error}</p>;
  if (!task) return <p>Loading...</p>;

  return (
    <div>
      <div className={styles.taskHeader}>
        <h1>{task.title}</h1>
        <span className={`${styles.badge} ${difficultyClass(task.difficulty)}`}>
          {task.difficulty}
        </span>
      </div>

      <p className={styles.description}>{task.description}</p>

      <h3>Test Cases</h3>
      <table className={styles.testCasesTable}>
        <thead>
          <tr>
            <th>#</th>
            <th>Input</th>
            <th>Expected Output</th>
          </tr>
        </thead>
        <tbody>
          {task.test_cases.map((tc, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td><pre className={styles.mono}>{tc.input}</pre></td>
              <td><pre className={styles.mono}>{tc.expected_output}</pre></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className={styles.sectionTitle}>Submit Solution</h3>
      <CodeEditor value={code} onChange={setCode} onSubmit={handleSubmit} />
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !code.trim()}
        className={styles.submitBtn}
      >
        {isSubmitting ? 'Grading...' : 'Submit Solution (Ctrl+Enter)'}
      </button>

      {error && task && <p className={styles.errorText}>{error}</p>}

      {latestResult && (
        <div className={styles.resultsSection}>
          <h3>Results</h3>
          <ResultsDisplay results={latestResult.results} summary={latestResult.summary} />
        </div>
      )}

      {submissions.length > 0 && (
        <div className={styles.historySection}>
          <h3>Submission History ({submissions.length})</h3>
          {submissions.map((sub) => (
            <details key={sub.id} className={styles.historyItem}>
              <summary className={styles.historySummary}>
                {new Date(sub.created_at).toLocaleString()} — {sub.summary.passed}/{sub.summary.total} passed
              </summary>
              <ResultsDisplay results={sub.results} summary={sub.summary} />
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
