
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900/80 text-white text-center py-4 text-sm">
      <div className="container mx-auto">
        CRSG Attendance & Leave Management System &copy; {new Date().getFullYear()}. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
