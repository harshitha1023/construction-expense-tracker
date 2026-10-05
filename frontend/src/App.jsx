* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: #1f2937;
  background:
    linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px) 0 0 / 28px 28px,
    linear-gradient(90deg, rgba(255,255,255,.25) 1px, transparent 1px) 0 0 / 28px 28px,
    linear-gradient(160deg, #f59e0b 0%, #f97316 40%, #ec4899 100%);
  background-attachment: fixed;
  min-height: 100vh;
}

.app {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px;
}

.hero {
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  color: #fff;
  border-radius: 18px;
  padding: 22px 20px;
  margin-bottom: 16px;
  box-shadow: 0 10px 28px rgba(30, 58, 138, 0.35);
}
.hero .hi { font-size: 28px; font-weight: 700; }
.hero .sub { margin-top: 6px; opacity: 0.95; }
.hero .date { margin-top: 10px; font-size: 13px; opacity: 0.8; }
.hero .logout {
  margin-top: 12px;
  padding: 6px 12px;
  font-size: 13px;
  background: rgba(255,255,255,.2);
  border: 1px solid rgba(255,255,255,.4);
}

.card {
  background: #fff;
  border-radius: 16px;
  border-top: 5px solid #f59e0b;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  padding: 18px;
  margin-bottom: 16px;
}
.card h3 {
  display: flex;
  align-items: center;
  margin: 0 0 14px;
  font-size: 18px;
}

.ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-right: 10px;
  border-radius: 12px;
  font-size: 19px;
  background: linear-gradient(135deg, #fde68a, #fdba74);
}

input, select {
  width: 100%;
  padding: 10px 12px;
  font-size: 15px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #fff;
  color: #1f2937;
}
input:focus, select:focus {
  outline: 2px solid #f59e0b;
  border-color: #f59e0b;
}

button {
  padding: 10px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  border: none;
  border-radius: 10px;
  cursor: pointer;
}
button:hover { filter: brightness(1.08); }

details { margin-top: 12px; }
summary { cursor: pointer; font-weight: 600; color: #b45309; }

.form { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
.row { display: flex; gap: 10px; }
.row input { flex: 1; min-width: 0; }

.total { margin-bottom: 16px; }
.total .label { font-size: 14px; color: #6b7280; }
.total .amount { font-size: 34px; font-weight: 800; color: #b45309; }

.cat { margin-top: 12px; }
.cat-top {
  display: flex;
  justify-content: space-between;
  font-size: 15px;
  margin-bottom: 4px;
}
.cat-top span:first-child { font-weight: 600; }
.bar {
  height: 10px;
  background: #fef3c7;
  border-radius: 999px;
  overflow: hidden;
}
.bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #ea580c);
  border-radius: 999px;
}

.chart { width: 100%; height: 260px; }

.table-wrap { overflow-x: auto; margin-top: 8px; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th, td {
  padding: 8px 6px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap;
}
th { color: #6b7280; font-weight: 600; }
.num { text-align: right; }

.empty { color: #6b7280; margin: 12px 0; }

.error {
  background: #fee2e2;
  color: #991b1b;
  border-left: 5px solid #dc2626;
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 16px;
}