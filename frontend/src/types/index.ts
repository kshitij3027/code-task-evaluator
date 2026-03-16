export type Difficulty = 'easy' | 'medium' | 'hard';
export type ResultStatus = 'PASS' | 'WRONG_ANSWER' | 'RUNTIME_ERROR' | 'TIMEOUT' | 'SYNTAX_ERROR';

export interface TestCase {
  input: string;
  expected_output: string;
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string;
  test_cases: TestCase[];
  difficulty: Difficulty;
  created_at: string;
}

export interface TestCaseResult {
  test_case_index: number;
  passed: boolean;
  expected_output: string;
  actual_output: string;
  execution_time_ms: number;
  status: ResultStatus;
  error_message: string | null;
}

export interface SubmissionSummary {
  passed: number;
  failed: number;
  total: number;
}

export interface SubmissionResponse {
  id: string;
  task_id: string;
  results: TestCaseResult[];
  summary: SubmissionSummary;
  created_at: string;
}

export interface FailureModeBreakdown {
  PASS: number;
  WRONG_ANSWER: number;
  RUNTIME_ERROR: number;
  TIMEOUT: number;
  SYNTAX_ERROR: number;
}

export interface TaskDashboardItem {
  task_id: string;
  title: string;
  difficulty: Difficulty;
  total_submissions: number;
  pass_rate: number;
  failure_mode_breakdown: FailureModeBreakdown;
}

export interface DashboardResponse {
  tasks: TaskDashboardItem[];
}

export interface OverallStatsResponse {
  total_tasks: number;
  total_submissions: number;
  overall_pass_rate: number;
}
