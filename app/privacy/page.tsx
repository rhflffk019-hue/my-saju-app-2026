// app/privacy/page.tsx
export default function Privacy() {
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
      <h1 style={{ color: '#d63384' }}>Privacy Policy</h1>
      <p>Last updated: February 7, 2026</p>

      <h2 style={{ marginTop: '30px' }}>1. Information We Collect</h2>
      <p>
        We collect the information you provide to generate your report, such as birth date, birth
        time, time zone, and any names or relationship labels you enter. We may also collect basic
        technical data (e.g., device/browser information, IP address, and usage logs) to help operate
        and secure the service.
      </p>

      <h2 style={{ marginTop: '30px' }}>2. How We Use Your Information</h2>
      <p>
        We use your information solely to generate and deliver your Saju report, provide customer
        support, prevent fraud/abuse, and maintain the security and performance of the service. We do
        not sell your personal information.
      </p>

      <h2 style={{ marginTop: '30px' }}>3. Report Storage and Retention</h2>
      <p>
        To ensure privacy and system performance, generated reports and related inputs may be stored
        for up to <b>30 days</b> from the date of purchase to allow you to access your result. After
        this retention period, we delete or anonymize the stored data unless we are required to keep
        it longer for legal, accounting, or security reasons.
      </p>

      <h2 style={{ marginTop: '30px' }}>4. Cookies and Analytics</h2>
      <p>
        We may use cookies or similar technologies to keep the site working properly and to
        understand basic usage (for example, which pages are visited). Where used, these tools are
        intended to improve the service and security.
      </p>

      <h2 style={{ marginTop: '30px' }}>5. Secure Payments</h2>
      <p>
        Payments are processed by <b>Gumroad</b>. We do not store or have access to your full
        credit card details. Gumroad may collect and process payment-related information in
        accordance with its own policies.
      </p>

      <h2 style={{ marginTop: '30px' }}>6. Sharing of Information</h2>
      <p>
        We may share information with service providers that help us operate the service (for
        example, payment processing and hosting). We only share what is necessary to provide the
        service and do not sell your information. We may also disclose information if required by
        law or to protect the rights and safety of our users and the service.
      </p>

      <h2 style={{ marginTop: '30px' }}>7. Your Choices</h2>
      <p>
        You may request access, correction, or deletion of your data by contacting us. Please note
        that we may need to retain certain information for legal, accounting, or security purposes.
      </p>

      <h2 style={{ marginTop: '30px' }}>8. Contact</h2>
      <p>
        If you have questions about this Privacy Policy or your data, please contact us at:{' '}
        <b>[mythesaju@gmail.com]</b>
      </p>

      <div style={{ marginTop: '50px' }}>
        <a href="/" style={{ color: '#d63384', textDecoration: 'none', fontWeight: 'bold' }}>
          ← Back to Home
        </a>
      </div>
    </div>
  );
}
