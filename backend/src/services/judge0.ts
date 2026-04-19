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
  if (!value) return '';
  // 1. Remove carriage returns
  // 2. Split into lines, trim each line, and filter out empty lines at the end
  // 3. Join back with standard newlines
  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trimEnd()) // Trim trailing spaces on each line
    .join('\n')
    .trim(); // Trim leading/trailing whitespace of the whole block
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

async function runTestCase(sourceCode: string, input: string, expectedOutput: string, languageId: number, retryCount = 0): Promise<TestCaseOutcome> {
  const { baseUrl, languageId: defaultLangId } = getJudge0Config();
  const langId = languageId || defaultLangId;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (process.env.JUDGE0_API_KEY && process.env.JUDGE0_API_KEY !== 'your_api_key_here' && process.env.JUDGE0_API_KEY.length > 5) {
    headers['X-RapidAPI-Key'] = process.env.JUDGE0_API_KEY;
  }
  if (process.env.JUDGE0_API_HOST) {
    headers['X-RapidAPI-Host'] = process.env.JUDGE0_API_HOST;
  }

  try {
    const response = await fetch(`${baseUrl}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(10000), // 10 second timeout
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: langId,
        stdin: input,
        expected_output: expectedOutput,
      }),
    });

    if (!response.ok) {
      if (response.status === 429 && retryCount < 2) {
        // Rate limited, wait 1s and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        return runTestCase(sourceCode, input, expectedOutput, languageId, retryCount + 1);
      }
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
  } catch (error: any) {
    // Retry on network errors or timeouts
    if (retryCount < 2) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return runTestCase(sourceCode, input, expectedOutput, languageId, retryCount + 1);
    }
    throw error;
  }
}

export async function evaluateCodingSubmission(
  sourceCode: string,
  testCases: Array<{ input: string; expectedOutput: string }>,
  languageId?: number
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

  const { languageId: defaultLangId } = getJudge0Config();
  const targetLangId = languageId || defaultLangId;

  const details = await Promise.all(
    testCases.map((testCase) => runTestCase(sourceCode, testCase.input, testCase.expectedOutput, targetLangId)),
  );

  return {
    passedCount: details.filter(d => d.passed).length,
    totalCount: testCases.length,
    details,
  };
}

