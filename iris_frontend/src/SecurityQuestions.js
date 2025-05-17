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
    `http://localhost:3000/api/security/get-security-question?email=${encodeURIComponent(
      email
    )}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (data.question1 && data.question2 && data.question3) {
        const qList = [data.question1, data.question2, data.question3];
        const aList = [data.answer1, data.answer2, data.answer3];
        setQuestions(qList);
        setAnswers(aList);
      } else {
        alert("No security questions found.");
        navigate("/");
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
              Save Changes
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SecurityQuestions;