import { QuestionPayload } from '../lib/api/examApi';

export async function parseQuestionsCSV(file: File): Promise<QuestionPayload[]> {
  const text = await file.text();
  const rows = text.split('\n').filter((r) => r.trim().length > 0);
  
  if (rows.length < 2) {
    throw new Error('CSV must contain a header row and at least one question row.');
  }

  // Type,Marks,Difficulty,QuestionText,Option1,Option1IsCorrect,Option2,Option2IsCorrect,Option3,Option3IsCorrect,Option4,Option4IsCorrect,TestCase1Input,TestCase1Expected,TestCase1Visible,TestCase2Input,TestCase2Expected,TestCase2Visible
  const headers = rows[0].split(',').map((h) => h.trim().toLowerCase());
  
  const typeIdx = headers.indexOf('type');
  const marksIdx = headers.findIndex(h => h === 'marks' || h === 'points');
  const diffIdx = headers.indexOf('difficulty');
  const textIdx = headers.findIndex(h => h === 'question' || h === 'text' || h === 'questiontext');

  if (marksIdx === -1 || textIdx === -1) {
    throw new Error('CSV is missing required headers: Marks/Points or Question/Text');
  }

  const parseRow = (line: string) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parsedQuestions: QuestionPayload[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const columns = parseRow(rows[i]);
    const typeVal = typeIdx !== -1 ? (columns[typeIdx] || '').toUpperCase() : 'MCQ';
    const type = typeVal === 'CODE' || typeVal === 'CODING' ? 'CODING' : 'MCQ';

    const payload: QuestionPayload = {
      type: type as 'MCQ' | 'CODING',
      text: columns[textIdx] || '',
      marks: parseInt(columns[marksIdx]) || 5,
      difficulty: (columns[diffIdx]?.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD') || 'MEDIUM',
      order: i - 1, // Maintain CSV order
    };

    if (type === 'MCQ') {
      const options: { text: string; isCorrect: boolean }[] = [];
      const correctAnsIdx = headers.indexOf('correct answer');
      const correctAnsVal = correctAnsIdx !== -1 ? columns[correctAnsIdx]?.toLowerCase() : null;

      for (let j = 1; j <= 4; j++) {
        // Support both "Option1" and "Option A"
        const optNames = [`option${j}`, `option ${String.fromCharCode(64 + j).toLowerCase()}`];
        const optTextIdx = headers.findIndex(h => optNames.includes(h));
        
        const optCorrIdx = headers.indexOf(`option${j}iscorrect`);
        
        if (optTextIdx !== -1 && columns[optTextIdx]) {
          const isExplicitlyCorrect = optCorrIdx !== -1 && columns[optCorrIdx]?.toUpperCase() === 'TRUE';
          const isCorrectByLetter = correctAnsVal === String.fromCharCode(96 + j) || correctAnsVal === `option ${String.fromCharCode(96 + j)}`;
          
          options.push({
            text: columns[optTextIdx],
            isCorrect: isExplicitlyCorrect || isCorrectByLetter,
          });
        }
      }
      payload.mcqOptions = options;
    } else if (type === 'CODING') {
      const testCases: { input: string; expectedOutput: string; isVisible: boolean }[] = [];
      for (let j = 1; j <= 5; j++) {
        const tcInIdx = headers.indexOf(`testcase${j}input`);
        const tcOutIdx = headers.indexOf(`testcase${j}expected`);
        const tcVisIdx = headers.indexOf(`testcase${j}visible`);
        
        if (tcInIdx !== -1 && columns[tcInIdx] && tcOutIdx !== -1 && columns[tcOutIdx]) {
          testCases.push({
            input: columns[tcInIdx],
            expectedOutput: columns[tcOutIdx],
            isVisible: columns[tcVisIdx]?.toUpperCase() !== 'FALSE',
          });
        }
      }
      payload.testCases = testCases;
    }

    parsedQuestions.push(payload);
  }

  return parsedQuestions;
}
