import React from "react";
import { useNavigate } from "react-router-dom";

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#f8f9fa",
  },
  card: {
    background: "#fff",
    padding: "40px 30px",
    borderRadius: "12px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
    textAlign: "center",
    maxWidth: "350px",
  },
  icon: {
    fontSize: "48px",
    color: "#e74c3c",
    marginBottom: "16px",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "12px",
    color: "#333",
  },
  message: {
    fontSize: "1rem",
    color: "#666",
    marginBottom: "24px",
  },
  button: {
    padding: "10px 24px",
    background: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    textDecoration: "none",
  },
};

function Unauthorize() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>🚫</div>
        <div style={styles.title}>Unauthorized</div>
        <div style={styles.message}>
          You do not have permission to view this page.
          <br />
          Please login or contact the administrator.
        </div>
        <button
          style={styles.button}
          onClick={() => {
            const roles = getUserRoles();
            if (roles.includes("admin")) {
              navigate("/admin/dashboard");
            } else if (roles.includes("HR")) {
              navigate("/hr");
            } else if (roles.includes("CNB")) {
              navigate("/compensation");
            } else if (roles.includes("REPORTS")) {
              navigate("/reports");
            }  else {
              navigate("/");
            }
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

export default Unauthorize;
