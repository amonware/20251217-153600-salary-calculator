const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// 2024년 기준 4대보험 요율
const INSURANCE_RATES = {
  nationalPension: 0.045,      // 국민연금 4.5%
  healthInsurance: 0.0354,     // 건강보험 3.545%
  longTermCare: 0.1295,        // 장기요양보험 (건강보험의 12.95%)
  employmentInsurance: 0.009   // 고용보험 0.9%
};

// 소득세 구간 (2024년 기준)
const TAX_BRACKETS = [
  { min: 0, max: 14000000, rate: 0.06, deduction: 0 },
  { min: 14000000, max: 50000000, rate: 0.15, deduction: 1260000 },
  { min: 50000000, max: 88000000, rate: 0.24, deduction: 5760000 },
  { min: 88000000, max: 150000000, rate: 0.35, deduction: 15440000 },
  { min: 150000000, max: 300000000, rate: 0.38, deduction: 19940000 },
  { min: 300000000, max: 500000000, rate: 0.40, deduction: 25940000 },
  { min: 500000000, max: 1000000000, rate: 0.42, deduction: 35940000 },
  { min: 1000000000, max: Infinity, rate: 0.45, deduction: 65940000 }
];

function calculateSalary(annualSalary, dependents = 1) {
  const monthlySalary = annualSalary / 12;

  // 4대보험 계산 (월 기준)
  const nationalPension = Math.min(monthlySalary * INSURANCE_RATES.nationalPension, 265500); // 상한액
  const healthInsurance = monthlySalary * INSURANCE_RATES.healthInsurance;
  const longTermCare = healthInsurance * INSURANCE_RATES.longTermCare;
  const employmentInsurance = monthlySalary * INSURANCE_RATES.employmentInsurance;

  const totalInsurance = nationalPension + healthInsurance + longTermCare + employmentInsurance;

  // 연간 과세표준 계산 (간이세액표 기준 근사치)
  const taxableIncome = annualSalary - (totalInsurance * 12);

  // 소득세 계산
  let incomeTax = 0;
  for (const bracket of TAX_BRACKETS) {
    if (taxableIncome > bracket.min) {
      incomeTax = taxableIncome * bracket.rate - bracket.deduction;
      if (taxableIncome <= bracket.max) break;
    }
  }

  // 부양가족 공제 적용 (간이)
  const dependentDeduction = (dependents - 1) * 1500000 * 0.15;
  incomeTax = Math.max(0, incomeTax - dependentDeduction);

  const monthlyIncomeTax = incomeTax / 12;
  const localIncomeTax = monthlyIncomeTax * 0.1; // 지방소득세 10%

  const totalDeductions = totalInsurance + monthlyIncomeTax + localIncomeTax;
  const netSalary = monthlySalary - totalDeductions;

  return {
    annual: {
      gross: annualSalary,
      net: netSalary * 12
    },
    monthly: {
      gross: Math.round(monthlySalary),
      nationalPension: Math.round(nationalPension),
      healthInsurance: Math.round(healthInsurance),
      longTermCare: Math.round(longTermCare),
      employmentInsurance: Math.round(employmentInsurance),
      totalInsurance: Math.round(totalInsurance),
      incomeTax: Math.round(monthlyIncomeTax),
      localIncomeTax: Math.round(localIncomeTax),
      totalDeductions: Math.round(totalDeductions),
      net: Math.round(netSalary)
    }
  };
}

// API 엔드포인트
app.post('/api/calculate', (req, res) => {
  const { annualSalary, dependents = 1 } = req.body;

  if (!annualSalary || annualSalary < 0) {
    return res.status(400).json({ error: '유효한 연봉을 입력해주세요.' });
  }

  const result = calculateSalary(annualSalary, dependents);
  res.json(result);
});

app.get('/api/rates', (req, res) => {
  res.json({
    insuranceRates: INSURANCE_RATES,
    taxBrackets: TAX_BRACKETS.map(b => ({
      ...b,
      max: b.max === Infinity ? '초과' : b.max
    }))
  });
});

app.listen(PORT, () => {
  console.log(`Salary Calculator running on port ${PORT}`);
});
