export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>Last updated: September 2026</p>
      <p>
        This policy describes how BloodLink handles personal data for users in India. It is written to align with
        common expectations under the Digital Personal Data Protection Act (DPDP); obtain legal review before a public
        launch at scale.
      </p>
      <h2>Data we collect</h2>
      <ul>
        <li>Account: name, email, authentication identifiers.</li>
        <li>Profile: blood group (donors), location (GPS or PIN-derived coordinates), availability preferences.</li>
        <li>Requests: patient name, hospital/location, urgency, units needed, deadlines.</li>
        <li>Messages: chat content between matched requesters and donors.</li>
        <li>Technical: device/browser data via hosting and error logs (if enabled).</li>
      </ul>
      <h2>Why we use it</h2>
      <ul>
        <li>Matching donors to requests and sending alerts you opt into.</li>
        <li>Operating communities and admin safety tools.</li>
        <li>Improving reliability and preventing abuse.</li>
      </ul>
      <h2>Sharing</h2>
      <p>
        We do not sell personal data. Limited data is visible to other users as needed to coordinate donation (for
        example, request details to invited donors). Infrastructure providers (hosting, database, email/SMS) process
        data on our behalf under contract.
      </p>
      <h2>Retention</h2>
      <p>
        We retain account and request history while your account is active and as needed for safety audits. You may
        request account deletion through support; some logs may be retained where required by law.
      </p>
      <h2>Your choices</h2>
      <ul>
        <li>Turn off donor availability or GPS at any time in Profile.</li>
        <li>Control community-only notifications in donor settings.</li>
      </ul>
      <h2>Contact</h2>
      <p>For privacy requests, contact the project operator listed in your deployment documentation.</p>
    </>
  );
}
