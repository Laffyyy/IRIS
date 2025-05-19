import React, { useState, useEffect } from "react";
import "./SecurityQuestions.css";
import { useNavigate, useLocation } from "react-router-dom";

const SecurityQuestions = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "";
  const fromOtp = location.state?.fromOtp || false;
  const isVerified = location.state?.isVerified || false;

  const [randomQuestion, setRandomQuestion] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(
    location.state?.selectedQuestion || ""
  );
  const [answer, setAnswer] = useState(location.state?.answer || "");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!email) return;

    fetch(
      `http://localhost:3000/api/security/get-security-question?email=${encodeURIComponent(
        email
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        const pairs = [];
        if (data.question1 && data.answer1)
          pairs.push({ q: data.question1, a: data.answer1 });
        if (data.question2 && data.answer2)
          pairs.push({ q: data.question2, a: data.answer2 });
        if (data.question3 && data.answer3)
          pairs.push({ q: data.question3, a: data.answer3 });

        if (pairs.length === 0) {
          alert("No security questions found.");
          navigate("/");
        } else {
          // Pick one random pair
          const randomPair = pairs[Math.floor(Math.random() * pairs.length)];
          setRandomQuestion(randomPair.q);
          setCorrectAnswer(randomPair.a);

          // Set selectedQuestion to match the random question
          setSelectedQuestion(randomPair.q);

          // If coming back from update password, restore state
          if (location.state?.selectedQuestion === randomPair.q) {
            setSelectedQuestion(location.state.selectedQuestion);
            setAnswer(location.state.answer || "");
          } else {
            setAnswer("");
          }
          setAttempts(0); // Reset attempts on question load
        }
      })
      .catch(() => {
        alert("No security questions found for this account");
        navigate("/");
      });
  }, [email, fromOtp, isVerified, navigate, location.state]);

  const handleQuestionChange = (e) => {
    setSelectedQuestion(e.target.value);
    setAnswer("");
    setAttempts(0); // Reset attempts if question changes
  };

  const handleAnswerChange = (e) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z\s-]/g, "");
    const truncatedValue = filteredValue.slice(0, 30);
    setAnswer(truncatedValue);
  };

  const normalize = (str) =>
    str ? str.toLowerCase().trim() : "";

  const handleSaveChanges = (e) => {
    e.preventDefault();

    if (
      normalize(answer) === normalize(correctAnswer)
    ) {
      // Save to localStorage
      localStorage.setItem("iris_selected_question", selectedQuestion);
      localStorage.setItem("iris_answer_field", answer);
      localStorage.setItem("iris_email", email);

      setAttempts(0);
      navigate("/update-password", {
        state: {
          email,
          selectedQuestion,
          answer,
        },
      });
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        alert("You have reached the maximum number of attempts. Redirecting to login.");
        navigate("/");
      } else {
        alert(`Incorrect answer. Attempt ${newAttempts} of 3.`);
        setAnswer("");
      }
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
              <label>Security Question</label>
              <div style={{ marginBottom: "1em", fontWeight: "bold" }}>
                {randomQuestion}
              </div>
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