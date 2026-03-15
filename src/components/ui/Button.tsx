import React from "react";
import Link from "next/link";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  children: React.ReactNode;
}

export function Button({ 
  variant = "primary", 
  size = "md", 
  href, 
  className = "", 
  children, 
  ...props 
}: ButtonProps) {
  const baseClasses = "font-heading uppercase tracking-wider transition-all duration-300 inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-amber text-nearBlack hover:bg-bone shadow-md hover:shadow-amber/30 hover:shadow-lg",
    secondary: "border border-bone text-bone hover:bg-charcoal",
    danger: "bg-bloodRed text-bone hover:bg-rust shadow-md hover:shadow-bloodRed/30 hover:shadow-lg",
    ghost: "text-smoke hover:text-amber hover:underline",
  };
  
  const sizeClasses = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-6 py-2.5 text-lg",
    lg: "px-8 py-3 text-xl",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
