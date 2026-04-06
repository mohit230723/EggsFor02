import React from "react";

export function Footer() {
  return (
    <footer className="mt-auto pt-8 pb-6 relative">
      {/* Rainbow divider */}
      <div className="punk-divider mb-8" />
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-heading text-2xl text-inkBlack tracking-tight uppercase">CORTEX</span>
          <span className="font-jp text-sm text-punkPink font-bold opacity-50">コーテックス</span>
          <span className="text-streetGray">|</span>
          <span className="text-streetGray text-sm font-body">Built for Algorand Hackseries 3</span>
        </div>
        
        <div className="flex gap-4 text-sm font-body font-bold tracking-wider">
          <a href="#" className="text-inkBlack hover:text-punkPink transition-colors uppercase">GitHub</a>
          <a href="#" className="text-inkBlack hover:text-punkPurple transition-colors uppercase">Twitter</a>
          <a href="#" className="text-inkBlack hover:text-punkBlue transition-colors uppercase">Discord</a>
        </div>
      </div>

      {/* Decorative Japanese text */}
      <div className="absolute bottom-2 right-4 jp-accent text-6xl select-none">
        闘
      </div>
    </footer>
  );
}
