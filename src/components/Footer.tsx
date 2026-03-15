import React from "react";

export function Footer() {
  return (
    <footer className="mt-auto py-8 border-t border-steel/20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="font-heading text-2xl text-smoke tracking-widest">CORTEX</span>
          <span className="text-steel">|</span>
          <span className="text-smoke text-sm">Built for Algorand Hackseries 3</span>
        </div>
        
        <div className="flex space-x-4 text-sm font-heading tracking-wider text-smoke">
          <a href="#" className="hover:text-amber transition-colors">GitHub</a>
          <a href="#" className="hover:text-amber transition-colors">Twitter</a>
          <a href="#" className="hover:text-amber transition-colors">Discord</a>
        </div>
      </div>
    </footer>
  );
}
