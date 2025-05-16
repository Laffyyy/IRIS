import React, { useState, useEffect } from "react";
import "./SecurityQuestions.css";
import { useNavigate, useLocation } from "react-router-dom";

const SecurityQuestions = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "";
  const fromOtp = location.state?.fromOtp || false;
  const isVerified = location.state?.isVerified || false;

  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    if (!email) return;

    fetch(
      `http://localhost:3000/api/security/get-security-questions?email=${encodeURIComponent(
        email
      )}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("No questions found");
        return res.json();
      })
      .then((data) => {
        const q = [];
        const a = [];

        if (data.dSecurity_Question1 && data.dAnswer_1) {
          q.push(data.dSecurity_Question1);
          a.push(data.dAnswer_1);
        }
        if (data.dSecurity_Question2 && data.dAnswer_2) {
          q.push(data.dSecurity_Question2);
          a.push(data.dAnswer_2);
        }
        if (data.dSecurity_Question3 && data.dAnswer_3) {
          q.push(data.dSecurity_Question3);
          a.push(data.dAnswer_3);
        }

        if (q.length === 0) {
          alert("No security questions configured for this account");
          navigate("/");
        } else {
          setQuestions(q);
          setAnswers(a);

          // Only set initial question if coming from update password flow
          if (isVerified) {
            setSelectedQuestion(location.state?.selectedQuestion || q[0]);
            setAnswer(location.state?.answer || "");
          }
        }
      })
      .catch(() => {
        alert("No security questions found for this account");
        navigate("/");
      });
  }, [email, fromOtp, isVerified, navigate, location.state]);

  const handleQuestionChange = (e) => {
    setSelectedQuestion(e.target.value);
  };

  const handleAnswerChange = (e) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z\s-]/g, "");
    const truncatedValue = filteredValue.slice(0, 30);
    setAnswer(truncatedValue);
  };

  const normalize = (str) =>
    str ? str.replace(/[\s-]/g, "").toLowerCase().trim() : "";

  const handleSaveChanges = (e) => {
    e.preventDefault();
    localStorage.setItem("iris_selected_question", selectedQuestion);
    localStorage.setItem("iris_answer_field", answer);
    localStorage.setItem("iris_email", email);

    const idx = questions.indexOf(selectedQuestion);

    if (idx === -1) {
      alert("Please select a security question");
      return;
    }

    if (normalize(answer) === normalize(answers[idx])) {
      navigate("/update-password", { state: { email } });
    } else {
      alert("Incorrect answer");
      setAnswer("");
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="security-questions-container">
      <h2>
        {isVerified
          ? "Continue Security Verification"
          : "Security Verification"}
      </h2>
      <p className="subtitle">
        {isVerified
          ? "Complete your security verification"
          : "Answer your security question to verify your identity"}
      </p>

      {!fromOtp && (
        <form className="form-grid" onSubmit={handleSaveChanges}>
          <div className="form-section">
            <h3>Security Question</h3>
            <div className="security-question-group">
              <label htmlFor="security-question">Security Question</label>
              <select
                id="security-question"
                value={selectedQuestion}
                onChange={handleQuestionChange}
                required
              >
                <option value="">Select a question</option>
                {questions.map((q, idx) => (
                  <option key={idx} value={q}>
                    {q}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Your answer"
                value={answer}
                onChange={handleAnswerChange}
                maxLength={30}
                required
              />
            </div>
          </div>

          <div className="form-buttons">
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {isVerified ? "Continue" : "Verify Answer"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SecurityQuestions;
