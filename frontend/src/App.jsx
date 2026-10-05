import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
} from "recharts";

const API = "https://construction-expense-tracker.onrender.com";
const money = (v) => Number(v).toLocaleString("en-IN");
const today = () => new Date().toLocaleDateString("en-CA");
const COLORS = ["#d97706", "#2563eb", "#16a34a", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];
const smallBtn = { padding: "4px 8px", fontSize: 13, marginRight: 6 };

const OWNER = "";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function catIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("cement")) return "🧱";
  if (n.includes("steel") || n.includes("iron") || n.includes("rod")) return "🔩";
  if (n.includes("labour") || n.includes("labor") || n.includes("mason")) return "👷";
  if (n.includes("sand") || n.includes("stone") || n.includes("aggregate")) return "⛰️";
  if (n.includes("brick") || n.includes("block")) return "🧱";
  if (n.includes("paint")) return "🎨";
  if (n.includes("wood") || n.includes("door") || n.includes("window")) return "🪵";
  if (n.includes("electric") || n.includes("wire")) return "💡";
  if (n.includes("plumb") || n.includes("pipe") || n.includes("water")) return "🚰";
  if (n.includes("tile") || n.includes("floor")) return "🔲";
  if (n.includes("transport") || n.includes("truck")) return "🚚";
  return "🏗️";
}

