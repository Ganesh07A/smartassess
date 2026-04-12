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

export type CodingEvaluationResult = {
  passedCount: number;
  totalCount: number;
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

async function runTestCase(sourceCode: string, input: string, expectedOutput: string): Promise<boolean> {
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

  if (result.status?.id === ACCEPTED_STATUS_ID) {
    return true;
  }

  // Fallback output comparison to handle providers that do not evaluate expected_output.
  return normalizeOutput(result.stdout) === normalizeOutput(expectedOutput);
}

export async function evaluateCodingSubmission(
  sourceCode: string,
  testCases: Array<{ input: string; expectedOutput: string }>,
): Promise<CodingEvaluationResult> {
  if (!sourceCode.trim() || testCases.length === 0) {
    return {
      passedCount: 0,
      totalCount: testCases.length,
    };
  }

  const outcomes = await Promise.all(
    testCases.map((testCase) => runTestCase(sourceCode, testCase.input, testCase.expectedOutput)),
  );

  return {
    passedCount: outcomes.filter(Boolean).length,
    totalCount: testCases.length,
  };
}
