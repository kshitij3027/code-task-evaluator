import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postJSON } from '../api/client';
import type { Difficulty, TaskResponse } from '../types';
import styles from './TaskCreatePage.module.css';

interface TestCaseInput {
  input: string;
  expected_output: string;
}

export default function TaskCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [referenceSolution, setReferenceSolution] = useState('');
  const [testCases, setTestCases] = useState<TestCaseInput[]>([{ input: '', expected_output: '' }]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function addTestCase() {
    setTestCases([...testCases, { input: '', expected_output: '' }]);
  }

  function removeTestCase(index: number) {
    if (testCases.length <= 1) return;
    setTestCases(testCases.filter((_, i) => i !== index));
  }

  function updateTestCase(index: number, field: keyof TestCaseInput, value: string) {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    setTestCases(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim() || !referenceSolution.trim()) {
      setError('All fields are required.');
      return;
    }

    if (testCases.length === 0) {
      setError('At least one test case is required.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await postJSON<TaskResponse>('/api/tasks/', {
        title: title.trim(),
        description: description.trim(),
        reference_solution: referenceSolution,
        test_cases: testCases,
        difficulty,
      });
      navigate(`/tasks/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Create Task</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        <label className={styles.label}>
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
            placeholder="Task title"
            required
          />
        </label>

        <label className={styles.label}>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.textarea}
            placeholder="Problem statement..."
            rows={4}
            required
          />
        </label>

        <label className={styles.label}>
          Difficulty
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className={styles.select}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        <label className={styles.label}>
          Reference Solution
          <textarea
            value={referenceSolution}
            onChange={(e) => setReferenceSolution(e.target.value)}
            className={`${styles.textarea} ${styles.code}`}
            placeholder="Python solution..."
            rows={6}
            required
          />
        </label>

        <div className={styles.testCasesSection}>
          <div className={styles.testCasesHeader}>
            <h3>Test Cases</h3>
            <button type="button" onClick={addTestCase} className={styles.addBtn}>
              Add Test Case
            </button>
          </div>

          {testCases.map((tc, i) => (
            <div key={i} className={styles.testCase}>
              <div className={styles.testCaseHeader}>
                <span>Test Case {i + 1}</span>
                {testCases.length > 1 && (
                  <button type="button" onClick={() => removeTestCase(i)} className={styles.removeBtn}>
                    Remove
                  </button>
                )}
              </div>
              <div className={styles.testCaseFields}>
                <label className={styles.label}>
                  Input
                  <textarea
                    value={tc.input}
                    onChange={(e) => updateTestCase(i, 'input', e.target.value)}
                    className={`${styles.textarea} ${styles.code}`}
                    rows={2}
                    placeholder="stdin input"
                  />
                </label>
                <label className={styles.label}>
                  Expected Output
                  <textarea
                    value={tc.expected_output}
                    onChange={(e) => updateTestCase(i, 'expected_output', e.target.value)}
                    className={`${styles.textarea} ${styles.code}`}
                    rows={2}
                    placeholder="Expected stdout"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Task'}
        </button>
      </form>
    </div>
  );
}
