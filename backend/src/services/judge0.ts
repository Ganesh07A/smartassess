type Judge0SubmissionResponse = {
  status?: {
    id?: number;
    description?: string;
  };
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string;
};

export type TestCaseOutcome = {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string | null;
  status: string;
  stderr: string | null;
  compileOutput: string | null;
}

export type CodingEvaluationResult = {
  passedCount: number;
  totalCount: number;
  details: TestCaseOutcome[];
};

const DEFAULT_JUDGE0_BASE_URL = 'https://ce.judge0.com';
const DEFAULT_JUDGE0_LANGUAGE_ID = 63; // JavaScript (Node.js)
const ACCEPTED_STATUS_ID = 3;

function normalizeOutput(value: string | null | undefined): string {
  return (value ?? '').replace(/\r\n/g, '\n').trim();
}

function getJudge0Config() {
  const baseUrl = (process.env.JUDGE0_API_URL || DEFAULT_JUDGE0_BASE_URL).replace(/\/$/, '');
  const languageId = Number.parseInt(
    process.env.JUDGE0_LANGUAGE_ID || String(DEFAULT_JUDGE0_LANGUAGE_ID),
    10,
  );

  if (!Number.isInteger(languageId) || languageId <= 0) {
    throw new Error('Invalid JUDGE0_LANGUAGE_ID configuration');
  }

  return { baseUrl, languageId };
}

async function runTestCase(sourceCode: string, input: string, expectedOutput: string): Promise<TestCaseOutcome> {
  const { baseUrl, languageId } = getJudge0Config();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (process.env.JUDGE0_API_KEY) {
    headers['X-RapidAPI-Key'] = process.env.JUDGE0_API_KEY;
  }
  if (process.env.JUDGE0_API_HOST) {
    headers['X-RapidAPI-Host'] = process.env.JUDGE0_API_HOST;
  }

  const response = await fetch(`${baseUrl}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source_code: sourceCode,
      language_id: languageId,
      stdin: input,
      expected_output: expectedOutput,
    }),
  });

  if (!response.ok) {
    throw new Error(`Judge0 request failed with status ${response.status}`);
  }

  const result = (await response.json()) as Judge0SubmissionResponse;
  
  const actualOutput = normalizeOutput(result.stdout);
  const normalizedExpected = normalizeOutput(expectedOutput);
  const passed = result.status?.id === ACCEPTED_STATUS_ID || actualOutput === normalizedExpected;

  return {
    passed,
    input,
    expectedOutput: normalizedExpected,
    actualOutput: result.stdout ?? null,
    status: result.status?.description || 'Unknown',
    stderr: result.stderr ?? null,
    compileOutput: result.compile_output ?? null,
  };
}

export async function evaluateCodingSubmission(
  sourceCode: string,
  testCases: Array<{ input: string; expectedOutput: string }>,
): Promise<CodingEvaluationResult> {
  if (!sourceCode.trim() || testCases.length === 0) {
    return {
      passedCount: 0,
      totalCount: testCases.length,
      details: testCases.map(tc => ({
        passed: false,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: null,
        status: 'Empty Submission',
        stderr: null,
        compileOutput: null
      }))
    };
  }

  const details = await Promise.all(
    testCases.map((testCase) => runTestCase(sourceCode, testCase.input, testCase.expectedOutput)),
  );

  return {
    passedCount: details.filter(d => d.passed).length,
    totalCount: testCases.length,
    details,
  };
}

