import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger";
};

export function Button({ variant = "default", className = "", ...props }: Props) {
  return <button className={`btn ${variant} ${className}`.trim()} {...props} />;
}
