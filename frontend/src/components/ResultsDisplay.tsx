import type { TestCaseResult, SubmissionSummary, ResultStatus } from '../types';
import DiffView from './DiffView';
import styles from './ResultsDisplay.module.css';

interface Props {
  results: TestCaseResult[];
  summary: SubmissionSummary;
}

const STATUS_LABELS: Record<ResultStatus, string> = {
  PASS: 'Pass',
  WRONG_ANSWER: 'Wrong Answer',
  RUNTIME_ERROR: 'Runtime Error',
  TIMEOUT: 'Timeout',
  SYNTAX_ERROR: 'Syntax Error',
};

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

export default function ResultsDisplay({ results, summary }: Props) {
  const allPassed = summary.passed === summary.total;

  return (
    <div className={styles.container}>
      <div className={`${styles.summaryBar} ${allPassed ? styles.summaryPass : styles.summaryFail}`}>
        Passed {summary.passed}/{summary.total} test cases
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Test #</th>
            <th>Status</th>
            <th>Expected</th>
            <th>Actual</th>
            <th>Time</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.test_case_index}>
              <td>{r.test_case_index + 1}</td>
              <td>
                <span className={`${styles.badge} ${statusClass(r.status)}`}>
                  {STATUS_LABELS[r.status]}
                </span>
              </td>
              {r.status === 'WRONG_ANSWER' ? (
                <td colSpan={2}>
                  <DiffView expected={r.expected_output} actual={r.actual_output} />
                </td>
              ) : (
                <>
                  <td><pre className={styles.output}>{r.expected_output}</pre></td>
                  <td><pre className={styles.output}>{r.actual_output}</pre></td>
                </>
              )}
              <td>{r.execution_time_ms}ms</td>
              <td>
                {r.error_message && (
                  <pre className={styles.errorMsg}>{r.error_message}</pre>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
