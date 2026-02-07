// app/privacy/page.tsx
export default function Privacy() {
  return (
    <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto', color: '#333', lineHeight: '1.6' }}>
      <h1 style={{ color: '#d63384' }}>Privacy Policy</h1>
      <p>Last updated: February 7, 2026</p>
      
      <h2 style={{ marginTop: '30px' }}>1. Information We Collect</h2>
      <p>We collect birth date and time information provided by you to generate your personalized Saju report.</p>
      
      <h2 style={{ marginTop: '30px' }}>2. Data Usage</h2>
      <p>The provided information is processed through our <b>secure analysis framework</b> to generate insights. This data is used solely for generating your report and is not stored permanently for any other purpose.</p>
      
      <h2 style={{ marginTop: '30px' }}>3. Secure Payments</h2>
      <p>We use Lemon Squeezy for secure payment processing. We do not store or have access to your credit card details.</p>
      
      <div style={{ marginTop: '50px' }}>
        <a href="/" style={{ color: '#d63384', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Home</a>
      </div>
    </div>
  );
}