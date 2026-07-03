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

const DEFAULT_ADD_ROWS = 5;

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

function createEmptyRows(count) {
  return Array.from({ length: count }, () => ({ ...emptyCompany }));
}

function rowHasUserInput(row) {
  return Boolean(
    row.company_name.trim() ||
    row.email.trim() ||
    row.phone.trim() ||
    row.address.trim() ||
    row.website.trim()
  );
}

function optionalText(value) {
  const trimmedValue = value.trim();
  return trimmedValue || null;
}

function apiErrorMessage(detail) {
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const message = detail
      .map((item) => item.msg || item.message)
      .filter(Boolean)
      .join(" ");

    if (message.includes("Input should be a valid string")) {
      return "Please restart the backend server, then try saving again.";
    }

    return message || "Unable to save company.";
  }

  if (detail && typeof detail === "object") {
    return detail.message || detail.detail || "Unable to save company.";
  }

  return "Unable to save company.";
}

export default function CompanyModal({
  company,
  mode = "add",
  onClose,
  onSave,
  onToast,
}) {
  const isEditMode = mode === "edit";
  const initialRows = isEditMode ? [toFormRow(company)] : createEmptyRows(DEFAULT_ADD_ROWS);
  const [rows, setRows] = useState(initialRows);
  const [errors, setErrors] = useState(initialRows.map(() => ({})));
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

  function removeLastRow() {
    if (rows.length <= DEFAULT_ADD_ROWS) {
      return;
    }

    removeRow(rows.length - 1);
  }

  function validate() {
    const seen = {
      company_name: new Map(),
      email: new Map(),
      phone: new Map(),
    };
    let firstInvalidIndex = -1;
    const rowsToSave = rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => rowHasUserInput(row));

    const nextErrors = rows.map((row) => {
      if (!rowHasUserInput(row)) {
        return {};
      }

      return {
        company_name: row.company_name.trim() ? "" : "Company name is required",
        email: "",
        phone: "",
        address: "",
        website: "",
      };
    });

    if (rowsToSave.length === 0) {
      nextErrors[0].company_name = "Company name is required";
      firstInvalidIndex = 0;
    }

    [
      ["company_name", "Company name"],
      ["email", "Company email"],
      ["phone", "Company phone number"],
    ].forEach(([field, label]) => {
      rowsToSave.forEach(({ row, index }) => {
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

    const allValid = nextErrors.every((row) => (
      !row.company_name &&
      !row.email &&
      !row.phone &&
      !row.address &&
      !row.website
    ));

    return allValid ? rowsToSave.map(({ row }) => row) : null;
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
    const validRows = validate();
    if (!validRows) {
      onToast("Please fix the highlighted company details.", "error");
      return;
    }

    setSaving(true);
    try {
      const cleanedRows = validRows.map((row) => ({
        ...row,
        company_name: row.company_name.trim(),
        email: optionalText(row.email),
        phone: optionalText(row.phone),
        address: optionalText(row.address),
        industry: row.industry.trim(),
        website: optionalText(row.website),
      }));
      await onSave(isEditMode ? cleanedRows[0] : cleanedRows);
    } catch (error) {
      const detail = error.response?.data?.detail || "Unable to save company.";
      const didScroll = scrollToBackendError(detail);
      const message = apiErrorMessage(detail);
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
              simple={!isEditMode}
              formRef={(element) => {
                rowRefs.current[index] = element;
              }}
              onChange={updateRow}
            />
          ))}

          {!isEditMode && (
            <div className="modal-row-controls">
              <button
                type="button"
                className="row-action-button add-row-button"
                onClick={addRow}
                aria-label="Add company row"
              >
                +
              </button>
              <button
                type="button"
                className="row-action-button remove-row-button"
                disabled={rows.length <= DEFAULT_ADD_ROWS}
                onClick={removeLastRow}
                aria-label="Remove last company row"
              >
                -
              </button>
            </div>
          )}
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
