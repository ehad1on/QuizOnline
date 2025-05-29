import React, { useEffect, useState } from "react";
import { db } from "./firebaseConfig";
import { collection, getDocs, addDoc, Timestamp, query, where } from "firebase/firestore";
import "./styles.css"; // Add this line for CSS animations

function App() {
  const [username, setUsername] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20); // Changed to 20 seconds
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeoutMessage, setTimeoutMessage] = useState(false);
  const [nameError, setNameError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getDocs(collection(db, "questions"));
      const q = data.docs.map(doc => doc.data());
      setAllQuestions(q);
    };
    fetchData();
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (allQuestions.length > 0) {
      const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
      setQuestions(shuffled.slice(0, 10));
    }
  }, [allQuestions]);

  useEffect(() => {
    if (!showResult && timeLeft > 0 && hasStarted) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (timeLeft === 0 && selected === null && !showResult) {
      setTimeoutMessage(true);
      setSelected(-1);
      setTimeout(() => {
        goNext();
        setTimeoutMessage(false);
      }, 1000);
    }
  }, [timeLeft, selected, showResult, hasStarted]);

  const checkIfNameExists = async (name) => {
    const q = query(collection(db, "scores"), where("name", "==", name));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setNameError("Name cannot be empty");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const nameExists = await checkIfNameExists(username);
      if (nameExists) {
        setNameError("This name has already been used. Please use a different name.");
        return;
      }
      
      await addDoc(collection(db, "scores"), {
        name: username,
        score: score,
        timestamp: Timestamp.now()
      });
      fetchLeaderboard();
    } catch (error) {
      console.error("Error saving score:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchLeaderboard = async () => {
    const snapshot = await getDocs(collection(db, "scores"));
    const data = snapshot.docs.map(doc => doc.data());
    data.sort((a, b) => b.score - a.score || a.timestamp?.seconds - b.timestamp?.seconds);
    setLeaderboard(data.slice(0, 10));
  };

  const goNext = () => {
    setSelected(null);
    setTimeLeft(20); // Changed to 20 seconds
    if (index + 1 < questions.length) {
      setIndex(prev => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleClick = (i) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === questions[index].correct) {
      setScore(prev => prev + 1);
    }
    setTimeout(() => goNext(), 1000);
  };

  if (!hasStarted) {
    return (
      <div className="start-container">
        <h2 className="welcome-title">Welcome to Our Quiz!</h2>
        <p className="welcome-subtitle">Test your knowledge and compete with others</p>
        
        <div className="input-container">
          <input
            type="text"
            value={username}
            onChange={e => {
              setUsername(e.target.value);
              setNameError("");
            }}
            placeholder="Enter your full name"
            className="name-input"
          />
          {nameError && <p className="error-message">{nameError}</p>}
        </div>
        
        <button
          onClick={() => {
            if (username.trim().length >= 2) {
              setHasStarted(true);
            } else {
              setNameError("Name must be at least 2 characters");
            }
          }}
          className="start-button"
        >
          Start Quiz
        </button>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="result-container">
        <h2>Congratulations {username}!</h2>
        <p className="score-display">Your Score: {score} / {questions.length}</p>
        
        <div className="result-buttons">
          <button 
            onClick={handleSave} 
            disabled={isSubmitting}
            className={`save-button ${isSubmitting ? 'loading' : ''}`}
          >
            {isSubmitting ? 'Saving...' : 'Save Score'}
          </button>
          <button onClick={() => window.location.reload()} className="retry-button">
            Try Again
          </button>
        </div>

        {leaderboard.length > 0 && (
          <div className="leaderboard-container">
            <h3>Leaderboard (Top 10)</h3>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Score</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => (
                  <tr 
                    key={idx} 
                    className={entry.name === username ? 'highlighted-row' : ''}
                  >
                    <td>{idx + 1}</td>
                    <td>{entry.name}</td>
                    <td>{entry.score}</td>
                    <td>{entry.timestamp?.toDate?.().toLocaleString() || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (questions.length === 0) return <div className="loading-screen">Loading Questions...</div>;

  const q = questions[index];
  const progressPercentage = (timeLeft / 20) * 100; // Changed to 20 seconds
  const progressColor = progressPercentage > 50 ? 
    `hsl(${progressPercentage * 1.2}, 100%, 50%)` : 
    `hsl(0, 100%, ${50 + progressPercentage}%)`;

  return (
    <div className="quiz-screen">
      <div className="timer-display">
        <div className="timer-icon">
          <img src="https://cdn-icons-png.flaticon.com/512/545/545674.png" alt="timer" />
        </div>
        <div className="timer-bar-container">
          <div 
            className="timer-progress" 
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: progressColor
            }}
          ></div>
        </div>
        <span className="timer-text">{timeLeft}s</span>
      </div>

      <h2 className="question-text">{q.question}</h2>

      {timeoutMessage && <p className="timeout-alert">⏰ Time ran out!</p>}

      <div className="options-grid">
        {q.options.map((opt, i) => {
          let buttonClass = "option-button";
          if (selected !== null) {
            if (i === q.correct) {
              buttonClass += " correct";
            } else if (i === selected) {
              buttonClass += " wrong";
            } else {
              buttonClass += " disabled";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={buttonClass}
              disabled={selected !== null}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default App;