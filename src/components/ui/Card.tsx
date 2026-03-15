import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "highlight" | "danger";
  children: React.ReactNode;
}

export function Card({ variant = "default", className = "", children, ...props }: CardProps) {
  const baseClasses = "bg-charcoal border shadow-md transition-all duration-300";
  
  const variantClasses = {
    default: "border-steel/30 hover:border-steel/60 hover:shadow-lg",
    highlight: "border-steel/30 border-l-4 border-l-amber hover:border-steel/60 hover:shadow-amber/20 hover:shadow-lg",
    danger: "border-steel/30 border-l-4 border-l-bloodRed hover:border-steel/60 hover:shadow-bloodRed/20 hover:shadow-lg",
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
