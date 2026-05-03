import React, { forwardRef } from 'react';

export const Input = forwardRef(({ 
  label, 
  error, 
  id, 
  className = '', 
  ...props 
}, ref) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`form-input ${error ? 'border-danger' : ''}`}
        {...props}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
