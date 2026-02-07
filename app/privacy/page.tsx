// app/privacy/page.tsx
export default function Privacy() {
  return (
    <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto', color: '#333', lineHeight: '1.6' }}>
      <h1 style={{ color: '#d63384' }}>Privacy Policy</h1>
      <p>Last updated: February 7, 2026</p>
      <p>At The Saju, we respect your privacy. This policy explains how we handle your data.</p>
      
      <h2 style={{ marginTop: '30px' }}>1. Information We Collect</h2>
      <p>We collect birth date and time information provided by you to generate Saju reports. This data is processed through our AI analysis partner (Google Gemini).</p>
      
      <h2 style={{ marginTop: '30px' }}>2. Data Usage</h2>
      <p>Your data is used solely for generating your report and is not stored permanently for marketing purposes.</p>
      
      <h2 style={{ marginTop: '30px' }}>3. Third-Party Services</h2>
      <p>We use Lemon Squeezy for secure payment processing. They handle your billing information according to their own privacy standards.</p>
      
      <div style={{ marginTop: '50px' }}>
        <a href="/" style={{ color: '#d63384', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Home</a>
      </div>
    </div>
  );
}