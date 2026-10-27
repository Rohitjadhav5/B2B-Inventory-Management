// FormInput – labeled input with optional error message
const FormInput = ({ label, id, error, className = '', ...props }) => (
  <div className="form-group">
    {label && <label className="form-label" htmlFor={id}>{label}</label>}
    <input
      id={id}
      className={`form-input ${error ? 'error' : ''} ${className}`}
      {...props}
    />
    {error && <span className="form-error">{error}</span>}
  </div>
);

export default FormInput;
