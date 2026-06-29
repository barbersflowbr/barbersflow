import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex items-center inline-block">
      <div 
        className="cursor-help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        <HelpCircle className="w-4 h-4 text-gray-500 hover:text-amber-500 transition-colors" />
      </div>
      {show && (
        <div className="absolute left-6 top-0 z-50 w-48 p-2 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-normal">
          {content}
        </div>
      )}
    </div>
  );
};
