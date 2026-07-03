import { useEffect, useRef, useState } from "react";

import CompanyForm from "./CompanyForm.jsx";

const emptyCompany = {
  company_name: "",
  email: "",
  phone: "",
  address: "",
  industry: "Private sector",
  website: "",
};

function toFormRow(company) {
  if (!company) {
    return { ...emptyCompany };
  }

  return {
    company_name: company.company_name || "",
    email: company.email || "",
    phone: company.phone || "",
    address: company.address || "",
    industry: company.industry || "Private sector",
    website: company.website || "",
  };
}

function companyDisplayName(row) {
  return row.company_name.trim() || row.email.trim() || row.phone.trim() || "this company";
}

export default function CompanyModal({
  company,
  mode = "add",
  onClose,
  onSave,
  onToast,
}) {
  const isEditMode = mode === "edit";
  const [rows, setRows] = useState([toFormRow(company)]);
  const [errors, setErrors] = useState([{}]);
  const [saving, setSaving] = useState(false);
  const rowRefs = useRef([]);
  const pendingScrollIndex = useRef(null);

  useEffect(() => {
    if (pendingScrollIndex.current === null) {
      return;
    }

    const row = rowRefs.current[pendingScrollIndex.current];
    pendingScrollIndex.current = null;
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [rows.length, errors]);

  function updateRow(index, nextRow) {
    setRows(rows.map((row, rowIndex) => (rowIndex === index ? nextRow : row)));
  }

  function addRow() {
    pendingScrollIndex.current = rows.length;
    setRows([...rows, { ...emptyCompany }]);
    setErrors([...errors, {}]);
  }

  function removeRow(index) {
    setRows(rows.filter((_, rowIndex) => rowIndex !== index));
    setErrors(errors.filter((_, rowIndex) => rowIndex !== index));
  }

  function validate() {
    const seen = {
      company_name: new Map(),
      email: new Map(),
      phone: new Map(),
    };
    let firstInvalidIndex = -1;

    const nextErrors = rows.map((row, index) => {
      return {
        company_name: row.company_name.trim() ? "" : "Company name is required",
        email: row.email.trim() ? "" : "Company email is required",
        phone: row.phone.trim() ? "" : "Company phone number is required",
        address: row.address.trim() ? "" : "Address is required",
        website: row.website.trim() ? "" : "Company website is required",
      };
    });

    [
      ["company_name", "Company name"],
      ["email", "Company email"],
      ["phone", "Company phone number"],
    ].forEach(([field, label]) => {
      rows.forEach((row, index) => {
        const value = String(row[field] || "").trim().toLowerCase();
        if (!value) {
          return;
        }

        if (seen[field].has(value)) {
          const originalIndex = seen[field].get(value);
          nextErrors[index][field] = `${label} already used in ${companyDisplayName(rows[originalIndex])}.`;
          if (!nextErrors[originalIndex][field]) {
            nextErrors[originalIndex][field] = `${label} already used in ${companyDisplayName(row)}.`;
          }
          return;
        }

        seen[field].set(value, index);
      });
    });

    nextErrors.forEach((rowErrors, index) => {
      if (
        firstInvalidIndex === -1 &&
        (
          rowErrors.company_name ||
          rowErrors.email ||
          rowErrors.phone ||
          rowErrors.address ||
          rowErrors.website
        )
      ) {
        firstInvalidIndex = index;
      }
    });

    setErrors(nextErrors);
    if (firstInvalidIndex !== -1) {
      pendingScrollIndex.current = firstInvalidIndex;
    }

    return nextErrors.every((row) => (
      !row.company_name &&
      !row.email &&
      !row.phone &&
      !row.address &&
      !row.website
    ));
  }

  function scrollToDuplicateValue(field, value, message) {
    const index = rows.findIndex((row) => row[field].trim().toLowerCase() === value.toLowerCase());
    if (index === -1) {
      return false;
    }

    setErrors(rows.map((_, rowIndex) => (
      rowIndex === index ? { [field]: message } : {}
    )));
    pendingScrollIndex.current = index;
    return true;
  }

  function scrollToBackendError(detail) {
    if (!detail || typeof detail !== "object" || !detail.field || !detail.value) {
      return false;
    }

    return scrollToDuplicateValue(detail.field, detail.value, detail.message);
  }

  async function submit(event) {
    event.preventDefault();
    if (!validate()) {
      onToast("Please fix the highlighted company details.", "error");
      return;
    }

    setSaving(true);
    try {
      const cleanedRows = rows.map((row) => ({
        ...row,
        company_name: row.company_name.trim(),
        email: row.email.trim(),
        phone: row.phone.trim(),
        address: row.address.trim(),
        industry: row.industry.trim(),
        website: row.website.trim(),
      }));
      await onSave(isEditMode ? cleanedRows[0] : cleanedRows);
    } catch (error) {
      const detail = error.response?.data?.detail || "Unable to save company.";
      const didScroll = scrollToBackendError(detail);
      const message = typeof detail === "string" ? detail : detail.message;
      onToast(didScroll ? "Duplicate record found." : message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal" onSubmit={submit}>
        <header className="modal-header">
          <div>
            <h2>{isEditMode ? "Edit Company" : "Add Companies"}</h2>
          </div>
          <button type="button" className="icon-button close-button" onClick={onClose} aria-label="Close">
            x
          </button>
        </header>

        <div className="modal-body">
          {rows.map((row, index) => (
            <CompanyForm
              key={index}
              row={row}
              index={index}
              errors={errors[index] || {}}
              canAdd={!isEditMode}
              canRemove={!isEditMode && rows.length > 1}
              formRef={(element) => {
                rowRefs.current[index] = element;
              }}
              onChange={updateRow}
              onAdd={addRow}
              onRemove={removeRow}
            />
          ))}
        </div>

        <footer className="modal-footer">
          <button className="primary-button" disabled={saving} type="submit">
            {saving ? "Saving..." : isEditMode ? "Save Changes" : "Save All"}
          </button>
        </footer>
      </form>
    </div>
  );
}
