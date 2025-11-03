import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-purple-200" htmlFor={props.id}>
            {label}
            {props.required && <span className="text-pink-400 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2 rounded-lg bg-purple-950/50 border ${
            error ? "border-pink-500/60" : "border-purple-500/30"
          } text-purple-100 placeholder-purple-400/50 focus:outline-none focus:ring-2 ${
            error ? "focus:ring-pink-500/40" : "focus:ring-purple-500/40"
          } focus:border-transparent transition-all ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-pink-400">{error}</p>}
        {helperText && !error && <p className="text-sm text-purple-300/60">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