function Hero({ sub, children }) {
  return (
    <div className="hero">
      <div className="hi">Hi{OWNER ? `, ${OWNER}` : ""} 👋</div>
      <div className="sub">{sub}</div>
      <div className="date">
        {new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </div>
      {children}
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [hasUser, setHasUser] = useState(null);
  const [auth, setAuth] = useState({ email: "", password: "" });
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState("");
  const [pickedDate, setPickedDate] = useState(today());
  const [showAll, setShowAll] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newProject, setNewProject] = useState({ name: "", location: "" });
  const [form, setForm] = useState({
    category: "",
    description: "",
    amount: "",
    expense_date: today(),
  });

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setProjects([]);
    setProjectId(null);
    setSummary(null);
    setExpenses([]);
    setEditingId(null);
  }

  async function api(path, options = {}) {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.status === 401 && token) logout();
    return res;
  }

  useEffect(() => {
    if (token) return;
    fetch(`${API}/has-user`)
      .then((r) => r.json())
      .then((d) => setHasUser(d.has_user))
      .catch(() => setError("Cannot reach the backend."));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api("/projects")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
          if (data.length > 0) setProjectId(data[0].id);
        }
      })
      .catch(() => setError("Cannot reach the backend."));
  }, [token]);

  async function loadProject(id) {
    const [s, e] = await Promise.all([
      api(`/projects/${id}/summary`).then((r) => r.json()),
      api(`/projects/${id}/expenses`).then((r) => r.json()),
    ]);
    setSummary(s);
    setExpenses(Array.isArray(e) ? e : []);
  }

  useEffect(() => {
    if (token && projectId) loadProject(projectId);
  }, [projectId]);

  async function submitAuth(ev) {
    ev.preventDefault();
    setError("");
    const path = hasUser ? "/login" : "/register";

    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(auth),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(
        typeof data.detail === "string"
          ? data.detail
          : "Check your email and use a password of 8 or more characters."
      );
      return;
    }

    localStorage.setItem("token", data.token);
    setToken(data.token);
    setAuth({ email: "", password: "" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      category: "",
      description: "",
      amount: "",
      expense_date: today(),
    });
  }

  async function saveExpense(ev) {
    ev.preventDefault();
    setError("");

    const body = JSON.stringify({
      ...form,
      amount: Number(form.amount),
    });

    const res = editingId
      ? await api(`/expenses/${editingId}`, {
          method: "PUT",
          body,
        })
      : await api(`/projects/${projectId}/expenses`, {
          method: "POST",
          body,
        });

    if (!res.ok) {
      setError("Could not save the expense. Check the fields.");
      return;
    }

    if (editingId) {
      resetForm();
    } else {
      setForm({
        ...form,
        category: "",
        description: "",
        amount: "",
      });
    }

    loadProject(projectId);
  }

  function startEdit(x) {
    setEditingId(x.id);

    setForm({
      category: x.category,
      description: x.description || "",
      amount: String(x.amount),
      expense_date: x.expense_date,
    });

    setTimeout(() => {
      const el = document.getElementById("expense-form");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  async function deleteExpense(x) {
    const ok = window.confirm(
      `Delete this expense?\n${x.expense_date} - ${x.category} - ₹${money(x.amount)}`
    );

    if (!ok) return;

    setError("");

    const res = await api(`/expenses/${x.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setError("Could not delete the expense.");
      return;
    }

    if (editingId === x.id) resetForm();

    loadProject(projectId);
  }

  async function addProject(ev) {
    ev.preventDefault();
    setError("");

    const res = await api("/projects", {
      method: "POST",
      body: JSON.stringify(newProject),
    });

    if (!res.ok) {
      setError("Could not create the project.");
      return;
    }

    const created = await res.json();

    setProjects([...projects, created]);
    setProjectId(created.id);
    setNewProject({ name: "", location: "" });
  }

  if (!token) {
    return (
      <div className="app">
        <Hero sub={`${greeting()}! 🏗️ Construction Expense Tracker`} />

        {error && <div className="error">{error}</div>}

        <div className="card">
          <h3>
            <span className="ico">🔐</span>
            {hasUser ? "Log in" : "Create your account"}
          </h3>

          {hasUser === false && (
            <p>
              First time here. This account will be the only one, so remember
              the password.
            </p>
          )}

          <form className="form" onSubmit={submitAuth}>
            <input
              type="email"
              placeholder="Email"
              value={auth.email}
              onChange={(e) =>
                setAuth({ ...auth, email: e.target.value })
              }
              required
            />

            <input
              type="password"
              placeholder="Password (8 or more characters)"
              value={auth.password}
              onChange={(e) =>
                setAuth({ ...auth, password: e.target.value })
              }
              required
            />

            <button type="submit">
              {hasUser ? "Log in" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const grand = summary ? Number(summary.grand_total) : 0;

  const pieData =
    summary && summary.by_category
      ? summary.by_category.map((c) => ({
          name: c.category,
          value: Number(c.total),
        }))
      : [];

  const byDate = {};

  expenses.forEach((x) => {
    byDate[x.expense_date] =
      (byDate[x.expense_date] || 0) + Number(x.amount);
  });

  const timeData = Object.keys(byDate)
    .sort()
    .map((d) => ({
      date: d,
      total: byDate[d],
    }));

  const dayExpenses = expenses.filter(
    (x) => x.expense_date === pickedDate
  );

  const dayTotal = dayExpenses.reduce(
    (s, x) => s + Number(x.amount),
    0
  );

  const rowButtons = (x) => (
    <td>
      <button
        type="button"
        style={smallBtn}
        onClick={() => startEdit(x)}
      >
        Edit
      </button>

      <button
        type="button"
        style={smallBtn}
        onClick={() => deleteExpense(x)}
      >
        Delete
      </button>
    </td>
  );

  return (
    <div className="app">
      <Hero sub={`${greeting()}! Here's how your site spending looks today.`}>
        <button
          type="button"
          className="logout"
          onClick={logout}
        >
          Log out
        </button>
      </Hero>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <h3>
          <span className="ico">🏠</span>
          Project
        </h3>

        <select
          value={projectId ?? ""}
          onChange={(e) =>
            setProjectId(Number(e.target.value))
          }
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.location ? ` — ${p.location}` : ""}
            </option>
          ))}
        </select>

        <details>
          <summary>+ New project</summary>

          <form className="form" onSubmit={addProject}>
            <input
              placeholder="Project name (e.g. House at Hebbal)"
              value={newProject.name}
              onChange={(e) =>
                setNewProject({
                  ...newProject,
                  name: e.target.value,
                })
              }
              required
            />

            <input
              placeholder="Location"
              value={newProject.location}
              onChange={(e) =>
                setNewProject({
                  ...newProject,
                  location: e.target.value,
                })
              }
            />

            <button type="submit">Create project</button>
          </form>
        </details>
      </div>

      {summary && summary.by_category && (
        <div className="card">
          <div className="total">
            <div className="label">💰 Total spent</div>
            <div className="amount">
              ₹{money(summary.grand_total)}
            </div>
          </div>

          {summary.by_category.map((c) => (
            <div className="cat" key={c.category}>
              <div className="cat-top">
                <span>
                  {catIcon(c.category)} {c.category}
                </span>

                <span>₹{money(c.total)}</span>
              </div>

              <div className="bar">
                <span
                  style={{
                    width: `${
                      grand > 0
                        ? (Number(c.total) / grand) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {pieData.length > 0 && (
        <div className="card">
          <h3>
            <span className="ico">🍩</span>
            Spending by category
          </h3>

          <div className="chart">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                >
                  {pieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(v) => `₹${money(v)}`}
                />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card">
        <h3>
          <span className="ico">📅</span>
          Check a day
        </h3>

        <input
          type="date"
          value={pickedDate}
          onChange={(e) =>
            setPickedDate(e.target.value)
          }
        />

        {dayExpenses.length === 0 ? (
          <p className="empty">
            Nothing spent on {pickedDate}.
          </p>
        ) : (
          <>
            <p>
              <b>
                Total on {pickedDate}: ₹{money(dayTotal)}
              </b>
            </p>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="num">Amount</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {dayExpenses.map((x) => (
                    <tr key={x.id}>
                      <td>
                        {catIcon(x.category)} {x.category}
                      </td>

                      <td>{x.description}</td>

                      <td className="num">
                        ₹{money(x.amount)}
                      </td>

                      {rowButtons(x)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          style={{ marginTop: 12 }}
        >
          {showAll
            ? "Hide chart"
            : "📊 Show everything so far"}
        </button>

        {showAll && timeData.length > 0 && (
          <div
            className="chart"
            style={{ marginTop: 12 }}
          >
            <ResponsiveContainer>
              <BarChart data={timeData}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => d.slice(5)}
                />

                <YAxis
                  tickFormatter={(v) => money(v)}
                  width={70}
                />

                <Tooltip
                  formatter={(v) => `₹${money(v)}`}
                />

                <Bar
                  dataKey="total"
                  fill="#d97706"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(d) => setPickedDate(d.date)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card" id="expense-form">
        <h3>
          <span className="ico">
            {editingId ? "✏️" : "➕"}
          </span>

          {editingId ? "Edit expense" : "Add expense"}
        </h3>

        <form className="form" onSubmit={saveExpense}>
          <input
            placeholder="Category (Cement, Steel, Labour)"
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value,
              })
            }
            required
          />

          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
          />

          <div className="row">
            <input
              type="number"
              placeholder="Amount (₹)"
              value={form.amount}
              onChange={(e) =>
                setForm({
                  ...form,
                  amount: e.target.value,
                })
              }
              required
            />

            <input
              type="date"
              value={form.expense_date}
              onChange={(e) =>
                setForm({
                  ...form,
                  expense_date: e.target.value,
                })
              }
              required
            />
          </div>

          <button type="submit">
            {editingId
              ? "Update expense"
              : "Save expense"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{ marginTop: 8 }}
            >
              Cancel edit
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <h3>
          <span className="ico">🧾</span>
          All expenses
        </h3>

        {expenses.length === 0 ? (
          <p className="empty">No expenses yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th className="num">Amount</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((x) => (
                  <tr key={x.id}>
                    <td>{x.expense_date}</td>

                    <td>
                      {catIcon(x.category)} {x.category}
                    </td>

                    <td>{x.description}</td>

                    <td className="num">
                      ₹{money(x.amount)}
                    </td>

                    {rowButtons(x)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}