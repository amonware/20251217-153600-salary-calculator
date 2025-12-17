// 숫자 포맷팅
function formatNumber(num) {
  return num.toLocaleString('ko-KR') + '원';
}

// 입력값 포맷팅
document.getElementById('salary').addEventListener('input', function(e) {
  let value = e.target.value.replace(/[^0-9]/g, '');
  if (value) {
    e.target.value = parseInt(value).toLocaleString('ko-KR');
  }
});

// 빠른 선택 버튼
function setSalary(amount) {
  document.getElementById('salary').value = amount.toLocaleString('ko-KR');
  calculate();
}

// 계산 실행
async function calculate() {
  const salaryInput = document.getElementById('salary').value;
  const salary = parseInt(salaryInput.replace(/[^0-9]/g, ''));
  const dependents = parseInt(document.getElementById('dependents').value);

  if (!salary || salary <= 0) {
    alert('연봉을 입력해주세요.');
    return;
  }

  try {
    const response = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ annualSalary: salary, dependents })
    });

    const data = await response.json();

    if (response.ok) {
      displayResult(data);
    } else {
      alert(data.error || '계산 중 오류가 발생했습니다.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('서버 연결에 실패했습니다.');
  }
}

// 결과 표시
function displayResult(data) {
  document.getElementById('result').style.display = 'block';

  // 요약
  document.getElementById('netMonthly').textContent = formatNumber(data.monthly.net);
  document.getElementById('netAnnual').textContent = formatNumber(data.annual.net);

  // 상세 내역
  document.getElementById('grossMonthly').textContent = formatNumber(data.monthly.gross);
  document.getElementById('nationalPension').textContent = formatNumber(data.monthly.nationalPension);
  document.getElementById('healthInsurance').textContent = formatNumber(data.monthly.healthInsurance);
  document.getElementById('longTermCare').textContent = formatNumber(data.monthly.longTermCare);
  document.getElementById('employmentInsurance').textContent = formatNumber(data.monthly.employmentInsurance);
  document.getElementById('totalInsurance').textContent = formatNumber(data.monthly.totalInsurance);
  document.getElementById('incomeTax').textContent = formatNumber(data.monthly.incomeTax);
  document.getElementById('localIncomeTax').textContent = formatNumber(data.monthly.localIncomeTax);
  document.getElementById('totalDeductions').textContent = formatNumber(data.monthly.totalDeductions);
  document.getElementById('netSalary').innerHTML = '<strong>' + formatNumber(data.monthly.net) + '</strong>';

  // 결과 섹션으로 스크롤
  document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
}

// Enter 키로 계산
document.getElementById('salary').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    calculate();
  }
});
