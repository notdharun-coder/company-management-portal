export default function CompanyForm({
  row,
  index,
  errors,
  canAdd,
  canRemove,
  onChange,
  onAdd,
  onRemove,
  formRef,
}) {
  function update(field, value) {
    onChange(index, { ...row, [field]: value });
  }

  return (
    <div className="company-form" ref={formRef}>
      <label>
        Company Name
        <input
          className={errors.company_name ? "input-error" : ""}
          value={row.company_name}
          onChange={(event) => update("company_name", event.target.value)}
        />
        {errors.company_name && <span className="field-error">{errors.company_name}</span>}
      </label>

      <label>
        Company Email
        <input
          className={errors.email ? "input-error" : ""}
          type="email"
          value={row.email}
          onChange={(event) => update("email", event.target.value)}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </label>

      <label>
        Company Phone Number
        <input
          className={errors.phone ? "input-error" : ""}
          value={row.phone}
          maxLength={10}
          onChange={(event) => update("phone", event.target.value)}
        />
        {errors.phone && <span className="field-error">{errors.phone}</span>}
      </label>

      <label>
        Address
        <textarea
          className={errors.address ? "input-error" : ""}
          value={row.address}
          onChange={(event) => update("address", event.target.value)}
        />
        {errors.address && <span className="field-error">{errors.address}</span>}
      </label>

      <label>
        Industry
        <select value={row.industry} onChange={(event) => update("industry", event.target.value)}>
          <option value="Private sector">Private sector</option>
          <option value="Government">Government</option>
        </select>
      </label>

      <label>
        Company Website
        <input
          className={errors.website ? "input-error" : ""}
          value={row.website}
          onChange={(event) => update("website", event.target.value)}
        />
        {errors.website && <span className="field-error">{errors.website}</span>}
      </label>

      {canAdd && (
        <div className="row-action-buttons">
          <button
            type="button"
            className="row-action-button add-row-button"
            onClick={onAdd}
            aria-label="Add company row"
          >
            +
          </button>
          <button
            type="button"
            className="row-action-button remove-row-button"
            disabled={!canRemove}
            onClick={() => onRemove(index)}
            aria-label="Remove company row"
          >
            -
          </button>
        </div>
      )}
    </div>
  );
}
