function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sample(values, count) {
  const pool = values.slice();
  const result = [];
  while (result.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(index, 1)[0]);
  }
  return result;
}

function shuffle(values) {
  const result = values.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function createPaper(paperDate) {
  const questions = [];
  const multiplicationPairs = [];
  for (let left = 1; left <= 9; left += 1) {
    for (let right = 1; right <= left; right += 1) {
      multiplicationPairs.push([left, right]);
    }
  }

  sample(multiplicationPairs, 10).forEach(([left, right], index) => {
    questions.push({
      number: index + 1,
      section: "乘法题",
      operation: "×",
      text: `${left} × ${right} = ______`,
      answer: String(left * right),
    });
  });

  const additionPairs = [];
  for (let left = 1; left < 20; left += 1) {
    for (let right = 1; right <= 20 - left; right += 1) {
      additionPairs.push([left, right]);
    }
  }
  const subtractionPairs = [];
  for (let left = 2; left <= 20; left += 1) {
    for (let right = 1; right < left; right += 1) {
      subtractionPairs.push([left, right]);
    }
  }

  const mixed = sample(additionPairs, 15).map(([left, right]) => ({ left, right, operation: "+" }));
  mixed.push(...sample(subtractionPairs, 15).map(([left, right]) => ({ left, right, operation: "−" })));
  shuffle(mixed).forEach(({ left, right, operation }, index) => {
    const answer = operation === "+" ? left + right : left - right;
    questions.push({
      number: index + 11,
      section: "加减法题",
      operation,
      text: `${left} ${operation} ${right} = ______`,
      answer: String(answer),
    });
  });

  return { date: paperDate, questions };
}

function isValidPaper(paper) {
  if (!paper || !Array.isArray(paper.questions) || paper.questions.length !== 40) return false;
  return paper.questions.filter(question => question.operation === "×").length === 10
    && paper.questions.filter(question => question.operation === "+").length === 15
    && paper.questions.filter(question => question.operation === "−").length === 15;
}

module.exports = { createPaper, formatDate, isValidPaper };
