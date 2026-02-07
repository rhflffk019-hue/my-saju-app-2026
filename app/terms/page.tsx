// app/terms/page.tsx
export default function Terms() {
  return (
    <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto', color: '#333', lineHeight: '1.6' }}>
      <h1 style={{ color: '#d63384' }}>Terms of Service</h1>
      <p>Last updated: February 7, 2026</p>
      
      <h2 style={{ marginTop: '30px' }}>1. Service Description</h2>
      <p>The Saju provides personalized compatibility reports based on traditional Korean Saju frameworks and our <b>modern digitized analysis system</b>.</p>
      
      <h2 style={{ marginTop: '30px', color: '#ff4d4d' }}>2. Entertainment Disclaimer (Important)</h2>
      <p><b>This service is for entertainment purposes only.</b> Saju analysis is not a substitute for professional, legal, medical, or financial advice. The results are based on cultural traditions and <b>systematic interpretations</b>.</p>
      
      <h2 style={{ marginTop: '30px' }}>3. Payments and Refunds</h2>
      <p>All sales are processed via Lemon Squeezy. Due to the digital nature of the reports, refunds are generally not provided once the analysis has been generated.</p>
      
      <h2 style={{ marginTop: '30px' }}>4. User Data</h2>
      <p>You agree that the birth information provided is accurate for the purpose of the analysis.</p>

      <div style={{ marginTop: '50px' }}>
        <a href="/" style={{ color: '#d63384', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Home</a>
      </div>
    </div>
  );
}