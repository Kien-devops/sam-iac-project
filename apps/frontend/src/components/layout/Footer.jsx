import React from 'react';

export default function Footer() {
  return (
    <footer className="footer-bar">
      <div className="footer-container">
        <div>
          <p>© {new Date().getFullYear()} Hybrid Cloud Platform. All rights reserved.</p>
          <p className="footer-sub">AWS Fargate ECS REST API • API Gateway Webhooks • SNS Event Dispatcher • S3 Invoice Registry • SES sandbox</p>
        </div>
        <div className="footer-system-text font-mono text-xs">
          VITE_APP_ENV: production • STACK: node20.x
        </div>
      </div>
    </footer>
  );
}
