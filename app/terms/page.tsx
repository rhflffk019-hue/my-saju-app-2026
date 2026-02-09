// app/terms/page.tsx
export default function Terms() {
  return (
    <div
      style={{
        padding: '40px 20px',
        maxWidth: '600px',
        margin: '0 auto',
        color: '#333',
        lineHeight: '1.6',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <h1 style={{ color: '#d63384' }}>Terms of Service</h1>
      <p>Last updated: February 7, 2026</p>

      <h2 style={{ marginTop: '30px' }}>1. Service Description</h2>
      <p>
        The Saju provides personalized compatibility reports based on traditional Korean Saju
        frameworks and our <b>modern digitized analysis system</b>.
      </p>

      <h2 style={{ marginTop: '30px', color: '#ff4d4d' }}>
        2. Entertainment Disclaimer (Important)
      </h2>
      <p>
        <b>This service is for entertainment purposes only.</b> Saju analysis is not a substitute
        for professional, legal, medical, or financial advice. The results are based on cultural
        traditions and <b>systematic interpretations</b>.
      </p>

      <h2 style={{ marginTop: '30px' }}>3. Pricing and Special Offers</h2>
      <p>
        The current price of <b>$3.99</b> is a limited-time <b>Launch Special</b>. The regular price
        for the premium analysis is <b>$4.99</b>. Prices and promotions may change from time to time,
        and any changes will apply to future purchases only.
      </p>
      <p>Applicable taxes may be added at checkout depending on your location.</p>

      <h2 style={{ marginTop: '30px' }}>4. Payments and Refunds</h2>
      <p>
        All sales are processed via <b>Gumroad</b>. Because the report is digital and delivered
        instantly, purchases are generally <b>non-refundable</b>.
      </p>
      <p>
        However, if you experience a technical issue (for example, you were charged but did not
        receive your report), please contact us and we will help resolve it.
      </p>

      {/* Updated: interpretation-focused wording */}
      <h2 style={{ marginTop: '30px' }}>5. User Data and Interpretations</h2>
      <p>
        You are responsible for providing birth information (date, time, and time zone) to the best
        of your knowledge. Saju-based readings are cultural and interpretive in nature, and results
        may vary depending on the information provided and the analytical framework used. If the
        information entered differs, your report may also differ.
      </p>

      <h2 style={{ marginTop: '30px' }}>6. Report Retention Policy</h2>
      <p>
        To ensure privacy and optimal system performance, your generated report is{' '}
        <b>stored for 30 days</b> from the date of purchase. We recommend saving your result as an
        image if you wish to keep it permanently.
      </p>

      <div style={{ marginTop: '50px' }}>
        <a href="/" style={{ color: '#d63384', textDecoration: 'none', fontWeight: 'bold' }}>
          ← Back to Home
        </a>
      </div>
    </div>
  );
}
