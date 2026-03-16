import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchJSON, postJSON, putJSON, deleteJSON } from '../api/client';
import CodeEditor from '../components/CodeEditor';
import ResultsDisplay from '../components/ResultsDisplay';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import type { TaskResponse, SubmissionResponse, Difficulty } from '../types';
import styles from './TaskDetailPage.module.css';

function difficultyClass(d: string): string {
  if (d === 'easy') return styles.badgeEasy;
  if (d === 'medium') return styles.badgeMedium;
  return styles.badgeHard;
}

interface EditForm {
  title: string;
  description: string;
  difficulty: Difficulty;
  reference_solution: string;
  test_cases: { input: string; expected_output: string }[];
}

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [task, setTask] = useState<TaskResponse | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [code, setCode] = useState('');
  const [latestResult, setLatestResult] = useState<SubmissionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verify state
  const [verifyResult, setVerifyResult] = useState<SubmissionResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    fetchJSON<TaskResponse>(`/api/tasks/${taskId}`).then((t) => {
      setTask(t);
      if (searchParams.get('edit') === 'true') {
        enterEditMode(t);
      }
    }).catch(() => setError('Task not found'));
    fetchJSON<{ submissions: SubmissionResponse[] }>(`/api/tasks/${taskId}/submissions`)
      .then((data) => setSubmissions(data.submissions))
      .catch(() => {});
  }, [taskId]);

  function enterEditMode(t: TaskResponse) {
    setIsEditing(true);
    setEditForm({
      title: t.title,
      description: t.description,
      difficulty: t.difficulty,
      reference_solution: '',
      test_cases: t.test_cases.map((tc) => ({ ...tc })),
    });
  }

  async function handleSaveEdit() {
    if (!taskId || !editForm) return;
    setIsSaving(true);
    setEditError('');
    try {
      const body: Record<string, unknown> = {};
      if (editForm.title !== task?.title) body.title = editForm.title;
      if (editForm.description !== task?.description) body.description = editForm.description;
      if (editForm.difficulty !== task?.difficulty) body.difficulty = editForm.difficulty;
      if (editForm.reference_solution.trim()) body.reference_solution = editForm.reference_solution;
      if (JSON.stringify(editForm.test_cases) !== JSON.stringify(task?.test_cases)) body.test_cases = editForm.test_cases;

      if (Object.keys(body).length === 0) {
        setIsEditing(false);
        return;
      }
      const { data } = await putJSON<TaskResponse>(`/api/tasks/${taskId}`, body);
      setTask(data);
      setIsEditing(false);
      setToastMessage('Task updated successfully');
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!taskId) return;
    setIsDeleting(true);
    try {
      await deleteJSON(`/api/tasks/${taskId}`);
      navigate('/tasks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleVerify() {
    if (!taskId) return;
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const { data } = await postJSON<SubmissionResponse>(`/api/tasks/${taskId}/verify`, {});
      setVerifyResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  }

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

  const clearToast = useCallback(() => setToastMessage(''), []);

  if (error && !task) return <p className={styles.errorText}>{error}</p>;
  if (!task) return <Spinner />;

  return (
    <div>
      {toastMessage && <Toast message={toastMessage} onDismiss={clearToast} />}

      <div className={styles.taskHeader}>
        <h1>{task.title}</h1>
        <span className={`${styles.badge} ${difficultyClass(task.difficulty)}`}>
          {task.difficulty}
        </span>
        <div className={styles.headerActions}>
          <button onClick={() => enterEditMode(task)} className={styles.editBtn}>Edit</button>
          <button onClick={() => setShowDeleteConfirm(true)} className={styles.deleteBtn}>Delete</button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className={styles.deleteDialog}>
          <p>Are you sure you want to delete this task? This will also delete all submissions.</p>
          <div className={styles.deleteDialogActions}>
            <button onClick={handleDelete} disabled={isDeleting} className={styles.deleteConfirmBtn}>
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button onClick={() => setShowDeleteConfirm(false)} className={styles.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {isEditing && editForm && (
        <div className={styles.editForm}>
          <h3>Edit Task</h3>
          {editError && <div className={styles.errorText}>{editError}</div>}
          <label className={styles.editLabel}>
            Title
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className={styles.editInput}
            />
          </label>
          <label className={styles.editLabel}>
            Description
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className={styles.editTextarea}
              rows={3}
            />
          </label>
          <label className={styles.editLabel}>
            Difficulty
            <select
              value={editForm.difficulty}
              onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value as Difficulty })}
              className={styles.editSelect}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label className={styles.editLabel}>
            Reference Solution (leave empty to keep current)
            <CodeEditor
              value={editForm.reference_solution}
              onChange={(v) => setEditForm({ ...editForm, reference_solution: v })}
              height="150px"
            />
          </label>
          <h4>Test Cases</h4>
          {editForm.test_cases.map((tc, i) => (
            <div key={i} className={styles.editTestCase}>
              <input
                placeholder="Input"
                value={tc.input}
                onChange={(e) => {
                  const updated = [...editForm.test_cases];
                  updated[i] = { ...updated[i], input: e.target.value };
                  setEditForm({ ...editForm, test_cases: updated });
                }}
                className={styles.editInput}
              />
              <input
                placeholder="Expected output"
                value={tc.expected_output}
                onChange={(e) => {
                  const updated = [...editForm.test_cases];
                  updated[i] = { ...updated[i], expected_output: e.target.value };
                  setEditForm({ ...editForm, test_cases: updated });
                }}
                className={styles.editInput}
              />
              {editForm.test_cases.length > 1 && (
                <button
                  onClick={() => setEditForm({
                    ...editForm,
                    test_cases: editForm.test_cases.filter((_, j) => j !== i),
                  })}
                  className={styles.removeBtn}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setEditForm({
              ...editForm,
              test_cases: [...editForm.test_cases, { input: '', expected_output: '' }],
            })}
            className={styles.addTestCaseBtn}
          >
            Add Test Case
          </button>
          <div className={styles.editActions}>
            <button onClick={handleSaveEdit} disabled={isSaving} className={styles.submitBtn}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => setIsEditing(false)} className={styles.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

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

      <div className={styles.verifySection}>
        <button onClick={handleVerify} disabled={isVerifying} className={styles.verifyBtn}>
          {isVerifying ? 'Verifying...' : 'Verify Reference Solution'}
        </button>
        {verifyResult && (
          <div className={styles.verifyResults}>
            <ResultsDisplay results={verifyResult.results} summary={verifyResult.summary} />
          </div>
        )}
      </div>

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
