import React from 'react';

export default function Footer() {
  return (
    <footer className="footer-bar">
      <div className="footer-container" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div>
          <p>© {new Date().getFullYear()} Shopee Fake Storefront. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
