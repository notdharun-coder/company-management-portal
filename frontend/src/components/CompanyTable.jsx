import { useEffect, useRef, useState } from "react";

function externalWebsiteUrl(website) {
  if (!website) {
    return "";
  }

  return website.startsWith("http://") || website.startsWith("https://")
    ? website
    : `https://${website}`;
}

export default function CompanyTable({ companies, loading, onEdit, onDelete }) {
  const tableRef = useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [maxScrollLeft, setMaxScrollLeft] = useState(0);

  useEffect(() => {
    function updateScrollLimits() {
      const table = tableRef.current;
      if (!table) {
        return;
      }

      setScrollLeft(table.scrollLeft);
      setMaxScrollLeft(Math.max(0, table.scrollWidth - table.clientWidth));
    }

    updateScrollLimits();
    window.addEventListener("resize", updateScrollLimits);
    const resizeObserver = new ResizeObserver(updateScrollLimits);

    if (tableRef.current) {
      resizeObserver.observe(tableRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateScrollLimits);
      resizeObserver.disconnect();
    };
  }, [companies, loading]);

  function handleTableScroll(event) {
    setScrollLeft(event.currentTarget.scrollLeft);
  }

  function handleScrollControlChange(event) {
    const nextScrollLeft = Number(event.target.value);
    setScrollLeft(nextScrollLeft);

    if (tableRef.current) {
      tableRef.current.scrollLeft = nextScrollLeft;
    }
  }

  return (
    <section className="table-scroll-area">
      <div className="table-wrap" ref={tableRef} onScroll={handleTableScroll}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Number</th>
              <th>Industry</th>
              <th>Website</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="7" className="empty-state">Loading companies...</td>
              </tr>
            )}
            {!loading && companies.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-state">No companies found.</td>
              </tr>
            )}
            {!loading && companies.map((company) => (
              <tr key={company.id}>
                <td>{company.company_name}</td>
                <td>{company.email}</td>
                <td>{company.phone || "-"}</td>
                <td>{company.industry || "-"}</td>
                <td>
                  {company.website ? (
                    <a href={externalWebsiteUrl(company.website)} target="_blank" rel="noreferrer">
                      Visit
                    </a>
                  ) : "-"}
                </td>
                <td>{new Date(company.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="row-actions">
                    <button onClick={() => onEdit(company)}>Edit</button>
                    <button className="danger-button" onClick={() => onDelete(company.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {maxScrollLeft > 0 && (
        <input
          aria-label="Scroll company records horizontally"
          className="table-scroll-control"
          max={maxScrollLeft}
          min="0"
          step="1"
          type="range"
          value={Math.min(scrollLeft, maxScrollLeft)}
          onChange={handleScrollControlChange}
        />
      )}
    </section>
  );
}
