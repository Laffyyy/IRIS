// Otp.js
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "./Otp.css";

const Otp = ({ onBack, onComplete }) => {
  const navigate = useNavigate(); // Initialize useNavigate
  const inputsRef = useRef([]);
  const [expireTime, setExpireTime] = useState(180); // 3 minutes
  const [resendTime, setResendTime] = useState(90);
  const [canResend, setCanResend] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [otpValues, setOtpValues] = useState(Array(6).fill(""));

  useEffect(() => {
    if (expireTime > 0) {
      const timer = setTimeout(() => setExpireTime(expireTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [expireTime]);

  useEffect(() => {
    if (resendTime > 0 && !canResend) {
      const timer = setTimeout(() => setResendTime(resendTime - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTime, canResend]);

  useEffect(() => {
    const allFilled = otpValues.every((value) => value !== "");
    setIsComplete(allFilled);

    if (allFilled) {
      document.getElementById("otp-submit-button").focus();
    }
  }, [otpValues]);

  const handleResendCode = () => {
    if (!canResend) return;
    setResendTime(90);
    setExpireTime(180);
    setCanResend(false);
    setOtpValues(Array(6).fill(""));
    inputsRef.current.forEach((input) => {
      if (input) input.value = "";
    });
    inputsRef.current[0]?.focus();
  };

  const handleInputChange = (e, index) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^A-Z0-9]/g, "");

    if (value.length > 1) return;

    e.target.value = value;
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      const newOtpValues = [...otpValues];
      newOtpValues[index] = "";
      setOtpValues(newOtpValues);
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData("Text").toUpperCase();
    const filtered = pastedData.replace(/[^A-Z0-9]/g, "").slice(0, 6);

    if (filtered.length === 6) {
      const newOtpValues = Array(6).fill("");
      filtered.split("").forEach((char, i) => {
        inputsRef.current[i].value = char;
        newOtpValues[i] = char;
      });
      setOtpValues(newOtpValues);
      inputsRef.current[5].focus();
    }
    e.preventDefault();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = () => {
    if (isComplete) {
      // Trigger onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
      // Navigate to the Security Questions page
      navigate("/security-questions");
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-card">
        <img
          src="/assets/logo.png"
          alt="IRIS Logo"
          className="otp-logo"
          draggable={false}
        />
        <h2 className="otp-title">IRIS</h2>
        <p className="otp-subtitle">Incentive Reporting & Insight Solution</p>

        <div className="otp-alert">
          A one-time passcode has been sent to your registered email.
        </div>

        <label className="otp-label">Enter OTP</label>
        <div className="otp-input-group" onPaste={handlePaste}>
          {Array(6)
            .fill("")
            .map((_, i) => (
              <input
                key={i}
                type="text"
                maxLength="1"
                className="otp-input"
                inputMode="numeric"
                onChange={(e) => handleInputChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                ref={(el) => (inputsRef.current[i] = el)}
              />
            ))}
        </div>

        <div className="otp-footer">
          <p className="otp-expiry">
            {expireTime > 0
              ? `Code will expire in ${formatTime(expireTime)}`
              : "The code has expired"}
          </p>
          <button
            className="resend-otp"
            onClick={handleResendCode}
            disabled={!canResend}
          >
            {canResend ? "Resend Code" : `Resend in ${formatTime(resendTime)}`}
          </button>
        </div>

        <div className="otp-button-group">
          <button className="otp-back" onClick={onBack || (() => navigate(-1))}>
            Back
          </button>
          <button
            id="otp-submit-button"
            className={`otp-submit ${isComplete ? "otp-submit-enabled" : ""}`}
            onClick={handleSubmit}
            disabled={!isComplete}
            type="button"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Otp;
