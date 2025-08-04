// Google Apps Script Web App URLを設定
// TODO: ここにデプロイ後のURLを設定してください
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwM6jjjn7TRIy_BEiW5XputyfitYGw2HQU-AHqtnHuWQ2w8qtbHxkZla4lptspEDjT5/exec'; // 例: https://script.google.com/macros/s/AKfycb.../exec

// フォームの送信処理
document.getElementById('diagnosisForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // ボタンを無効化してローディング状態に
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '診断中...';
    
    // フォームデータを収集
    const formData = collectFormData();
    
    // 診断スコアを計算
    const scores = calculateScores(formData);
    
    // 結果を表示
    displayResults(scores);
    
    // Google Sheetsに送信（バックグラウンドで実行）
    sendToGoogleSheets({...formData, ...scores});
    
    // ボタンを元に戻す
    submitBtn.disabled = false;
    submitBtn.textContent = '診断結果を確認する';
    
    // フォームを非表示にして結果セクションを表示
    document.getElementById('diagnosisForm').style.display = 'none';
    document.getElementById('resultSection').style.display = 'block';
    
    // 結果セクションまでスクロール
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
});

// フォームデータを収集する関数
function collectFormData() {
    const form = document.getElementById('diagnosisForm');
    const formData = {
        timestamp: new Date().toLocaleString('ja-JP'),
        industry: form.industry.value,
        employees: form.employees.value,
        repetitive_tasks: form.repetitive_tasks.value,
        spreadsheet_usage: form.spreadsheet_usage.value,
        customer_management: getCheckedValues('customer_management'),
        efficiency_interest: form.efficiency_interest.value,
        it_budget: form.it_budget.value,
        data_utilization: form.data_utilization.value,
        challenges: getCheckedValues('challenges'),
        remote_work: form.remote_work.value,
        subsidy_interest: form.subsidy_interest.value,
        specific_needs: form.specific_needs.value,
        timeline: form.timeline.value,
        company: form.company.value,
        name: form.name.value,
        email: form.email.value,
        phone: form.phone.value
    };
    
    return formData;
}

// チェックボックスの選択値を取得
function getCheckedValues(name) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value).join(', ');
}

// 診断スコアを計算
function calculateScores(formData) {
    let saasScore = 0;
    let subsidyScore = 0;
    
    // SaaS化適性スコアの計算
    // 繰り返し業務
    if (formData.repetitive_tasks === 'はい、たくさんある') saasScore += 25;
    else if (formData.repetitive_tasks === 'はい、いくつかある') saasScore += 15;
    else if (formData.repetitive_tasks === 'あまりない') saasScore += 5;
    
    // スプレッドシート使用頻度
    if (formData.spreadsheet_usage === '毎日使用') saasScore += 25;
    else if (formData.spreadsheet_usage === '週に数回') saasScore += 15;
    else if (formData.spreadsheet_usage === '月に数回') saasScore += 5;
    
    // 効率化への関心
    if (formData.efficiency_interest === '非常に関心がある') saasScore += 20;
    else if (formData.efficiency_interest === '関心がある') saasScore += 10;
    
    // データ活用状況
    if (formData.data_utilization === '積極的に活用している') saasScore += 15;
    else if (formData.data_utilization === 'ある程度活用している') saasScore += 10;
    else if (formData.data_utilization === 'あまり活用していない') saasScore += 5;
    
    // 課題感（課題が多いほど高スコア）
    const challengeCount = formData.challenges.split(', ').filter(c => c && c !== '特に課題は感じていない').length;
    saasScore += Math.min(challengeCount * 3, 15);
    
    // 補助金活用スコアの計算
    // 補助金への関心
    if (formData.subsidy_interest === '非常に関心がある') subsidyScore += 40;
    else if (formData.subsidy_interest === '関心がある') subsidyScore += 25;
    else if (formData.subsidy_interest === 'よくわからない') subsidyScore += 10;
    
    // 従業員数（中小企業が対象）
    if (['1-10人', '11-50人', '51-100人'].includes(formData.employees)) subsidyScore += 20;
    else if (formData.employees === '101-500人') subsidyScore += 10;
    
    // IT予算
    if (['1-5万円', '5-10万円', '10-50万円'].includes(formData.it_budget)) subsidyScore += 20;
    else if (formData.it_budget === '50万円以上') subsidyScore += 10;
    
    // 導入時期
    if (formData.timeline === 'すぐにでも') subsidyScore += 20;
    else if (formData.timeline === '3ヶ月以内') subsidyScore += 15;
    else if (formData.timeline === '6ヶ月以内') subsidyScore += 10;
    
    // スコアを100点満点に正規化
    saasScore = Math.min(saasScore, 100);
    subsidyScore = Math.min(subsidyScore, 100);
    
    return {
        saasScore,
        subsidyScore,
        saasMessage: getSaasMessage(saasScore),
        subsidyMessage: getSubsidyMessage(subsidyScore)
    };
}

// SaaS化適性メッセージを取得
function getSaasMessage(score) {
    if (score >= 80) {
        return '非常に高い適性があります！早期のSaaS化をお勧めします。';
    } else if (score >= 60) {
        return '高い適性があります。業務効率化の大きなチャンスです。';
    } else if (score >= 40) {
        return '適性があります。部分的なSaaS化から始めることをお勧めします。';
    } else {
        return '現状では適性は中程度です。まずは業務整理から始めましょう。';
    }
}

// 補助金活用メッセージを取得
function getSubsidyMessage(score) {
    if (score >= 80) {
        return 'IT導入補助金の活用に最適です！最大450万円の補助が可能です。';
    } else if (score >= 60) {
        return '補助金活用の可能性が高いです。申請サポートをご利用ください。';
    } else if (score >= 40) {
        return '補助金活用の可能性があります。詳細な条件を確認しましょう。';
    } else {
        return '補助金については個別相談が必要です。お気軽にご相談ください。';
    }
}

// 結果を表示
function displayResults(scores) {
    document.getElementById('saasScore').textContent = scores.saasScore;
    document.getElementById('saasMessage').textContent = scores.saasMessage;
    document.getElementById('subsidyScore').textContent = scores.subsidyScore;
    document.getElementById('subsidyMessage').textContent = scores.subsidyMessage;
}

// Google Sheetsに送信
async function sendToGoogleSheets(data) {
    // GAS_URLが設定されていない場合はスキップ
    if (GAS_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
        console.log('Google Sheets連携はまだ設定されていません');
        console.log('送信予定のデータ:', data);
        return;
    }
    
    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors', // CORSエラーを回避
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(data)
        });
        
        console.log('データ送信完了');
    } catch (error) {
        console.error('データ送信エラー:', error);
        // エラーが発生してもユーザー体験を損なわないようにする
    }
}

// ページ読み込み時の処理
window.addEventListener('DOMContentLoaded', function() {
    // フォームのリセット
    document.getElementById('diagnosisForm').reset();
    
    // 結果セクションを非表示に
    document.getElementById('resultSection').style.display = 'none';
});