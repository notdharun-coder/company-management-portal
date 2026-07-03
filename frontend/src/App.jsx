import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import AuthPage from "./components/AuthPage.jsx";
import CompanyModal from "./components/CompanyModal.jsx";
import CompanyTable from "./components/CompanyTable.jsx";
import DashboardCards from "./components/DashboardCards.jsx";
import Navbar from "./components/Navbar.jsx";
import Toast from "./components/Toast.jsx";
import {
  deleteCompany,
  fetchCompanies,
  fetchCompanyStats,
  saveCompanies,
  setAuthToken,
  setUnauthorizedHandler,
  signIn,
  signUp,
  updateCompany,
} from "./api.js";

const PAGE_SIZE = 10;

export default function App() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    private_sector: 0,
    government: 0,
    websites: 0,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [companyBeingEdited, setCompanyBeingEdited] = useState(null);
  const [toast, setToast] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);
  const isAuthenticated = Boolean(accessToken && currentUser);

  useEffect(() => {
    setAuthToken(accessToken);
    setUnauthorizedHandler(() => {
      setAccessToken(null);
      setCurrentUser(null);
      setCompanies([]);
      navigate("/home", { replace: true });
    });

    return () => setUnauthorizedHandler(null);
  }, [accessToken, navigate]);

  async function loadCompanies(
    nextPage = page,
    nextSearch = search,
    nextIndustry = industryFilter,
  ) {
    setLoading(true);
    try {
      const data = await fetchCompanies({
        page: nextPage,
        limit: PAGE_SIZE,
        search: nextSearch,
        industry: nextIndustry,
      });
      setCompanies(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      showToast(error.response?.data?.detail || "Unable to load companies.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const data = await fetchCompanyStats();
      setStats(data);
    } catch (error) {
      setStats((currentStats) => currentStats);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadCompanies(1, "");
      loadStats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const query = search.trim();
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const data = await fetchCompanies({
          page: 1,
          limit: 6,
          search: query,
          industry: industryFilter,
        });
        setSuggestions(data.items);
        setShowSuggestions(true);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [search, industryFilter]);

  function showToast(message, type = "success") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  async function handleSave(rows) {
    const result = await saveCompanies(rows);
    showToast(result.message || `${result.saved} companies saved!`);
    setModalOpen(false);
    await loadCompanies(1, search, industryFilter);
    await loadStats();
  }

  async function handleSignIn(credentials) {
    const response = await signIn(credentials);
    const { access_token: token, token_type: _tokenType, ...user } = response;
    setAuthToken(token);
    setAccessToken(token);
    setCurrentUser(user);
    navigate("/company", { replace: true });
  }

  async function handleSignUp(userData) {
    await signUp(userData);
    await handleSignIn({
      email: userData.email,
      password: userData.password,
    });
  }

  function handleLogout() {
    setAuthToken(null);
    setAccessToken(null);
    setCurrentUser(null);
    setCompanies([]);
    setSearch("");
    setIndustryFilter("");
    navigate("/home", { replace: true });
  }

  async function handleUpdate(row) {
    await updateCompany(companyBeingEdited.id, row);
    showToast("Company updated.");
    setCompanyBeingEdited(null);
    setModalOpen(false);
    await loadCompanies(page, search, industryFilter);
    await loadStats();
  }

  function openAddModal() {
    setCompanyBeingEdited(null);
    setModalOpen(true);
  }

  function openEditModal(company) {
    setCompanyBeingEdited(company);
    setModalOpen(true);
  }

  function closeModal() {
    setCompanyBeingEdited(null);
    setModalOpen(false);
  }

  async function handleDelete(id) {
    const shouldDelete = window.confirm("Delete this company? This action cannot be undone.");
    if (!shouldDelete) {
      return;
    }

    try {
      await deleteCompany(id);
      showToast("Company deleted.");
      await loadCompanies(page, search, industryFilter);
      await loadStats();
    } catch (error) {
      showToast(error.response?.data?.detail || "Unable to delete company.", "error");
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    setShowSuggestions(false);
    loadCompanies(1, search, industryFilter);
  }

  function handleSuggestionSelect(company) {
    setSearch(company.company_name);
    setShowSuggestions(false);
    loadCompanies(1, company.company_name, industryFilter);
  }

  function handleIndustryFilterChange(event) {
    const nextIndustry = event.target.value;
    setIndustryFilter(nextIndustry);
    setShowSuggestions(false);
    loadCompanies(1, search, nextIndustry);
  }

  function resetFilters() {
    setSearch("");
    setIndustryFilter("");
    setShowSuggestions(false);
    loadCompanies(1, "", "");
  }

  const dashboard = isAuthenticated ? (
    <main className={`dashboard-shell ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <aside className="sidebar" aria-hidden={!sidebarOpen}>
        <div className="sidebar-profile">
          <div className="avatar">{currentUser.name.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{currentUser.name}</strong>
            <span>{currentUser.email}</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard sections">
          <button className="active" type="button" onClick={resetFilters}>
            Dashboard
          </button>
        </nav>
      </aside>

      <section className="dashboard-main">
        <Navbar
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen((isOpen) => !isOpen)}
          onLogout={handleLogout}
        />

        <DashboardCards stats={stats} />

        <div className="content-grid">
          <section className="workspace-panel table-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Records</p>
                <h2>Company Directory</h2>
              </div>
            </div>

            <section className="toolbar" aria-label="Company filters">
              <form className="search-form" onSubmit={handleSearchSubmit}>
                <select
                  aria-label="Filter by industry"
                  className="filter-select"
                  value={industryFilter}
                  onChange={handleIndustryFilterChange}
                >
                  <option value="">All</option>
                  <option value="Private sector">Private sector</option>
                  <option value="Government">Government</option>
                </select>

                <div className="search-box">
                  <input
                    aria-label="Search companies"
                    autoComplete="off"
                    placeholder="Search by company name, company email, or industry"
                    value={search}
                    onBlur={() => window.setTimeout(() => setShowSuggestions(false), 140)}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setShowSuggestions(Boolean(event.target.value.trim()));
                    }}
                    onFocus={() => setShowSuggestions(Boolean(search.trim()))}
                  />
                  {showSuggestions && (
                    <div className="suggestions" role="listbox" aria-label="Company suggestions">
                      {suggestionsLoading && (
                        <div className="suggestion-status">Searching...</div>
                      )}
                      {!suggestionsLoading && suggestions.length === 0 && (
                        <div className="suggestion-status">No matches found</div>
                      )}
                      {!suggestionsLoading && suggestions.map((company) => (
                        <button
                          type="button"
                          className="suggestion-item"
                          key={company.id}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSuggestionSelect(company)}
                        >
                          <span>{company.company_name}</span>
                          <small>{company.email}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button type="button" onClick={resetFilters}>Reset</button>
                <button className="primary-button" type="submit">Search</button>
              </form>
            </section>

            <CompanyTable
              companies={companies}
              loading={loading}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />

            <footer className="pagination">
              <button
                disabled={page <= 1 || loading}
                onClick={() => loadCompanies(page - 1, search, industryFilter)}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => loadCompanies(page + 1, search, industryFilter)}
              >
                Next
              </button>
            </footer>
          </section>

          <aside className="workspace-panel insight-panel">
            <p className="eyebrow">Settings</p>
            <h2>Quick Controls</h2>
            <button type="button" onClick={() => handleIndustryFilterChange({ target: { value: "" } })}>
              View all companies
            </button>
            <button type="button" onClick={() => handleIndustryFilterChange({ target: { value: "Private sector" } })}>
              Private sector only
            </button>
            <button type="button" onClick={() => handleIndustryFilterChange({ target: { value: "Government" } })}>
              Government only
            </button>
            <button className="primary-button" type="button" onClick={openAddModal}>
              Add companies
            </button>
          </aside>
        </div>
      </section>

      {modalOpen && (
        <CompanyModal
          company={companyBeingEdited}
          mode={companyBeingEdited ? "edit" : "add"}
          onClose={closeModal}
          onSave={companyBeingEdited ? handleUpdate : handleSave}
          onToast={showToast}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </main>
  ) : null;

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate replace to={isAuthenticated ? "/company" : "/home"} />}
      />
      <Route
        path="/home"
        element={
          isAuthenticated
            ? <Navigate replace to="/company" />
            : <AuthPage onSignIn={handleSignIn} onSignUp={handleSignUp} />
        }
      />
      <Route
        path="/company"
        element={isAuthenticated ? dashboard : <Navigate replace to="/home" />}
      />
      <Route
        path="*"
        element={<Navigate replace to={isAuthenticated ? "/company" : "/home"} />}
      />
    </Routes>
  );
}
